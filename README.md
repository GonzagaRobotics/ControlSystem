# Control System

The main system to control the rover.

## Dependencies

### Development

SDL3: `git clone https://github.com/libsdl-org/SDL.git src/control/vendored/SDL`.
Dear ImGui: `git clone https://github.com/ocornut/imgui.git --branch v1.93.0 src/control/vendored/imgui`.

## Compatibility

Intended only for Ubuntu 24.04.

## Building

From the repository root:

```bash
source /opt/ros/jazzy/setup.bash
colcon build
source install/local_setup.bash
ros2 run control control
```
