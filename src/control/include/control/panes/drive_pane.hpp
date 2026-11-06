#pragma once

#include <chrono>
#include <string>

#include "control/pane.hpp"
#include "geometry_msgs/msg/twist.hpp"

namespace control
{
// Driving the robot
class DrivePane : public Pane
{
public:
  DrivePane(std::string name, GridSpan span, const Comm & comm);

  const char * name() const override { return name_.c_str(); }
  GridSpan span() const override { return span_; }
  void update(const Comm & comm, const Gamepad & gamepad, const std::string & current_tab) override;
  void draw() override;

private:
  const std::string name_;
  const GridSpan span_;

  double last_pub_time_ = 0.0;

  bool controlled_ = false;
  float forward_input_ = 0.0f;
  float turn_input_ = 0.0f;

  rclcpp::Publisher<geometry_msgs::msg::Twist>::SharedPtr cmd_vel_pub_;
};
}  // namespace control
