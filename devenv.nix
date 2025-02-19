{ pkgs, lib, config, inputs, ... }:
{
  android = {
    enable = true;
    reactNative.enable = true;
  };
}
