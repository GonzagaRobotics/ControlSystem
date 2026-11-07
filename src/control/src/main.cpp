#include <SDL3/SDL.h>
#include <stdio.h>  // printf, fprintf

#include "control/comm.hpp"
#include "control/gamepad.hpp"
#include "control/layout.hpp"
#include "control/panes/camera_pane.hpp"
#include "control/panes/drive_pane.hpp"
#include "control/panes/placeholder_pane.hpp"
#include "imgui.h"
#include "imgui_impl_sdl3.h"
#include "imgui_impl_sdlgpu3.h"

int main(int argc, char ** argv)
{
  SDL_SetHint(SDL_HINT_JOYSTICK_ALLOW_BACKGROUND_EVENTS, "1");

  if (!SDL_Init(SDL_INIT_VIDEO | SDL_INIT_GAMEPAD)) {
    printf("Error: SDL_Init(): %s\n", SDL_GetError());
    return 1;
  }

  // Create SDL window graphics context

  float main_scale = SDL_GetDisplayContentScale(SDL_GetPrimaryDisplay());
  SDL_WindowFlags window_flags = SDL_WINDOW_HIDDEN | SDL_WINDOW_HIGH_PIXEL_DENSITY;
  SDL_Window * window =
    SDL_CreateWindow("Control System", (int)(1920 * main_scale), (int)(1080 * main_scale), window_flags);

  if (window == nullptr) {
    printf("Error: SDL_CreateWindow(): %s\n", SDL_GetError());
    return 1;
  }

  SDL_SetWindowPosition(window, SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED);
  SDL_ShowWindow(window);

  // Create GPU Device
  SDL_GPUDevice * gpu_device = SDL_CreateGPUDevice(
    SDL_GPU_SHADERFORMAT_SPIRV | SDL_GPU_SHADERFORMAT_DXIL | SDL_GPU_SHADERFORMAT_MSL | SDL_GPU_SHADERFORMAT_METALLIB,
    true, nullptr);
  if (gpu_device == nullptr) {
    printf("Error: SDL_CreateGPUDevice(): %s\n", SDL_GetError());
    return 1;
  }

  // Claim window for GPU Device
  if (!SDL_ClaimWindowForGPUDevice(gpu_device, window)) {
    printf("Error: SDL_ClaimWindowForGPUDevice(): %s\n", SDL_GetError());
    return 1;
  }
  SDL_SetGPUSwapchainParameters(gpu_device, window, SDL_GPU_SWAPCHAINCOMPOSITION_SDR, SDL_GPU_PRESENTMODE_VSYNC);

  IMGUI_CHECKVERSION();
  ImGui::CreateContext();
  ImGuiIO & io = ImGui::GetIO();
  io.IniFilename = nullptr;
  (void)io;
  io.ConfigFlags |= ImGuiConfigFlags_NavEnableKeyboard;  // Enable Keyboard Controls

  ImGuiStyle & style = ImGui::GetStyle();
  ImGui::StyleColorsDark();
  style.FontSizeBase = 16.0f;
  style.ScaleAllSizes(main_scale);
  style.FontScaleDpi = main_scale;

  // Setup Platform/Renderer backends
  ImGui_ImplSDL3_InitForSDLGPU(window);
  ImGui_ImplSDLGPU3_InitInfo init_info = {};
  init_info.Device = gpu_device;
  init_info.ColorTargetFormat = SDL_GetGPUSwapchainTextureFormat(gpu_device, window);
  init_info.MSAASamples = SDL_GPU_SAMPLECOUNT_1;                      // Only used in multi-viewports mode.
  init_info.SwapchainComposition = SDL_GPU_SWAPCHAINCOMPOSITION_SDR;  // Only used in multi-viewports mode.
  init_info.PresentMode = SDL_GPU_PRESENTMODE_VSYNC;
  ImGui_ImplSDLGPU3_Init(&init_info);

  // Scoped so everything holding SDL or GPU resources is released before the cleanup below.
  {
    control::Comm comm(argc, argv, "control");

    control::Gamepad gamepad;

    // Panes are declared before the layout, which borrows them.
    control::CameraPane camera("Camera", {2, 1}, comm, gpu_device);
    control::DrivePane drive("Drive", {1, 1}, comm);
    control::PlaceholderPane gnss("GNSS", {1, 1});
    control::PlaceholderPane auto_nav("Auto Nav", {2, 1});
    control::PlaceholderPane arm("Arm", {1, 1});
    control::PlaceholderPane science("Science", {1, 1});

    control::Layout layout({
      {"Drive", {{&camera, {0, 0}}, {&drive, {2, 0}}, {&gnss, {3, 0}}}},
      {"Autonomous", {{&camera, {0, 0}}, {&drive, {2, 0}}, {&gnss, {3, 0}}, {&auto_nav, {0, 1}}}},
      {"Arm", {{&camera, {0, 0}}, {&arm, {2, 0}}, {&gnss, {3, 0}}}},
      {"Science", {{&camera, {0, 0}}, {&science, {2, 0}}, {&gnss, {3, 0}}}},
    });

    // Main loop

    bool running = true;
    while (running) {
      SDL_Event event;
      while (SDL_PollEvent(&event)) {
        ImGui_ImplSDL3_ProcessEvent(&event);

        if (event.type == SDL_EVENT_QUIT) {
          running = false;
        }
        if (event.type == SDL_EVENT_WINDOW_CLOSE_REQUESTED && event.window.windowID == SDL_GetWindowID(window)) {
          running = false;
        }

        gamepad.process_event(event);
      }
      gamepad.update();
      layout.update(comm, gamepad);

      if (SDL_GetWindowFlags(window) & SDL_WINDOW_MINIMIZED) {
        SDL_Delay(10);
        continue;
      }

      ImGui_ImplSDLGPU3_NewFrame();
      ImGui_ImplSDL3_NewFrame();
      ImGui::NewFrame();

      layout.draw();

      // Rendering
      ImGui::Render();
      ImDrawData * draw_data = ImGui::GetDrawData();
      const bool is_minimized = (draw_data->DisplaySize.x <= 0.0f || draw_data->DisplaySize.y <= 0.0f);

      SDL_GPUCommandBuffer * command_buffer = SDL_AcquireGPUCommandBuffer(gpu_device);  // Acquire a GPU command buffer

      SDL_GPUTexture * swapchain_texture;
      SDL_WaitAndAcquireGPUSwapchainTexture(
        command_buffer, window, &swapchain_texture, nullptr,
        nullptr);  // Acquire a swapchain texture

      if (swapchain_texture != nullptr && !is_minimized) {
        // This is mandatory: call ImGui_ImplSDLGPU3_PrepareDrawData() to upload
        // the vertex/index buffer!
        ImGui_ImplSDLGPU3_PrepareDrawData(draw_data, command_buffer);

        // Setup and start a render pass
        SDL_GPUColorTargetInfo target_info = {};
        target_info.texture = swapchain_texture;
        target_info.clear_color = SDL_FColor{0.45f, 0.55f, 0.60f, 1.00f};
        target_info.load_op = SDL_GPU_LOADOP_CLEAR;
        target_info.store_op = SDL_GPU_STOREOP_STORE;
        target_info.mip_level = 0;
        target_info.layer_or_depth_plane = 0;
        target_info.cycle = false;
        SDL_GPURenderPass * render_pass = SDL_BeginGPURenderPass(command_buffer, &target_info, 1, nullptr);

        // Render ImGui
        ImGui_ImplSDLGPU3_RenderDrawData(draw_data, command_buffer, render_pass);

        SDL_EndGPURenderPass(render_pass);
      }

      // Submit the command buffer
      SDL_SubmitGPUCommandBuffer(command_buffer);
    }
  }

  // Cleanup
  SDL_WaitForGPUIdle(gpu_device);
  ImGui_ImplSDL3_Shutdown();
  ImGui_ImplSDLGPU3_Shutdown();
  ImGui::DestroyContext();

  SDL_ReleaseWindowFromGPUDevice(gpu_device, window);
  SDL_DestroyGPUDevice(gpu_device);
  SDL_DestroyWindow(window);
  SDL_Quit();

  return 0;
}