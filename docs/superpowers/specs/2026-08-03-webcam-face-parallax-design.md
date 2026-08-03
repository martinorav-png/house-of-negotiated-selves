# Webcam face parallax (MediaPipe) — Design

**Date:** 2026-08-03  
**Scope:** `orb-platform`  
**Status:** Approved in chat; awaiting spec review before implementation

## Goal

When the visitor leans or moves in front of the webcam, the Three.js camera orbits dramatically around the orb look-at — like peering through a window. Video is never shown on screen.

## Decisions (locked)

| Choice | Decision |
|--------|----------|
| What moves | Camera only (not orb/room shaders) |
| Strength | Dramatic “peer through window” |
| Start UX | Same first click / `M` as mic — one gesture |
| Tracker | MediaPipe Face Landmarker |
| Preview | Hidden video element only |

## Architecture

```
User gesture (click / M / Enter)
        │
        ▼
useMediaSensors (or paired hooks sharing one getUserMedia)
        │
        ├── audio tracks → existing AnalyserNode → audioLevels
        └── video track  → hidden <video> → Face Landmarker → facePose
                                                              │
                                                              ▼
                                                         Scene useFrame
                                                              │
                                                              ▼
                                              camera position on sphere
                                              around CAMERA.lookAt
```

### Shared state

- Add `facePose` module (same pattern as `audioLevels`):
  - `active: boolean`
  - `x, y` — face center in roughly −1…1 (mirrored so lean-left feels natural)
  - `z` — depth proxy from face bbox / landmark scale (closer → larger → pull camera in)
  - `confidence` / `present` — face detected this frame
- Written by the face-tracking loop; read only from `Scene` (or a small `CameraParallax` child) in `useFrame`.

### Permissions

- Single `getUserMedia({ audio: …, video: { facingMode: 'user', width/height modest } })` on the existing enter gesture.
- If video is denied but audio succeeds (or vice versa), continue with whatever worked; status text reflects state.
- Prefer refactoring mic start so audio + video share one stream (or start both from one gesture without double prompts). `M` toggles both sensors off/on together.

### MediaPipe

- Use `@mediapipe/tasks-vision` Face Landmarker (GPU if available, else CPU).
- Load model from CDN / local `public/` once; cache after first load.
- Detect on video frames at a capped rate (e.g. 20–30 Hz) to protect the R3F loop; smooth toward targets every frame.
- No landmarks drawn; no debug overlay unless explicitly added later.

### Camera math

- Keep current `CAMERA.lookAt` (orb).
- Base position = existing desktop/narrow framing from `CAMERA.position` / `narrowZ`.
- Each frame:
  1. Map smoothed `facePose.x/y` → yaw / pitch (degrees), clamped.
  2. Map smoothed depth → orbit radius (lean in → smaller radius / closer).
  3. Place camera on sphere around look-at; `lookAt` orb.
  4. Damp toward target (viscous, not snappy).
- When face lost: ease back to base framing over ~0.6–1.2s.
- Tunables live in `config.ts` under e.g. `PARALLAX` (maxYaw, maxPitch, radiusMin/Max, damp, detectHz).

### Reduced motion

- If `prefers-reduced-motion`: shrink yaw/pitch/radius travel (~70% reduction) or freeze to base camera. Prefer shrink so the piece still acknowledges presence lightly.

### UI copy

- Update viewport `aria-label` and status line, e.g.:
  - Idle: “Click once to enable mic & camera”
  - Active: “Mic + camera on — lean to look around”
  - Partial / error: “Mic on (camera unavailable)” / “Sensors unavailable”

## Files (expected)

| Path | Role |
|------|------|
| `src/lib/facePose.ts` | Shared pose values |
| `src/hooks/useFaceLandmarker.ts` (and/or media sensor refactor) | Video + MediaPipe |
| `src/hooks/useAudioAnalyser.ts` | Share stream / start with video |
| `src/components/Scene.tsx` | Apply parallax in `useFrame` |
| `src/config.ts` | `PARALLAX` knobs |
| `src/App.tsx` | Status + gesture wiring |
| `package.json` | `@mediapipe/tasks-vision` |

## Out of scope

- On-screen webcam preview or face mesh debug draw
- Orb / room / CRT reaction to face pose
- Separate camera permission UI
- Multi-face / body tracking

## Success criteria

1. After one gesture, leaning left/right/up/down clearly swings the viewpoint (dramatic but still reads as the same room).
2. Leaning closer pulls the camera in; stepping back eases out.
3. No video UI; privacy = pose numbers only.
4. Losing the face returns to default framing smoothly.
5. Mic-only still works if camera permission fails.
6. `npm run build` passes; reduced-motion preference respects damped range.

## Risks / notes

- First MediaPipe model download may delay first track; show status “Starting camera…” if needed.
- HTTPS or localhost required for `getUserMedia`.
- Dramatic ranges must be clamped so walls/orb stay in frame; tune in `PARALLAX` after first playtest.
