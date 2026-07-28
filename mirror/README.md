# Mirror

Flutter app for the **House of Negotiated Selves** installation — room simulation
and future Raspberry Pi mirror/kiosk UI. Part of the [ARS-electronica](../) monorepo.

Originally scaffolded for Kunstuni HP8.02; layout will be updated to match the
corridor + hexagon design in [CONTEXT.md](../CONTEXT.md).

## What This Is

A room with 3 smart mirrors (7" Raspberry Pi touch displays) behind curtains.
Each mirror shows its own UI. A central server coordinates everything. The app
has two modes:

- **Simulation** — a 2D digital twin for designing and debugging on macOS/web
- **Kiosk** — the production app running on a Raspberry Pi attached to a mirror

## Getting Started

```bash
# Install Flutter (>= 3.12.2)
# https://docs.flutter.dev/get-started/install

# Run
flutter pub get
flutter run -d macos        # macOS desktop
flutter run -d chrome        # web (good for sharing with others)
```

No Android or iOS — this is desktop/web only.

## Project Structure

```
lib/
    main.dart                  # entry point
    simulation/                # simulation mode UI
    mirror/                    # kiosk/mirror UI (to do)
    models/                    # data models (to do)
    controllers/               # business logic (to do)
    shared/                    # code used by both modes
```

## Room Layout

The room is 8.6 m × 4.8 m × 2.8 m. Inside there is a curtained experience
zone with 3 mirrors on the west, north and east walls. Layout data lives in
`data/room.json` (draft — pending Blender model).

See [DATA_PLAN.md](DATA_PLAN.md) for the JSON schema and planned SQLite
(drift) dev workflow.

## Building for Raspberry Pi

See [BUILD.md](BUILD.md) for Pi 4 setup, build commands, and deployment.

## Architecture

See [AGENTS.md](AGENTS.md) for the full design document — room state model,
networking approach, coding conventions.
