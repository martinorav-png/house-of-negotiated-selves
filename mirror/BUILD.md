# Building Mirror

This project has two runtime modes:

- **Simulation Mode** – digital twin for design, testing and visualization
- **Kiosk Mode** – production app for Raspberry Pi 4 smart mirrors

## Prerequisites

### All Platforms

```bash
# Install Flutter SDK (>= 3.12.2)
# See https://docs.flutter.dev/get-started/install

# Verify installation
flutter doctor
```

### Raspberry Pi 4 Setup

One-time setup on your development machine:

```bash
# Install flutterpi_tool
# Note: flutterpi_tool 0.11.0 supports Flutter up to 3.41.x
# For Flutter 3.44+, check for updates or use the old build method
flutter pub global activate flutterpi_tool

# If flutterpi_tool isn't in your PATH, add it:
# See https://dart.dev/tools/pub/cmd/pub-global
```

**Known Issue**: `flutterpi_tool` may not be compatible with the latest Flutter SDK. If you encounter build errors, check the [flutterpi_tool releases](https://github.com/ardera/flutterpi_tool/releases) for updates or use the [old build method](https://github.com/ardera/flutter-pi#building-the-app-old-method-linux-or-windows).

On the Raspberry Pi:

```bash
# Install dependencies
sudo apt update
sudo apt install -y libgl1-mesa-dev libgles2-mesa-dev libegl-mesa0 \
  libdrm-dev libgbm-dev libsystemd-dev libinput-dev libudev-dev \
  libxkbcommon-dev xdg-user-dirs

# Configure display
sudo raspi-config
# 1. System Options → Boot / Auto Login → Console (Autologin)
# 2. Advanced Options → GL Driver → GL (Fake-KMS)
# 3. Performance Options → GPU Memory → 64
# 4. Reboot

# Add user to render group
sudo usermod -a -G render $USER
```

## Development

### macOS Desktop (Simulation Mode)

```bash
# Get dependencies
flutter pub get

# Run in debug mode
flutter run -d macos

# Or specific device
flutter devices
flutter run -d <device-id>
```

### Web (Simulation Mode)

```bash
# Run in Chrome
flutter run -d chrome

# Or build for web
flutter build web

# Serve locally
cd build/web
python3 -m http.server 8000
# Open http://localhost:8000
```

The web build is ideal for sharing with non-dev team members.

## Building for Raspberry Pi 4

### First-Time Setup

```bash
# Add your Raspberry Pi as a device
flutterpi_tool devices add pi@<hostname-or-ip> --display-size=285x190

# List devices
flutterpi_tool devices
```

### Build Asset Bundle

```bash
# Debug build (default)
flutterpi_tool build

# Release build for Pi 4
flutterpi_tool build --arch=arm64 --cpu=pi4 --release

# Profile build
flutterpi_tool build --arch=arm64 --cpu=pi4 --profile
```

### Deploy to Raspberry Pi

```bash
# Using rsync (recommended)
rsync -a --info=progress2 ./build/flutter_assets/ pi@<hostname-or-ip>:~/mirror/

# Or using scp
scp -r ./build/flutter_assets/ pi@<hostname-or-ip>:~/mirror/
```

### Run on Raspberry Pi

```bash
# SSH into the Pi
ssh pi@<hostname-or-ip>

# Run the app
flutter-pi --release ~/mirror/

# Or kill any running instance first
killall flutter-pi
flutter-pi --release ~/mirror/
```

### Remote Development Workflow

```bash
# Build, deploy, and run in one command
flutterpi_tool run -d <device-id>

# Profile mode
flutterpi_tool run -d <device-id> --profile
```

## Troubleshooting

### flutterpi_tool Installation Errors

If `flutter pub global activate flutterpi_tool` fails:

```bash
# Ensure you're on latest stable Flutter
flutter upgrade

# Or use a specific version for older Flutter
flutter pub global activate flutterpi_tool ^0.3.0
```

### Raspberry Pi Display Issues

- Verify GL Driver is set to `GL (Fake-KMS)` in `raspi-config`
- Ensure GPU memory is at least 64MB
- Check that the user is in the `render` group

### Connection Issues

```bash
# Test SSH connection
ssh pi@<hostname-or-ip>

# Verify Pi is reachable
ping <hostname-or-ip>

# Check flutter-pi is running
ps aux | grep flutter-pi
```
