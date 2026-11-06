#pragma once

#include <string>

#include "control/pane.hpp"

namespace control
{

// Stand-in for a pane whose content is not implemented yet.
class DrivePane : public Pane
{
public:
  DrivePane(std::string name, GridSpan span);

  const char * name() const override { return name_.c_str(); }
  GridSpan span() const override { return span_; }
  void draw() override;

private:
  const std::string name_;
  const GridSpan span_;
};

}  // namespace control
