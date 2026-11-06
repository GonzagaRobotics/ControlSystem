#pragma once

#include <SDL3/SDL.h>

#include <bitset>
#include <memory>

namespace control
{

// One SDL gamepad with per-frame button edges.
// Buttons use SDL's positional names (e.g. SOUTH is Xbox A), so mappings hold across controller brands.
// Follows hotplug: binds the first available gamepad, and rebinds to another if it disconnects.
class Gamepad
{
public:
  // Requires SDL initialized with SDL_INIT_GAMEPAD. Binds an already connected gamepad if there is one.
  Gamepad();

  // Feed every polled SDL event.
  void process_event(const SDL_Event & event);

  // Publishes the button edges gathered since the last call. Call once per frame, after the event loop.
  void update();

  bool connected() const;

  // Held, as of the latest processed event.
  bool pressed(SDL_GamepadButton button) const;

  // Went down or up since the previous update(). Both are true for a tap shorter than a frame.
  // Disconnecting releases all held buttons.
  bool just_pressed(SDL_GamepadButton button) const;
  bool just_released(SDL_GamepadButton button) const;

  // Sticks are in [-1, 1] with +x right and +y down. Triggers are in [0, 1].
  // Raw values with no deadzone applied. 0 while disconnected.
  float axis(SDL_GamepadAxis axis) const;

private:
  using Buttons = std::bitset<SDL_GAMEPAD_BUTTON_COUNT>;

  void open(SDL_JoystickID id);
  void open_first();
  void close();
  bool is_bound(SDL_JoystickID id) const;

  std::unique_ptr<SDL_Gamepad, decltype(&SDL_CloseGamepad)> gamepad_{nullptr, SDL_CloseGamepad};

  Buttons down_;

  // Edges accumulate in pending_ between update() calls, so queries stay stable for a whole frame.
  Buttons pending_pressed_;
  Buttons pending_released_;
  Buttons just_pressed_;
  Buttons just_released_;
};

}  // namespace control
