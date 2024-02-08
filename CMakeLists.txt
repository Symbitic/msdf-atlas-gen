cmake_minimum_required(VERSION 3.23 FATAL_ERROR)
cmake_policy(SET CMP0091 NEW)
cmake_policy(SET CMP0042 NEW)

project(msdf-atlas-gen-node)

option(MSDF_ATLAS_USE_SKIA "Build with the Skia library" OFF)

set(CMAKE_BUILD_TYPE CACHE STRING "Release" FORCE)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY CACHE STRING "${CMAKE_CURRENT_BINARY_DIR}/bin" FORCE)
set(CMAKE_OSX_ARCHITECTURES "x86_64;arm64" CACHE STRING "macOS architecture" FORCE)
set(CMAKE_OSX_DEPLOYMENT_TARGET "10.15" CACHE STRING "macOS target" FORCE)
set(CMAKE_TOOLCHAIN_FILE "${CMAKE_CURRENT_SOURCE_DIR}/vcpkg/scripts/buildsystems/vcpkg.cmake"
  CACHE STRING "Vcpkg toolchain file")

add_subdirectory(msdf-atlas-gen)
