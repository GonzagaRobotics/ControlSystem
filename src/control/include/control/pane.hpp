#pragma once

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

  // Draws the pane body into the current ImGui window. Called once per frame while the pane's tab is selected.
  virtual void draw() = 0;
};

}  // namespace control
