# Control System

Version: 0.12.0

Code name: N/A

## Introduction

The main system to control the rover. Uses SvelteKit, Skeleton, Typescript, and Roslib.

## Dependencies

- System: Node v22, latest npm
- Project: Run `npm install` to install dependencies.

## Compatibility

Development and testing is only done on Ubuntu using Chromium.

Windows and Mac should work.

Non-Chromium browsers are not supported.

## Building

Building for deployment has not been tested yet.

## Quick Start

1. Make sure you have a `config.json5` file in the `static` directory, and that it is properly configured.
2. Run `npm run dev` to start the dev server.
3. Navigate to `http://localhost:5173/`

## Configuration

ControlSystem uses a configuration file for its runtime settings. You may modify the file while the server is running, but you must refresh the page for them to take effect.

This file is located at `static/config.json5`. You can copy the `config.starter.json5` file to `config.json5` and modify it to your needs.

### Base Options

- `roslibUrl` - The URL to the rosbridge server. Include the hostname and port, but not the protocol.
- `rtcSignalingUrl` - The URL to the Camera System's signaling server. Include the hostname and port, but not the protocol.
- `fakeConnect` - If `true`, the system will not attempt to connect to the rosbridge server. It will pretend to be connected and fake data will be used if defined. Meant for testing.
- `noHeartbeat` - If `true`, the system will not undergo its normal heartbeat configuration and no heartbeats will be sent, nor will the system check for them. Meant for testing when you want to use ROS without having to use CoreSystem.
- `publishRate` - The rate at which the Interval Publisher will publish data in Hz. Note that not all publishers go through the Interval Publisher, and that too low of a rate may cause unnacceptable input latency.

### Heartbeat Options

- `heartbeatInterval` - How often to send a heartbeat in milliseconds.
- `heartbeatCheckInterval` - How often to check for the heartbeat status in milliseconds.
- `heartbeatTimeout` - How long before a heartbeat is considered timed out in milliseconds.
- `heartbeatTimeoutLimit` - If this many heartbeats are missed, the connection is considered lost.

### Panes

Each pane is an object in the `panes` array. Each pane has the following options:

- `id` - A unique identifier for the pane. Use snake_case.
- `name` - Display name for the pane.

### Tabs

Like panes, each tab is an object in the `tabs` array. Each tab has the following options:

- `id` - A unique identifier for the tab. Use snake_case.
- `name` - Display name for the tab.
- `attributes` - An array of strings defining attributes for the tab.

#### Tab Panes

The tab has a `panes` array that contains the panes that are displayed in the tab. This is different from the `panes` array, and any pane you use here must be defined in the main `panes` array.

- `pane` - The ID of the pane to display.
- `position` - An object with `x` and `y` properties that define the position of the pane in the tab.
- `size` - An object with `x` and `y` properties that define the size of the pane in the tab. Must be at least 1 by 1

## Notes

The GUI is divided into a 4 by 2 grid. This is not configurable at this time. The position and size of panes are relative to this grid, with the top left corner being (0, 0) and the bottom right corner being (3, 1). Not respecting these limits, overlapping panes, or using decimal values will cause undefined behavior.

Panes are meant to be flexible, but some may not work well if they are too small, too large, or if their aspect ratio is too different from what they were designed for. All panes will work in any position. It's up for the user to decide what works best for them.

Attributes are a fairly loose concept. Panes are given a list of the active attributes, and it is up to each pane to decide what to do with them. Currently, the only attribute used by any pane is `motors_readonly`. The intent is to allow for tabs to modify the behavior of panes without having to create a new pane.

Each pane can get controller input from the user. This means that multiple panes could hypothetically read from the same inputs and conflict with each other. In the future, there will likely be a priority/focusing system to address this, but it currently is not an issue.

Panes cannot have the same ID, nor can tabs have the same ID. However, tabs and panes can have the same ID. For example, you could have the pane "motors" in the tab "motors" and it would work fine. But you could not have two panes with the ID "motors".
