#include "control/panes/drive_pane.hpp"

#include "imgui.h"

namespace control
{
DrivePane::DrivePane(std::string name, GridSpan span, const Comm & comm) : name_(std::move(name)), span_(span)
{
  // TODO: QoS
  cmd_vel_pub_ = comm.publisher<geometry_msgs::msg::Twist>("/cmd_vel");
}

void DrivePane::update(const Comm & comm, const Gamepad & gamepad, const std::string & current_tab)
{
  controlled_ = current_tab == "Drive";

  if (!controlled_) {
    return;
  }

  // Testing with our 8bitdo controllers showed they needed to be reversed.
  forward_input_ = -gamepad.axis(SDL_GAMEPAD_AXIS_LEFTY);
  turn_input_ = -gamepad.axis(SDL_GAMEPAD_AXIS_LEFTX);

  // Simple deadzone
  if (std::abs(forward_input_) < 0.1) {
    forward_input_ = 0.0;
  }
  if (std::abs(turn_input_) < 0.1) {
    turn_input_ = 0.0;
  }

  // Limit publishing rate to 10 Hz
  const double now = comm.node().now().seconds();
  if (now - last_pub_time_ < 0.1) {
    return;
  }
  last_pub_time_ = now;

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