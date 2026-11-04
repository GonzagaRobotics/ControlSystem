#include "control/layout.hpp"

#include <utility>

#include "imgui.h"

namespace control
{

namespace
{

constexpr int GRID_COLS = 4;
constexpr int GRID_ROWS = 2;

constexpr ImGuiWindowFlags ROOT_FLAGS =
  ImGuiWindowFlags_NoDecoration | ImGuiWindowFlags_NoMove | ImGuiWindowFlags_NoSavedSettings |
  ImGuiWindowFlags_NoBringToFrontOnFocus;

void draw_pane_header(const char * name)
{
  ImGui::SetCursorPosX((ImGui::GetWindowWidth() - ImGui::CalcTextSize(name).x) * 0.5f);
  ImGui::TextUnformatted(name);
  ImGui::Separator();
}

}  // namespace

Layout::Layout(std::vector<Tab> tabs) : tabs_(std::move(tabs)) {}

void Layout::draw()
{
  const ImGuiViewport * viewport = ImGui::GetMainViewport();
  ImGui::SetNextWindowPos(viewport->WorkPos);
  ImGui::SetNextWindowSize(viewport->WorkSize);

  ImGui::Begin("root", nullptr, ROOT_FLAGS);

  draw_appbar();

  if (selected_ < tabs_.size()) {
    draw_grid(tabs_[selected_]);
  }

  ImGui::End();
}

void Layout::draw_appbar()
{
  ImGui::AlignTextToFramePadding();
  ImGui::TextUnformatted("Control System");
  ImGui::SameLine();

  // Tab widths are decided inside ImGui, so center using the width measured on the previous frame.
  ImGui::SetCursorPosX((ImGui::GetWindowWidth() - tabs_width_) * 0.5f);
  const float tabs_start = ImGui::GetCursorScreenPos().x;

  // The tab bar's underline would otherwise run to the window edge, making the tabs look off-center.
  ImGui::PushStyleVar(ImGuiStyleVar_TabBarBorderSize, 0.0f);

  if (ImGui::BeginTabBar("tabs")) {
    for (std::size_t i = 0; i < tabs_.size(); ++i) {
      if (ImGui::BeginTabItem(tabs_[i].name.c_str())) {
        selected_ = i;
        ImGui::EndTabItem();
      }
    }

    tabs_width_ = ImGui::GetItemRectMax().x - tabs_start;
    ImGui::EndTabBar();
  }

  ImGui::PopStyleVar();

  ImGui::Separator();
}

void Layout::draw_grid(const Tab & tab) const
{
  const ImVec2 origin = ImGui::GetCursorPos();
  const ImVec2 avail = ImGui::GetContentRegionAvail();
  const ImVec2 gap = ImGui::GetStyle().ItemSpacing;
  const ImVec2 cell(
    (avail.x - gap.x * (GRID_COLS - 1)) / GRID_COLS, (avail.y - gap.y * (GRID_ROWS - 1)) / GRID_ROWS);

  for (const PanePlacement & placement : tab.panes) {
    const GridSpan span = placement.pane->span();
    const ImVec2 pos(
      origin.x + placement.cell.col * (cell.x + gap.x), origin.y + placement.cell.row * (cell.y + gap.y));
    const ImVec2 size(span.cols * cell.x + (span.cols - 1) * gap.x, span.rows * cell.y + (span.rows - 1) * gap.y);

    ImGui::SetCursorPos(pos);

    // Scoped by pane identity so a pane shared between tabs keeps its ImGui state.
    ImGui::PushID(placement.pane);

    if (ImGui::BeginChild("pane", size, ImGuiChildFlags_Borders)) {
      draw_pane_header(placement.pane->name());
      placement.pane->draw();
    }

    ImGui::EndChild();
    ImGui::PopID();
  }
}

}  // namespace control
