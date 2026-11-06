#include "control/comm.hpp"

namespace control
{

// ROS must be initialized before the node and executor exist, so they are created here rather than as members.
Comm::Comm(int argc, char ** argv, const std::string & node_name)
{
  rclcpp::init(argc, argv);

  node_ = std::make_shared<rclcpp::Node>(node_name);
  executor_ = std::make_unique<rclcpp::executors::SingleThreadedExecutor>();
  executor_->add_node(node_);

  spin_thread_ = std::thread([this] { executor_->spin(); });
}

Comm::~Comm()
{
  // Shutdown rather than cancel, since cancel is lost if the thread hasn't started spinning yet.
  rclcpp::shutdown();
  spin_thread_.join();
}

}  // namespace control
