#pragma once

#include "control/comm.hpp"
#include "control/gamepad.hpp"

namespace control
{

// Number of grid cells a pane covers in each direction.
struct GridSpan
{
  int cols;
  int rows;
};

// A self-contained region of the main grid. Subclasses own their state and behavior.
class Pane
{
public:
  virtual ~Pane() = default;

  // Title shown in the pane header. Must stay valid while the pane is alive.
  virtual const char * name() const = 0;

  virtual GridSpan span() const = 0;

  // Update state, handle input, and publish messages. Called once per frame before draw() while the pane's tab is selected.
  virtual void update(const Comm & comm, const Gamepad & gamepad, const std::string & current_tab) = 0;

  // Draws the pane body into the current ImGui window. Called once per frame while the pane's tab is selected.
  virtual void draw() = 0;
};

}  // namespace control
