# House of Negotiated Selves

Ars Electronica 2026 installation: **House of Negotiated Selves**.

See **[CONTEXT.md](CONTEXT.md)** for the full handoff (concept, stations, mock UI, Stitch, Figma, voice, stack).

## Project layout

| Path | What it is |
|------|------------|
| `mock-ui/` | Vite + React kiosk mock (Soft Future Companion intake flow) |
| `mirror/` | Flutter room simulation + future Raspberry Pi mirror UI |
| `scripts/` | Debra voice sample generation (ElevenLabs) |

## Quick start (mock UI)

```bash
cd mock-ui && npm install && cd ..
npm run mock
```

Open the Vite URL (usually `http://127.0.0.1:5173`).

## Room simulation (Flutter)

```bash
cd mirror
flutter pub get
flutter run -d chrome   # or -d windows / -d macos
```

## Other scripts

```bash
cp .env.example .env   # add ELEVENLABS_API_KEY if needed
npm run samples:debra  # generate Debra voice samples
```
