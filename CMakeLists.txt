cmake_minimum_required(VERSION 3.16)
project(control)
include(FetchContent)

# Ensure dynamic libraries are placed in the same directory as the executable.
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/$<CONFIGURATION>")
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY "${CMAKE_BINARY_DIR}/$<CONFIGURATION>")

# SDL3
FetchContent_Declare(
    sdl
    SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/vendored/SDL
)

set(CMAKE_BUILD_TYPE Release)
set(SDL_TESTS OFF)
set(SDL_X11_XTEST OFF)

FetchContent_MakeAvailable(sdl)

# Dear ImGui
FetchContent_Declare(
    imgui
    SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/vendored/imgui
)
FetchContent_MakeAvailable(imgui)
set (imgui_SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/vendored/imgui)
set(IMGUI_SOURCES
    ${imgui_SOURCE_DIR}/imgui.cpp
    ${imgui_SOURCE_DIR}/imgui_demo.cpp
    ${imgui_SOURCE_DIR}/imgui_draw.cpp
    ${imgui_SOURCE_DIR}/imgui_tables.cpp
    ${imgui_SOURCE_DIR}/imgui_widgets.cpp
    
    ${imgui_SOURCE_DIR}/backends/imgui_impl_sdl3.cpp
    ${imgui_SOURCE_DIR}/backends/imgui_impl_sdlgpu3.cpp
)
add_library(imgui STATIC ${IMGUI_SOURCES})
target_include_directories(imgui PUBLIC ${imgui_SOURCE_DIR} ${imgui_SOURCE_DIR}/backends)
target_link_libraries(imgui PUBLIC SDL3::SDL3)

add_executable(control WIN32 src/main.cpp)
target_link_libraries(control PRIVATE SDL3::SDL3 imgui)