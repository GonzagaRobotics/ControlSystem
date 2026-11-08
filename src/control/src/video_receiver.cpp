#include "control/video_receiver.hpp"

#include <stdexcept>
#include <string>
#include <utility>

namespace control
{

namespace
{

// Bounds how long shutdown waits, and how long the last access unit waits when the stream stops.
constexpr std::size_t PULL_TIMEOUT_MS = 100;

struct RtpFrameFree
{
  void operator()(uvgrtp::frame::rtp_frame * frame) const { uvgrtp::frame::dealloc_frame(frame); }
};

}  // namespace

VideoReceiver::VideoReceiver(std::uint16_t port)
{
  // Decoder

  const AVCodec * const codec = avcodec_find_decoder(AV_CODEC_ID_H264);
  if (!codec) {
    throw std::runtime_error("No H.264 decoder available");
  }

  decoder_.reset(avcodec_alloc_context3(codec));
  packet_.reset(av_packet_alloc());
  if (!decoder_ || !packet_) {
    throw std::runtime_error("Could not allocate H.264 decoder");
  }

  // Frame threading delays output by a frame per thread, so only slice threading is used.
  decoder_->flags |= AV_CODEC_FLAG_LOW_DELAY;
  decoder_->thread_type = FF_THREAD_SLICE;

  if (avcodec_open2(decoder_.get(), codec, nullptr) != 0) {
    throw std::runtime_error("Could not open H.264 decoder");
  }

  // RTP

  session_ = rtp_.create_session("0.0.0.0");
  if (!session_) {
    throw std::runtime_error("Could not create RTP session");
  }

  stream_ = session_->create_stream(port, RTP_FORMAT_H264, RCE_RECEIVE_ONLY);
  if (!stream_) {
    rtp_.destroy_session(session_);
    throw std::runtime_error("Could not open RTP stream on port " + std::to_string(port));
  }

  thread_ = std::thread(&VideoReceiver::run, this);
}

VideoReceiver::~VideoReceiver()
{
  running_ = false;
  thread_.join();

  // Also destroys the stream.
  rtp_.destroy_session(session_);
}

Picture VideoReceiver::take()
{
  const std::lock_guard<std::mutex> lock(mutex_);
  return std::move(newest_);
}

void VideoReceiver::run()
{
  while (running_) {
    const std::unique_ptr<uvgrtp::frame::rtp_frame, RtpFrameFree> nal(stream_->pull_frame(PULL_TIMEOUT_MS));

    // The decoder needs whole access units, but RTP delivers NAL units and the sender's marker bit is set on every
    // one. They share a timestamp within an access unit, so a new timestamp or a quiet stream ends one.
    if (!access_unit_.empty() && (!nal || nal->header.timestamp != timestamp_)) {
      decode();
    }

    if (nal) {
      timestamp_ = nal->header.timestamp;
      access_unit_.insert(access_unit_.end(), nal->payload, nal->payload + nal->payload_len);
    }
  }
}

void VideoReceiver::decode()
{
  // Unreferenced packet data is copied by the decoder, so the buffer can be reused immediately.
  packet_->data = access_unit_.data();
  packet_->size = static_cast<int>(access_unit_.size());

  const int sent = avcodec_send_packet(decoder_.get(), packet_.get());
  access_unit_.clear();

  // Lost packets corrupt access units. The decoder conceals or skips them and recovers at the next keyframe.
  if (sent != 0) {
    return;
  }

  while (true) {
    Picture picture(av_frame_alloc());
    if (!picture || avcodec_receive_frame(decoder_.get(), picture.get()) != 0) {
      return;
    }

    const std::lock_guard<std::mutex> lock(mutex_);
    newest_ = std::move(picture);
  }
}

}  // namespace control
