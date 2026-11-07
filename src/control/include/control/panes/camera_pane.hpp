#pragma once

#include <SDL3/SDL.h>

#include <cstdint>
#include <memory>
#include <string>

#include "control/pane.hpp"
#include "sensor_msgs/msg/image.hpp"

namespace control
{

// Displays the newest frame of one camera feed, scaled to fit and centered in the pane.
class CameraPane : public Pane
{
public:
  // The device must outlive the pane.
  CameraPane(std::string name, GridSpan span, const Comm & comm, SDL_GPUDevice * device);

  const char * name() const override { return name_.c_str(); }
  GridSpan span() const override { return span_; }
  void update(const Comm & comm, const Gamepad & gamepad, const std::string & current_tab) override;
  void draw() override;

private:
  struct GpuRelease
  {
    SDL_GPUDevice * device;

    void operator()(SDL_GPUTexture * texture) const { SDL_ReleaseGPUTexture(device, texture); }
    void operator()(SDL_GPUTransferBuffer * buffer) const { SDL_ReleaseGPUTransferBuffer(device, buffer); }
  };

  // Converts the frame to RGBA and uploads it to the texture. On failure, sets error_ instead.
  void upload(const sensor_msgs::msg::Image & image);

  // Recreates the texture and transfer buffer for a new frame size.
  bool resize(std::uint32_t width, std::uint32_t height);

  const std::string name_;
  const GridSpan span_;
  SDL_GPUDevice * const device_;

  Subscriber<sensor_msgs::msg::Image> image_sub_;

  std::unique_ptr<SDL_GPUTexture, GpuRelease> texture_;
  std::unique_ptr<SDL_GPUTransferBuffer, GpuRelease> transfer_;
  std::uint32_t width_ = 0;
  std::uint32_t height_ = 0;

  // Why the latest frame could not be shown. Empty when it was.
  std::string error_;
};

}  // namespace control
