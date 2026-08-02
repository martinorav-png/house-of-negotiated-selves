# House of Negotiated Selves

Ars Electronica 2026 installation: **House of Negotiated Selves**.

**Start here tomorrow:** **[CONTEXT.md](CONTEXT.md)** (full handoff) and **[DESIGN.md](DESIGN.md)** (Datebooth visual system).

## Project layout

| Path | What it is |
|------|------------|
| `datebooth-ui/` | **Active** Datebooth kiosk UI (portrait mirror, rose/charcoal romance boutique) |
| `mock-ui/` | Earlier Institutional / Soft Future React gallery + station scripts in `src/data/content.ts` |
| `mirror/` | Flutter room simulation + future Raspberry Pi mirror UI |
| `scripts/` | Debra voice sample generation (ElevenLabs) |
| `DESIGN.md` | Datebooth design system (locked from approved Entry screen) |
| `PRODUCT.md` | Product / Impeccable context |
| `CONTEXT.md` | Machine handoff: journey, stack, next steps |

## Quick start (Datebooth — preferred)

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

```bash
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
