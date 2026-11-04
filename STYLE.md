# GU Robotics C++ Style Guide

We ultimately follow the ROS2 development style guide, which is itself based on the Google style guide.

The goal here is to set decisions that are left ambigious in either guide, and condense the important points here while describing things people tend to get wrong. The "why" won't be covered here. Go see the source documents for that.

## Language

ROS2 Jazzy, C++ 17.

## Line length

- Soft cap at 100 characters.
- Hard cap at 120 characters.
- Exceptions only for special non-code or strings.

## Naming

Use `snake_case` as the default case. Keep names short, but readable. Only use abbreviations or shortenings if the reduction in length is really worth the loss in readability. Only use very standard shortenings (e.g. `i`, `j`, `idx`, `avg`).

### Files

Use `.cpp` and `.hpp` extensions.

### Variables

For global variables, use the ROS2 convention of the `g_` prefix.

### Constants

Use `UPPER_CASE` for constants, defines, etc. `using` structures are typically `PascalCase` to reflect the classes they usually alias.

## Classes

Use `PascalCase` for class names.

Avoid aliasing standard library or rclcpp classes like `Node`. Use something like `FooNode` instead.

## Other

Use `#pragma once` instead of header guards.

We are building a modern codebase and the structure of ROS2 packages isolates them quite well. Do not feel overly restricted against using modern techniques and language features.

Use smart pointers wherever possible. Mark variables and methods const unless you know they will need to be modified. Make functions inline at your discretion, but do so judiciously.

When passing data around, I think it is helpful to use the Rust ideas of ownership and borrowing. You should always consider who the ultimate owner of the data is, and what you are doing with it.

## Whitespace

Break up your code into meaningful chunks with whitespace between unrelated ideas. A complex calculation of a variable, followed by a control structure based on its value are two seperate ideas that should be seperated. Often, you want to seperate control flow and function calls from the rest of the code, although again, this depends on what each piece does in relation to each other.

Indent by 2 spaces. `public:` and related do not get indented.

## Comments

Good code is fairly self documenting in the WHAT it does, especially in the details. Good comments tell you WHY. Good comments are also as short as they can be.

Comments should be able to survive changes to the surrounding code. If a variable is changed, comments should not need to change at all. The details of a function's implementation should not change its definition's comments.

For comments describing function definitions, that are intended to be used by others, the WHAT is actually quite important here. The HOW is completely irrelevant. Note things like changes to data, side effects, and pre and post conditions if relevant. Do not include trivial or obvious cases of each of these.

In implementations, only cover the WHAT at a high level, before a large or confusing block of code. This is also where the WHY matters. Was there some issue that required a potentially confusing line? Are we checking against potential errors or bad data? Do not comment every line, nor simple, very standard patterns that anyone with a bit of experience can understand at a glance.
