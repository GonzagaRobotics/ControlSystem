#pragma once

#include <cstddef>
#include <string>
#include <vector>

#include "control/pane.hpp"

namespace control
{

// Top-left grid cell of a pane.
struct GridCell
{
  int col;
  int row;
};

// Pane is borrowed: the same pane may appear in several tabs, keeping its state across tab switches.
struct PanePlacement
{
  Pane * pane;
  GridCell cell;
};

struct Tab
{
  std::string name;
  std::vector<PanePlacement> panes;
};

// Root UI: an appbar with centered tab selection above a fixed grid of the selected tab's panes.
class Layout
{
public:
  // All placed panes must outlive the layout.
  explicit Layout(std::vector<Tab> tabs);

  // Fills the main viewport. Call once per frame between ImGui::NewFrame() and ImGui::Render().
  void draw();

private:
  void draw_appbar();
  void draw_grid(const Tab & tab) const;

  const std::vector<Tab> tabs_;
  std::size_t selected_ = 0;
  float tabs_width_ = 0.0f;
};

}  // namespace control
