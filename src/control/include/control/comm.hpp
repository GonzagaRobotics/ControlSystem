#pragma once

#include <chrono>
#include <future>
#include <memory>
#include <mutex>
#include <optional>
#include <rclcpp/rclcpp.hpp>
#include <string>
#include <thread>
#include <utility>

namespace control
{

// Receives a topic in the background, keeping only the newest message for the UI thread to take.
template <typename Msg>
class Subscriber
{
public:
  // The newest message received since the previous take(), or null if none arrived. Older unread messages are dropped.
  typename Msg::ConstSharedPtr take()
  {
    const std::lock_guard<std::mutex> lock(inbox_->mutex);
    return std::exchange(inbox_->msg, nullptr);
  }

private:
  friend class Comm;

  // Shared with the ROS thread's callback, which may outlive this object by one in-flight call.
  struct Inbox
  {
    std::mutex mutex;
    typename Msg::ConstSharedPtr msg;
  };

  Subscriber(rclcpp::Node & node, const std::string & topic, const rclcpp::QoS & qos)
  : inbox_(std::make_shared<Inbox>())
  {
    subscription_ = node.create_subscription<Msg>(topic, qos, [inbox = inbox_](typename Msg::ConstSharedPtr msg) {
      const std::lock_guard<std::mutex> lock(inbox->mutex);
      inbox->msg = std::move(msg);
    });
  }

  std::shared_ptr<Inbox> inbox_;
  typename rclcpp::Subscription<Msg>::SharedPtr subscription_;
};

// Calls a service in the background, holding at most one request in flight.
// Use from a single thread.
template <typename Srv>
class ServiceCaller
{
public:
  // Whether a server is currently available.
  bool ready() const { return client_->service_is_ready(); }

  // Sends a request, cancelling any still in flight.
  void call(typename Srv::Request request)
  {
    cancel();
    in_flight_ = client_->async_send_request(std::make_shared<typename Srv::Request>(std::move(request)));
  }

  // Abandons the request in flight, if any. A response arriving later is dropped.
  void cancel()
  {
    if (in_flight_) {
      client_->remove_pending_request(in_flight_->request_id);
      in_flight_.reset();
    }
  }

  // Whether a request is awaiting its response.
  bool waiting() const { return in_flight_.has_value(); }

  // The response to the request in flight, or null if it hasn't arrived. Ends the request once returned.
  typename Srv::Response::SharedPtr take()
  {
    if (!in_flight_ || in_flight_->future.wait_for(std::chrono::seconds(0)) != std::future_status::ready) {
      return nullptr;
    }

    const typename Srv::Response::SharedPtr response = in_flight_->future.get();
    in_flight_.reset();

    return response;
  }

private:
  friend class Comm;

  ServiceCaller(rclcpp::Node & node, const std::string & service) : client_(node.create_client<Srv>(service)) {}

  typename rclcpp::Client<Srv>::SharedPtr client_;
  std::optional<typename rclcpp::Client<Srv>::FutureAndRequestId> in_flight_;
};

// Owns ROS for the app: initializes it, and spins one node on a background thread until destroyed.
// Panes create their endpoints here in their constructors, then use them from their update loops.
// Must outlive every endpoint it creates. Only one may exist at a time.
class Comm
{
public:
  Comm(int argc, char ** argv, const std::string & node_name);
  ~Comm();

  Comm(const Comm &) = delete;
  Comm & operator=(const Comm &) = delete;

  // Publishing is thread safe, so the rclcpp publisher is used directly.
  template <typename Msg>
  typename rclcpp::Publisher<Msg>::SharedPtr publisher(
    const std::string & topic, const rclcpp::QoS & qos = rclcpp::SystemDefaultsQoS()) const
  {
    return node_->create_publisher<Msg>(topic, qos);
  }

  template <typename Msg>
  Subscriber<Msg> subscriber(const std::string & topic, const rclcpp::QoS & qos = rclcpp::SystemDefaultsQoS()) const
  {
    return Subscriber<Msg>(*node_, topic, qos);
  }

  template <typename Srv>
  ServiceCaller<Srv> service_caller(const std::string & service) const
  {
    return ServiceCaller<Srv>(*node_, service);
  }

  // For anything not covered above, e.g. parameters, timers, and logging.
  // Callbacks registered on it run on the background thread.
  rclcpp::Node & node() const { return *node_; }

private:
  std::shared_ptr<rclcpp::Node> node_;
  std::unique_ptr<rclcpp::executors::SingleThreadedExecutor> executor_;
  std::thread spin_thread_;
};

}  // namespace control
