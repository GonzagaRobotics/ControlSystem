#include "control/panes/camera_pane.hpp"

#include <algorithm>
#include <cstddef>
#include <utility>

#include "imgui.h"
#include "sensor_msgs/image_encodings.hpp"

namespace control
{

namespace
{

namespace enc = sensor_msgs::image_encodings;

constexpr std::size_t RGBA_BYTES = 4;

enum class Format
{
  RGB8,
  BGR8,
  RGBA8,
  BGRA8,
  MONO8,
  UYVY,
  YUYV,
  NV21,
  UNSUPPORTED,
};

Format parse_format(const std::string & encoding)
{
  if (encoding == enc::RGB8) {
    return Format::RGB8;
  }
  if (encoding == enc::BGR8) {
    return Format::BGR8;
  }
  if (encoding == enc::RGBA8) {
    return Format::RGBA8;
  }
  if (encoding == enc::BGRA8) {
    return Format::BGRA8;
  }
  if (encoding == enc::MONO8) {
    return Format::MONO8;
  }
  if (encoding == enc::UYVY || encoding == enc::YUV422) {
    return Format::UYVY;
  }
  if (encoding == enc::YUYV || encoding == enc::YUV422_YUY2) {
    return Format::YUYV;
  }
  if (encoding == enc::NV21) {
    return Format::NV21;
  }
  return Format::UNSUPPORTED;
}

// Whether the buffer holds a complete frame of the format, so conversion stays in bounds.
bool is_well_formed(const sensor_msgs::msg::Image & image, Format format)
{
  const std::size_t width = image.width;
  const std::size_t height = image.height;
  const std::size_t step = image.step;

  if (width == 0 || height == 0) {
    return false;
  }

  switch (format) {
    case Format::RGB8:
    case Format::BGR8:
      return step >= width * 3 && image.data.size() >= step * height;

    case Format::RGBA8:
    case Format::BGRA8:
      return step >= width * 4 && image.data.size() >= step * height;

    case Format::MONO8:
      return step >= width && image.data.size() >= step * height;

    // Chroma is shared by horizontal pixel pairs.
    case Format::UYVY:
    case Format::YUYV:
      return width % 2 == 0 && step >= width * 2 && image.data.size() >= step * height;

    // A luma plane followed by a half height interleaved VU plane, both rows of step bytes.
    case Format::NV21:
      return width % 2 == 0 && height % 2 == 0 && step >= width && image.data.size() >= step * height * 3 / 2;

    case Format::UNSUPPORTED:
      return false;
  }

  return false;
}

std::uint8_t clamp_byte(int value)
{
  return static_cast<std::uint8_t>(std::clamp(value, 0, 255));
}

// BT.601 limited range, the usual choice for camera YUV.
void yuv_to_rgba(int y, int u, int v, std::uint8_t * out)
{
  const int c = 298 * (y - 16);
  const int d = u - 128;
  const int e = v - 128;

  out[0] = clamp_byte((c + 409 * e + 128) >> 8);
  out[1] = clamp_byte((c - 100 * d - 208 * e + 128) >> 8);
  out[2] = clamp_byte((c + 516 * d + 128) >> 8);
  out[3] = 255;
}

// Writes the frame as tightly packed RGBA. The frame must be well formed.
void convert_to_rgba(const sensor_msgs::msg::Image & image, Format format, std::uint8_t * dst)
{
  const std::size_t width = image.width;
  const std::size_t height = image.height;
  const std::size_t step = image.step;
  const std::uint8_t * const data = image.data.data();

  for (std::size_t row = 0; row < height; ++row) {
    const std::uint8_t * src = data + row * step;
    std::uint8_t * out = dst + row * width * RGBA_BYTES;

    switch (format) {
      case Format::RGB8:
      case Format::BGR8: {
        const bool bgr = format == Format::BGR8;
        for (std::size_t x = 0; x < width; ++x, src += 3, out += RGBA_BYTES) {
          out[0] = src[bgr ? 2 : 0];
          out[1] = src[1];
          out[2] = src[bgr ? 0 : 2];
          out[3] = 255;
        }
        break;
      }

      case Format::RGBA8:
        std::copy(src, src + width * RGBA_BYTES, out);
        break;

      case Format::BGRA8:
        for (std::size_t x = 0; x < width; ++x, src += 4, out += RGBA_BYTES) {
          out[0] = src[2];
          out[1] = src[1];
          out[2] = src[0];
          out[3] = src[3];
        }
        break;

      case Format::MONO8:
        for (std::size_t x = 0; x < width; ++x, ++src, out += RGBA_BYTES) {
          out[0] = out[1] = out[2] = *src;
          out[3] = 255;
        }
        break;

      case Format::UYVY:
        for (std::size_t x = 0; x < width; x += 2, src += 4, out += 2 * RGBA_BYTES) {
          yuv_to_rgba(src[1], src[0], src[2], out);
          yuv_to_rgba(src[3], src[0], src[2], out + RGBA_BYTES);
        }
        break;

      case Format::YUYV:
        for (std::size_t x = 0; x < width; x += 2, src += 4, out += 2 * RGBA_BYTES) {
          yuv_to_rgba(src[0], src[1], src[3], out);
          yuv_to_rgba(src[2], src[1], src[3], out + RGBA_BYTES);
        }
        break;

      case Format::NV21: {
        const std::uint8_t * vu = data + (height + row / 2) * step;
        for (std::size_t x = 0; x < width; ++x, ++src, out += RGBA_BYTES) {
          const std::size_t pair = x / 2 * 2;
          yuv_to_rgba(*src, vu[pair + 1], vu[pair], out);
        }
        break;
      }

      case Format::UNSUPPORTED:
        return;
    }
  }
}

}  // namespace

CameraPane::CameraPane(std::string name, GridSpan span, const Comm & comm, SDL_GPUDevice * device)
: name_(std::move(name)),
  span_(span),
  device_(device),
  image_sub_(comm.subscriber<sensor_msgs::msg::Image>("/image_raw", rclcpp::SensorDataQoS())),
  texture_(nullptr, GpuRelease{device}),
  transfer_(nullptr, GpuRelease{device})
{
}

void CameraPane::update(const Comm &, const Gamepad &, const std::string &)
{
  if (const sensor_msgs::msg::Image::ConstSharedPtr image = image_sub_.take()) {
    upload(*image);
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

void CameraPane::upload(const sensor_msgs::msg::Image & image)
{
  const Format format = parse_format(image.encoding);

  if (format == Format::UNSUPPORTED) {
    error_ = "Unsupported encoding: " + image.encoding;
    return;
  }

  if (!is_well_formed(image, format)) {
    error_ = "Malformed " + image.encoding + " frame";
    return;
  }

  if ((image.width != width_ || image.height != height_ || !texture_) && !resize(image.width, image.height)) {
    error_ = SDL_GetError();
    return;
  }

  // Cycling lets the GPU keep reading the previous frame while this one is written.
  auto * const dst = static_cast<std::uint8_t *>(SDL_MapGPUTransferBuffer(device_, transfer_.get(), true));
  if (!dst) {
    error_ = SDL_GetError();
    return;
  }

  convert_to_rgba(image, format, dst);
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
