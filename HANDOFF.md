# Handoff — continue on the other Mac

**Date:** 2026-08-03  
**Repo:** https://github.com/martinorav-png/house-of-negotiated-selves  
**Branch:** `main`  
**Pull first:** `git pull origin main`

This file is the short “open this on the other computer” note. Full project context stays in [`CONTEXT.md`](CONTEXT.md). Design system for Datebooth: [`DESIGN.md`](DESIGN.md).

---

## What to continue next (highest priority)

### Webcam face parallax for `orb-platform` — **approved, not built yet**

Spec + plan are ready. Implementation has **not** started (no MediaPipe in `package.json` yet).

| Doc | Path |
|-----|------|
| Design (approved) | [`docs/superpowers/specs/2026-08-03-webcam-face-parallax-design.md`](docs/superpowers/specs/2026-08-03-webcam-face-parallax-design.md) |
| Implementation plan | [`docs/superpowers/plans/2026-08-03-webcam-face-parallax.md`](docs/superpowers/plans/2026-08-03-webcam-face-parallax.md) |

**Locked decisions**

1. **Camera only** — viewpoint orbits; orb/room shaders do not react to face  
2. **Dramatic** “peer through a window” travel  
3. **Same gesture as mic** (click / `M`) starts audio + video together  
4. **MediaPipe Face Landmarker** (`@mediapipe/tasks-vision`)  
5. **No on-screen webcam preview** — pose numbers only (not stored biometrics)

**On the other machine, tell the agent:**

> Continue from `docs/superpowers/plans/2026-08-03-webcam-face-parallax.md`. Use inline or subagent-driven execution. Spec already approved.

---

## What’s already in `orb-platform` (built & working)

Point-cloud installation scene (React 19 + R3F + Three.js + postprocessing):

- Fixed framing camera (until parallax lands)
- Dense point-cloud orb + room + platform
- Smooth hover damp (no snap)
- **Autonomous heartbeat ripple** (lub–dub) via `src/lib/heartbeat.ts` + `uPulse`
- Mic-driven motion (`useAudioAnalyser` — click once / `M`)
- CRT stats wall + spatial question under orb
- Restrained bloom / CA / vignette

```bash
cd orb-platform
npm install
npm run dev
# → http://localhost:5176
```

Key knobs: `orb-platform/src/config.ts` (`ORB.heartbeat*`, `SCAN`, `PALETTE`, `CAMERA`).

---

## Quick start on a fresh machine

```bash
git clone https://github.com/martinorav-png/house-of-negotiated-selves.git
cd house-of-negotiated-selves
git pull origin main

# Orb experience (current focus)
cd orb-platform && npm install && npm run dev

# Datebooth (separate track)
# cd datebooth-ui && npm install && npm run dev   # :5174
```

Needs **HTTPS or localhost** for mic/camera. Face tracking will need camera permission after the plan is implemented.

Optional team Flutter repo:

```bash
git clone https://github.com/tototoben/eka-ars26-house.git work/eka-ars26-house
```

(`work/eka-ars26-house/` is gitignored as a nested clone.)

---

## Repo map (relevant bits)

| Path | Role |
|------|------|
| `orb-platform/` | **Active** 3D orb / room experience |
| `orb-ui/` | Older orb experiments — don’t extend |
| `assets/moodboard-inspo/` | Visual references for the orb language |
| `docs/superpowers/` | Spec + plan for face parallax |
| `datebooth-ui/` | Datebooth kiosk UI (other track) |
| `CONTEXT.md` | Full installation handoff |

---

## Do not re-litigate

- Composition = tension; no fake HUD / dual globes  
- Restrained bloom; orb glow kept down  
- CRT: plain language, one large centered line  
- Question text in 3D space under orb, no blue underplate  
- Hover transition must stay damped (no snap `useEffect` on `hoverAmt`)

---

## After face parallax ships — smoke checklist

1. Click once → mic + camera; status reflects both  
2. Lean L/R/U/D → strong camera swing; orb stays framed  
3. Lean closer → pull in  
4. Leave frame → ease to default  
5. Deny camera → mic still works  
6. No video preview on screen  
7. `npm run build` in `orb-platform` passes
