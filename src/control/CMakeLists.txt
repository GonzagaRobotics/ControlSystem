cmake_minimum_required(VERSION 3.16)
project(control)
include(FetchContent)

set(CMAKE_BUILD_TYPE RelWithDebInfo)

# FFmpeg decodes the camera stream, libyuv converts it for display.
find_package(PkgConfig REQUIRED)
pkg_check_modules(libav REQUIRED IMPORTED_TARGET libavcodec libavutil)
find_path(LIBYUV_INCLUDE_DIR libyuv.h REQUIRED)
find_library(LIBYUV_LIBRARY yuv REQUIRED)

# SDL3
FetchContent_Declare(
  sdl
  SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/vendored/SDL
)

# Static, because SDL disables its install rules as a subproject, leaving a shared lib unreachable from install/.
set(SDL_SHARED OFF)
set(SDL_STATIC ON)
set(SDL_TESTS OFF)
set(SDL_X11_XTEST OFF)

FetchContent_MakeAvailable(sdl)

# Dear ImGui
set(imgui_SOURCE_DIR ${CMAKE_CURRENT_SOURCE_DIR}/vendored/imgui)
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
target_link_libraries(imgui PUBLIC SDL3::SDL3-static)

# uvgRTP
FetchContent_Declare(
  uvgRTP
  GIT_REPOSITORY  https://github.com/ultravideo/uvgRTP
  GIT_TAG v4.0.2
)

# Statically linked into control, so nothing needs installing. Its install rules also misplace uvgrtp.pc at / when PKG_CONFIG_PATH is set in the environment.
set(UVGRTP_DISABLE_INSTALL ON)

FetchContent_MakeAvailable(uvgrtp)

# Control app
find_package(ament_cmake REQUIRED)
find_package(rclcpp REQUIRED)
find_package(geometry_msgs REQUIRED)

add_executable(control WIN32 src/main.cpp src/comm.cpp src/layout.cpp src/gamepad.cpp src/video_receiver.cpp src/panes/drive_pane.cpp src/panes/camera_pane.cpp)
target_include_directories(control PRIVATE include ${LIBYUV_INCLUDE_DIR})
target_link_libraries(control PRIVATE SDL3::SDL3-static imgui rclcpp::rclcpp ${geometry_msgs_TARGETS} PkgConfig::libav ${LIBYUV_LIBRARY} uvgrtp)

# Scoped to our target so vendored code keeps its own warning settings.
if(CMAKE_COMPILER_IS_GNUCXX OR CMAKE_CXX_COMPILER_ID MATCHES "Clang")
  target_compile_options(control PRIVATE -Wall -Wextra -Wpedantic)
endif()

if(BUILD_TESTING)
  find_package(ament_lint_auto REQUIRED)
  # the following line skips the linter which checks for copyrights
  # comment the line when a copyright and license is added to all source files
  set(ament_cmake_copyright_FOUND TRUE)
  # the following line skips cpplint (only works in a git repo)
  # comment the line when this package is in a git repo and when
  # a copyright and license is added to all source files
  set(ament_cmake_cpplint_FOUND TRUE)
  ament_lint_auto_find_test_dependencies()
endif()
install(TARGETS control DESTINATION lib/${PROJECT_NAME})

ament_package()
