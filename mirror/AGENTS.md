# AGENTS.md

## Project

This Flutter desktop application has two runtime modes:

- **Simulation Mode** – a digital twin of a single room used to design, test and visualize the smart room system.
- **Kiosk Mode** – the production application running on a Raspberry Pi attached to a smart mirror.

Both modes should share the same application code wherever possible.

---

## Scope

The initial target is a **single room** containing:

- 3–5 smart mirrors
- one tracked user
- one central server
- simulated cameras
- simulated voice nodes

The simulator is intended to validate system behaviour before integrating physical hardware.

---

## Core Principle

Everything is driven from a shared room state.

The UI displays state.

Controllers modify state.

Networking updates state.

Avoid putting business logic inside widgets.

---

## Project Structure

```
lib/
    models/
    state/
    controllers/
    repositories/
    simulation/
    mirror/
    shared/
```

Keep simulation-specific code inside `simulation/`.

Keep mirror UI inside `mirror/`.

Keep shared logic outside both.

---

## Simulation

The simulator should eventually visualize:

- room layout
- mirrors
- user position
- cameras
- active mirror
- basic system state

The simulator should not become a game engine or CAD application.

Its purpose is understanding and debugging system behaviour.

---

## Kiosk Mode

The mirror application should only display the UI assigned to that mirror.

It should receive state from the central server rather than making decisions locally.

---

## Networking

Assume a central server owns the system state.

Flutter clients synchronize through MQTT (or another transport behind an abstraction).

Networking should remain separate from UI code.

---

## Development Guidelines

When adding features:

- keep simulation and production code sharing as much logic as possible
- avoid duplicate implementations
- prefer simple, readable code
- keep widgets focused on presentation
- keep state serializable where practical

When unsure, optimize for simplicity rather than flexibility.
