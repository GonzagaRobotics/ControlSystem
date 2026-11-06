#include "control/panes/drive_pane.hpp"

#include "imgui.h"

namespace control
{
DrivePane::DrivePane(std::string name, GridSpan span) : name_(std::move(name)), span_(span) {}

void DrivePane::draw() { ImGui::Text("Foobar"); }
}  // namespace control