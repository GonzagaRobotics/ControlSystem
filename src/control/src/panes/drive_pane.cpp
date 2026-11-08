#include "control/panes/drive_pane.hpp"

#include "imgui.h"
namespace control
{
DrivePane::DrivePane(std::string name, GridSpan span, const Comm & comm) : name_(std::move(name)), span_(span)
{
  cmd_vel_pub_ = comm.publisher<geometry_msgs::msg::Twist>(
    "/cmd_vel", rclcpp::QoS(rclcpp::KeepLast(1)).best_effort().deadline(rclcpp::Duration::from_seconds(0.2)));
}

void DrivePane::update(const Comm & comm, const Gamepad & gamepad, const std::string & current_tab)
{
  controlled_ = current_tab == "Drive";

  if (!controlled_) {
    return;
  }

  // Testing with our 8bitdo controllers showed they needed to be reversed.
  float forward = -gamepad.axis(SDL_GAMEPAD_AXIS_LEFTY);
  float turn = -gamepad.axis(SDL_GAMEPAD_AXIS_LEFTX);

  // Simple deadzone
  if (std::abs(forward) < 0.1) {
    forward = 0.0;
  }
  if (std::abs(turn) < 0.1) {
    turn = 0.0;
  }

  // Publish at 10 Hz. A big enough change will be published immediately.
  if (std::abs(forward - forward_input_) > 0.2 || std::abs(turn - turn_input_) > 0.2) {
    last_pub_time_ = 0.0;
  }

  const double now = comm.node().now().seconds();
  if (now - last_pub_time_ < 0.1) {
    return;
  }
  last_pub_time_ = now;
  forward_input_ = forward;
  turn_input_ = turn;

  geometry_msgs::msg::Twist cmd_vel;
  cmd_vel.linear.x = forward_input_;
  cmd_vel.angular.z = turn_input_;
  cmd_vel_pub_->publish(cmd_vel);
}

void DrivePane::draw()
{
  if (!controlled_) {
    ImGui::Text("Not user-controlled");
    return;
  }

  ImGui::Text("Forward/backward: %.2f", forward_input_);
  ImGui::Text("Turn: %.2f", turn_input_);
}
}  // namespace control