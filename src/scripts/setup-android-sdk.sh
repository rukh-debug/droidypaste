#!/bin/bash

# Create Android SDK directory in home if it doesn't exist
ANDROID_HOME="$HOME/Android/Sdk"
mkdir -p "$ANDROID_HOME"

# Create necessary SDK directories
mkdir -p "$ANDROID_HOME/platforms"
mkdir -p "$ANDROID_HOME/build-tools"
mkdir -p "$ANDROID_HOME/platform-tools"
mkdir -p "$ANDROID_HOME/cmdline-tools"

echo "Created Android SDK directory structure at $ANDROID_HOME"
echo ""
echo "Now run the build with:"
echo "ANDROID_HOME=$ANDROID_HOME ANDROID_SDK_ROOT=$ANDROID_HOME npx expo run:android"