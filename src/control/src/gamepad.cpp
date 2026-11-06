#include "control/gamepad.hpp"

#include <algorithm>

namespace control
{

namespace
{

// Guards bitset lookups, which throw on out of range indices such as SDL_GAMEPAD_BUTTON_INVALID.
bool is_valid(SDL_GamepadButton button)
{
  return button >= 0 && button < SDL_GAMEPAD_BUTTON_COUNT;
}

}  // namespace

Gamepad::Gamepad()
{
  open_first();
}

void Gamepad::process_event(const SDL_Event & event)
{
  switch (event.type) {
    case SDL_EVENT_GAMEPAD_ADDED:
      if (!gamepad_) {
        open(event.gdevice.which);
      }
      break;

    case SDL_EVENT_GAMEPAD_REMOVED:
      if (is_bound(event.gdevice.which)) {
        close();
        open_first();
      }
      break;

    case SDL_EVENT_GAMEPAD_BUTTON_DOWN:
      if (is_bound(event.gbutton.which)) {
        down_.set(event.gbutton.button);
        pending_pressed_.set(event.gbutton.button);
      }
      break;

    case SDL_EVENT_GAMEPAD_BUTTON_UP:
      if (is_bound(event.gbutton.which)) {
        down_.reset(event.gbutton.button);
        pending_released_.set(event.gbutton.button);
      }
      break;

    default:
      break;
  }
}

void Gamepad::update()
{
  just_pressed_ = pending_pressed_;
  just_released_ = pending_released_;

  pending_pressed_.reset();
  pending_released_.reset();
}

bool Gamepad::connected() const
{
  return gamepad_ != nullptr;
}

bool Gamepad::pressed(SDL_GamepadButton button) const
{
  return is_valid(button) && down_.test(button);
}

bool Gamepad::just_pressed(SDL_GamepadButton button) const
{
  return is_valid(button) && just_pressed_.test(button);
}

bool Gamepad::just_released(SDL_GamepadButton button) const
{
  return is_valid(button) && just_released_.test(button);
}

float Gamepad::axis(SDL_GamepadAxis axis) const
{
  if (!gamepad_) {
    return 0.0f;
  }

  const float raw = SDL_GetGamepadAxis(gamepad_.get(), axis);

  // The negative range is one step longer than the positive, so clamp to keep sticks symmetric.
  return std::max(-1.0f, raw / SDL_JOYSTICK_AXIS_MAX);
}

void Gamepad::open(SDL_JoystickID id)
{
  gamepad_.reset(SDL_OpenGamepad(id));
}

void Gamepad::open_first()
{
  int count = 0;
  const std::unique_ptr<SDL_JoystickID, decltype(&SDL_free)> ids(SDL_GetGamepads(&count), SDL_free);

  for (int i = 0; ids && i < count && !gamepad_; ++i) {
    open(ids.get()[i]);
  }
}

void Gamepad::close()
{
  // Release held buttons so consumers acting on just_released() don't latch on a dropped controller.
  pending_released_ |= down_;
  down_.reset();

  gamepad_.reset();
}

bool Gamepad::is_bound(SDL_JoystickID id) const
{
  return gamepad_ && SDL_GetGamepadID(gamepad_.get()) == id;
}

}  // namespace control
