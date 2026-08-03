# Orb Platform

Fixed-camera installation: a LiDAR-style point-cloud room with a single interactive scan-orb on a raised platform.

Built with **React 19**, **TypeScript**, **React Three Fiber**, **Drei**, **Three.js**, and **@react-three/postprocessing**.

## Install & run

```bash
cd orb-platform
npm install
npm run dev
```

Open **http://localhost:5176**

```bash
npm run build    # typecheck + production build
npm run preview  # serve dist/
```

## Component structure

```
src/
├── App.tsx                      # Full-viewport shell, focus + keyboard a11y
├── config.ts                    # Layout, camera, scan densities, palette
├── context/                     # Hover / activation / reduced-motion state
├── lib/
│   ├── scanUniforms.ts          # Shared GPU uniforms (orb → room lighting)
│   ├── samplePoints.ts          # Plane / box / disk / sphere samplers
│   └── pointTexture.ts          # Soft sprite helper (optional)
├── shaders/pointCloudShaders.ts # Orb, environment, particle GLSL
└── components/
    ├── Scene.tsx
    ├── Room.tsx                 # Point-cloud enclosure
    ├── Platform.tsx             # Point-cloud pedestal + scan rings
    ├── Lighting.tsx             # Dim fill only
    ├── Orb.tsx                  # Point-cloud orb + invisible hit sphere
    ├── OrbParticles.tsx         # Soft-sprite scan burst
    └── PostProcessing.tsx       # Restrained bloom / vignette / grain
```

## Visual language

Incomplete spatial reconstruction: soft point sprites, gaps, density falloff toward the open front, horizontal scan bands, and orb-driven illumination / shockwaves in the environment shader.

Layout, camera, hover, click, keyboard, and a11y behaviour are unchanged from the solid-material version.

## Interaction

- **Hover** — brighter / larger orb points, more drift, room points near the orb lift & brighten (damped in/out)
- **Heartbeat** — idle lub–dub ripple (`ORB.heartbeatBpm` / `uPulse`) even without hover
- **Click / Enter / Space** — scan-data particle burst, orb push, expanding brightness shockwave across the room, cooldown lock
- **Mic (`M` / first click)** — voice drives orb motion after permission
- **`prefers-reduced-motion`** — fewer particles, weaker motion & bloom

**Next:** webcam face → dramatic camera parallax (spec/plan under `docs/superpowers/`; see repo `HANDOFF.md`).

## Easiest values to tweak

Edit `src/config.ts`:

| Concern | Keys |
|---------|------|
| Orb colour | `PALETTE.orbCore` / `orbMid` / `orbRim` |
| Room point colour | `PALETTE.envPoint` |
| Point counts | `SCAN.orbShell`, `roomBack`, `roomFloor`, … |
| Point size | `SCAN.envPointScale`, `orbPointScale` |
| Bloom | `POST.bloomIntensity`, `bloomLuminanceThreshold` |
| Light (real + simulated) | `LIGHT.orbIdle` / `orbHover` / `orbClick` |
| Camera | `CAMERA.position`, `fov`, `narrowZ` |
| Room size | `ROOM.width` / `height` / `depth` |
| Shockwave | `SCAN.shockwaveMaxRadius` |
| Scan band speed | `SCAN.scanSpeed` |
