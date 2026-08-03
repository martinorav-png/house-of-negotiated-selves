# House of Negotiated Selves

Ars Electronica 2026 installation: **House of Negotiated Selves**.

**Start here on the other machine:** **[HANDOFF.md](HANDOFF.md)** (orb + face parallax next). Full context: **[CONTEXT.md](CONTEXT.md)**. Datebooth system: **[DESIGN.md](DESIGN.md)**.

## Project layout

| Path | What it is |
|------|------------|
| `datebooth-ui/` | **Active** Datebooth kiosk UI (portrait mirror, rose/charcoal romance boutique) |
| `orb-platform/` | **Orb experience** — clean React + Three.js point cloud on black void (v1 scaffold) |
| `orb-ui/` | Earlier orb experiments (superseded by `orb-platform/` for new work) |
| `mock-ui/` | Earlier Institutional / Soft Future React gallery + station scripts in `src/data/content.ts` |
| `mirror/` | Flutter room simulation (local copy; may drift from team repo) |
| `work/eka-ars26-house/` | **Team monorepo** — `central/`, `mirror/`, `voice/` ([tototoben/eka-ars26-house](https://github.com/tototoben/eka-ars26-house)) |
| `scripts/` | Debra voice sample generation (ElevenLabs) |
| `DESIGN.md` | Datebooth design system (locked from approved Entry screen) |
| `PRODUCT.md` | Product / Impeccable context |
| `CONTEXT.md` | Machine handoff: journey, stack, next steps |

## Quick start (orb-platform — current focus)

```bash
cd orb-platform && npm install && npm run dev
```

Open **http://localhost:5176**. Next: webcam face parallax — see **[HANDOFF.md](HANDOFF.md)**.

## Quick start (Datebooth)

```bash
git clone https://github.com/martinorav-png/house-of-negotiated-selves.git
cd house-of-negotiated-selves
cd datebooth-ui && npm install && npm run dev
```

Open **http://localhost:5174** (portrait frame pillarboxes on wide screens).

## Legacy mock UI (Institutional / Soft Future gallery)

```bash
cd mock-ui && npm install && npm run dev
# or from repo root: npm run mock
```

## Room simulation (Flutter)

**Team source of truth:** `work/eka-ars26-house/mirror/` (clone via `work/README.md`).

```bash
cd work/eka-ars26-house/mirror   # preferred
# or legacy root copy:
cd mirror
flutter pub get
flutter run -d chrome   # or -d macos / -d windows
```

## Other scripts

```bash
cp .env.example .env   # add ELEVENLABS_API_KEY if needed
npm run samples:debra  # generate Debra voice samples
```

## Repo

https://github.com/martinorav-png/house-of-negotiated-selves
