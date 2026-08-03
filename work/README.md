# Team production repo

This folder holds the **EKA team monorepo** for the physical install, separate from Martin's UI prototypes at the repo root.

## eka-ars26-house

**Remote:** https://github.com/tototoben/eka-ars26-house  
**Clone (fresh machine):**

```bash
git clone https://github.com/tototoben/eka-ars26-house.git work/eka-ars26-house
```

### Layout

| Path | Role |
|------|------|
| `central/` | macOS orchestration server (room state hub) — _to be set up_ |
| `mirror/` | Flutter smart-mirror app (Simulation + Kiosk modes) |
| `voice/` | ESP-VOCAT firmware — _to be set up_ |

### Run mirror (Flutter)

```bash
cd work/eka-ars26-house/mirror
flutter pub get
flutter run -d macos    # or -d chrome
```

See `mirror/README.md`, `mirror/BUILD.md`, and `mirror/AGENTS.md` inside the team repo.

## Relationship to repo root

| Root folder | Team folder | Notes |
|-------------|-------------|-------|
| `mirror/` | `work/eka-ars26-house/mirror/` | Same Flutter sim; root copy may drift — **team repo is source of truth** for production |
| `datebooth-ui/` | — | Martin's Datebooth UI prototype (not in team repo yet) |
| `mock-ui/` | — | Legacy Institutional / Soft Future gallery + station scripts |

Pull team changes from `tototoben/eka-ars26-house`; push UI work from `martinorav-png/house-of-negotiated-selves`.
