{ pkgs, lib, config, inputs, ... }:
{
  android = {
    enable = true;
    reactNative.enable = true;
  };

  # Add trusted user configuration
  # users.users.${builtins.getEnv "USER"}.trusted = true;
}
