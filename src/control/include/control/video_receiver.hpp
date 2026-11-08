#pragma once

#include <atomic>
#include <cstdint>
#include <memory>
#include <mutex>
#include <thread>
#include <vector>

#include <uvgrtp/lib.hh>

extern "C" {
#include <libavcodec/avcodec.h>
}

namespace control
{

// Frees FFmpeg objects held by unique_ptr.
struct AvFree
{
  void operator()(AVCodecContext * context) const { avcodec_free_context(&context); }
  void operator()(AVPacket * packet) const { av_packet_free(&packet); }
  void operator()(AVFrame * frame) const { av_frame_free(&frame); }
};

using Picture = std::unique_ptr<AVFrame, AvFree>;

// Receives an RTP/H.264 stream and decodes it on a background thread, keeping only the newest picture.
class VideoReceiver
{
public:
  // Listens on the port across all interfaces. Throws std::runtime_error if the stream or decoder can't be set up.
  explicit VideoReceiver(std::uint16_t port);
  ~VideoReceiver();

  VideoReceiver(const VideoReceiver &) = delete;
  VideoReceiver & operator=(const VideoReceiver &) = delete;

  // The newest picture decoded since the previous take(), or null if none was. Older untaken pictures are dropped.
  Picture take();

private:
  // Pulls NAL units until stopped, decoding each access unit once complete.
  void run();

  // Decodes and clears the buffered access unit, publishing any picture it completes.
  void decode();

  uvgrtp::context rtp_;
  uvgrtp::session * session_ = nullptr;
  uvgrtp::media_stream * stream_ = nullptr;

  std::unique_ptr<AVCodecContext, AvFree> decoder_;
  std::unique_ptr<AVPacket, AvFree> packet_;

  // Receive thread only.
  std::vector<std::uint8_t> access_unit_;
  std::uint32_t timestamp_ = 0;

  std::mutex mutex_;
  Picture newest_;

  std::atomic<bool> running_{true};
  std::thread thread_;
};

}  // namespace control
