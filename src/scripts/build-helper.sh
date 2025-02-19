#!/bin/bash

# Script to select release type (APK or AAB) and build accordingly for React Native Android

# --- Configuration ---
# Set your ANDROID_HOME and ANDROID_SDK_ROOT here if they are not already set in your environment.
# These are often needed for React Native Android builds.
export ANDROID_HOME="${ANDROID_HOME:-/home/rukh/Android/Sdk}"  # Uses existing env var if set, otherwise defaults
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-/home/rukh/Android/Sdk}" # Same as above

# --- Functions ---

build_apk() {
  echo "Building APK release..."
  echo "Running: npx react-native run-android --variant=release"
  npx react-native run-android --mode=debug

  # After run-android, APK should be in android/app/build/outputs/apk/release
  echo ""
  echo "APK build completed."
  echo "You can find the APK file in: android/app/build/outputs/apk/release/"
  echo "Remember to uninstall previous versions on your device for a clean install."
  echo ""
}

build_aab() {
  echo "Building AAB release..."
  echo "Running: ./gradlew bundleRelease"
  ./gradlew bundleRelease

  # AAB should be in android/app/build/outputs/bundle/release
  echo ""
  echo "AAB build completed."
  echo "You can find the AAB file in: android/app/build/outputs/bundle/release/"
  echo ""
}

# --- Main Script ---

echo "Please select the type of release you want to build:"
echo "1. APK (Android Application Package - for direct installation on devices)"
echo "2. AAB (Android App Bundle - for Google Play Store)"
echo ""
read -p "Enter your choice (1 or 2): " release_type

case "$release_type" in
  1)
    build_apk
    ;;
  2)
    build_aab
    ;;
  *)
    echo "Invalid choice. Please enter 1 or 2."
    exit 1
    ;;
esac

echo "Release build process finished."
