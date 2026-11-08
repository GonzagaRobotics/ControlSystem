#include "control/panes/camera_pane.hpp"

#include <libyuv.h>

#include <algorithm>
#include <cstddef>
#include <stdexcept>
#include <utility>

#include "imgui.h"

extern "C" {
#include <libavutil/pixdesc.h>
}

namespace control
{

namespace
{

constexpr std::size_t RGBA_BYTES = 4;

}  // namespace

CameraPane::CameraPane(std::string name, GridSpan span, std::uint16_t port, SDL_GPUDevice * device)
: name_(std::move(name)),
  span_(span),
  device_(device),
  texture_(nullptr, GpuRelease{device}),
  transfer_(nullptr, GpuRelease{device})
{
  try {
    receiver_ = std::make_unique<VideoReceiver>(port);
  } catch (const std::runtime_error & e) {
    error_ = e.what();
  }
}

void CameraPane::update(const Comm &, const Gamepad &, const std::string &)
{
  if (!receiver_) {
    return;
  }

  if (const Picture picture = receiver_->take()) {
    upload(*picture);
  }
}

void CameraPane::draw()
{
  if (!error_.empty()) {
    ImGui::TextUnformatted(error_.c_str());
    return;
  }

  if (!texture_) {
    ImGui::TextUnformatted("No image");
    return;
  }

  const ImVec2 avail = ImGui::GetContentRegionAvail();
  const float scale = std::max(0.0f, std::min(avail.x / width_, avail.y / height_));
  const ImVec2 size(width_ * scale, height_ * scale);
  const ImVec2 origin = ImGui::GetCursorPos();

  ImGui::SetCursorPos(ImVec2(origin.x + (avail.x - size.x) * 0.5f, origin.y + (avail.y - size.y) * 0.5f));
  ImGui::Image(static_cast<ImTextureID>(reinterpret_cast<std::intptr_t>(texture_.get())), size);
}

void CameraPane::upload(const AVFrame & picture)
{
  const auto format = static_cast<AVPixelFormat>(picture.format);

  // Baseline H.264 decodes to 8 bit 4:2:0, in limited or full range.
  if (format != AV_PIX_FMT_YUV420P && format != AV_PIX_FMT_YUVJ420P) {
    const char * const format_name = av_get_pix_fmt_name(format);
    error_ = std::string("Unsupported pixel format: ") + (format_name ? format_name : "unknown");
    return;
  }

  if (picture.width <= 0 || picture.height <= 0) {
    error_ = "Empty picture";
    return;
  }

  const auto width = static_cast<std::uint32_t>(picture.width);
  const auto height = static_cast<std::uint32_t>(picture.height);

  if ((width != width_ || height != height_ || !texture_) && !resize(width, height)) {
    error_ = SDL_GetError();
    return;
  }

  // Cycling lets the GPU keep reading the previous frame while this one is written.
  auto * const dst = static_cast<std::uint8_t *>(SDL_MapGPUTransferBuffer(device_, transfer_.get(), true));
  if (!dst) {
    error_ = SDL_GetError();
    return;
  }

  // libyuv names formats by 32 bit word, so ABGR is RGBA in byte order.
  const auto convert = format == AV_PIX_FMT_YUVJ420P ? libyuv::J420ToABGR : libyuv::I420ToABGR;
  convert(
    picture.data[0], picture.linesize[0], picture.data[1], picture.linesize[1], picture.data[2], picture.linesize[2],
    dst, static_cast<int>(width_ * RGBA_BYTES), static_cast<int>(width_), static_cast<int>(height_));

  SDL_UnmapGPUTransferBuffer(device_, transfer_.get());

  SDL_GPUCommandBuffer * const command_buffer = SDL_AcquireGPUCommandBuffer(device_);
  if (!command_buffer) {
    error_ = SDL_GetError();
    return;
  }

  SDL_GPUTextureTransferInfo source = {};
  source.transfer_buffer = transfer_.get();

  SDL_GPUTextureRegion destination = {};
  destination.texture = texture_.get();
  destination.w = width_;
  destination.h = height_;
  destination.d = 1;

  SDL_GPUCopyPass * const copy_pass = SDL_BeginGPUCopyPass(command_buffer);
  SDL_UploadToGPUTexture(copy_pass, &source, &destination, true);
  SDL_EndGPUCopyPass(copy_pass);
  SDL_SubmitGPUCommandBuffer(command_buffer);

  error_.clear();
}

bool CameraPane::resize(std::uint32_t width, std::uint32_t height)
{
  texture_.reset();
  transfer_.reset();
  width_ = 0;
  height_ = 0;

  SDL_GPUTextureCreateInfo texture_info = {};
  texture_info.type = SDL_GPU_TEXTURETYPE_2D;
  texture_info.format = SDL_GPU_TEXTUREFORMAT_R8G8B8A8_UNORM;
  texture_info.usage = SDL_GPU_TEXTUREUSAGE_SAMPLER;
  texture_info.width = width;
  texture_info.height = height;
  texture_info.layer_count_or_depth = 1;
  texture_info.num_levels = 1;
  texture_info.sample_count = SDL_GPU_SAMPLECOUNT_1;

  SDL_GPUTransferBufferCreateInfo transfer_info = {};
  transfer_info.usage = SDL_GPU_TRANSFERBUFFERUSAGE_UPLOAD;
  transfer_info.size = width * height * RGBA_BYTES;

  texture_.reset(SDL_CreateGPUTexture(device_, &texture_info));
  transfer_.reset(SDL_CreateGPUTransferBuffer(device_, &transfer_info));

  if (!texture_ || !transfer_) {
    texture_.reset();
    transfer_.reset();
    return false;
  }

  width_ = width;
  height_ = height;

  return true;
}

}  // namespace control
