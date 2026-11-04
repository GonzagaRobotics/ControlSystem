#pragma once

#include <string>
#include <utility>

#include "control/pane.hpp"

namespace control
{

// Stand-in for a pane whose content is not implemented yet.
class PlaceholderPane : public Pane
{
public:
  PlaceholderPane(std::string name, GridSpan span) : name_(std::move(name)), span_(span) {}

  const char * name() const override { return name_.c_str(); }
  GridSpan span() const override { return span_; }
  void draw() override {}

private:
  const std::string name_;
  const GridSpan span_;
};

}  // namespace control
