# Webcam Face Parallax Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drive a dramatic “peer through the window” Three.js camera orbit from MediaPipe face landmarks, started with the same gesture as the mic.

**Architecture:** One `getUserMedia({ audio, video })` stream feeds the existing audio analyser and a hidden `<video>` + Face Landmarker. Detection writes smoothed values into shared `facePose`; `Scene` reads them each frame and places the camera on a sphere around `CAMERA.lookAt`. Video is never rendered.

**Tech Stack:** React 19, R3F, Three.js, `@mediapipe/tasks-vision` Face Landmarker, Vite.

## Global Constraints

- Camera-only parallax (no orb/room face reaction)
- Dramatic yaw/pitch/radius, clamped so the room still reads
- Same first click / `M` unlocks mic + camera
- No on-screen webcam preview
- Mic-only still works if camera fails
- `prefers-reduced-motion` shrinks travel ~70%
- Do not commit unless the user explicitly asks
- Spec: `docs/superpowers/specs/2026-08-03-webcam-face-parallax-design.md`

## File structure

| Path | Responsibility |
|------|----------------|
| `orb-platform/src/lib/facePose.ts` | Shared mutable pose (like `audioLevels`) |
| `orb-platform/src/lib/faceParallax.ts` | Pure math: pose → yaw/pitch/radius |
| `orb-platform/src/lib/faceParallax.test.ts` | Unit tests for pure math |
| `orb-platform/src/config.ts` | Add `PARALLAX` + MediaPipe URLs |
| `orb-platform/src/hooks/useMediaSensors.ts` | Combined audio+video start/stop + Face Landmarker loop |
| `orb-platform/src/hooks/useAudioAnalyser.ts` | Thin re-export or delete after migrate (prefer migrate App to `useMediaSensors`) |
| `orb-platform/src/components/CameraParallax.tsx` | `useFrame` camera orbit from `facePose` |
| `orb-platform/src/components/Scene.tsx` | Mount `CameraParallax`; keep base framing setup |
| `orb-platform/src/App.tsx` | Wire sensors + status copy |
| `orb-platform/package.json` | Add `@mediapipe/tasks-vision`, `vitest` |

---

### Task 1: Config + shared pose + pure parallax math

**Files:**
- Create: `orb-platform/src/lib/facePose.ts`
- Create: `orb-platform/src/lib/faceParallax.ts`
- Create: `orb-platform/src/lib/faceParallax.test.ts`
- Modify: `orb-platform/src/config.ts` (append `PARALLAX`)
- Modify: `orb-platform/package.json` (add vitest script + dep)

**Interfaces:**
- Produces: `facePose` object; `computeOrbit(face, baseRadius, reducedMotion) → { yaw, pitch, radius }`; `PARALLAX` constants

- [ ] **Step 1: Add `PARALLAX` to config**

Append to `orb-platform/src/config.ts`:

```ts
/** Webcam face → camera orbit (dramatic window parallax) */
export const PARALLAX = {
  maxYaw: 0.55, // radians (~31°)
  maxPitch: 0.32,
  /** Orbit radius relative to default camera distance */
  radiusMinFactor: 0.72,
  radiusMaxFactor: 1.08,
  /** Face size (normalized landmark span) → depth; tuned in playtest */
  faceSizeNear: 0.45,
  faceSizeFar: 0.18,
  damp: 3.2,
  lostDamp: 2.0,
  detectIntervalMs: 33,
  reducedMotionScale: 0.3,
  wasmBase:
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm',
  modelUrl:
    'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
} as const
```

- [ ] **Step 2: Create `facePose.ts`**

```ts
/**
 * Shared face pose — written by media sensors, read in CameraParallax useFrame.
 * x/y roughly −1…1 (mirrored); z 0 far → 1 near; present = face this frame.
 */
export const facePose = {
  active: false,
  x: 0,
  y: 0,
  z: 0.5,
  present: false,
}
```

- [ ] **Step 3: Create pure `faceParallax.ts`**

```ts
import { PARALLAX } from '../config'

export type FaceSample = { x: number; y: number; z: number; present: boolean }

export function computeOrbit(
  face: FaceSample,
  baseRadius: number,
  reducedMotion: boolean,
): { yaw: number; pitch: number; radius: number } {
  const scale = reducedMotion ? PARALLAX.reducedMotionScale : 1
  if (!face.present) {
    return { yaw: 0, pitch: 0, radius: baseRadius }
  }
  const yaw = THREE_CLAMP(face.x, -1, 1) * PARALLAX.maxYaw * scale
  const pitch = THREE_CLAMP(face.y, -1, 1) * PARALLAX.maxPitch * scale
  const t = THREE_CLAMP(face.z, 0, 1)
  const factor =
    PARALLAX.radiusMaxFactor +
    (PARALLAX.radiusMinFactor - PARALLAX.radiusMaxFactor) * t
  const radiusDelta = (factor - 1) * scale
  return {
    yaw,
    pitch,
    radius: baseRadius * (1 + radiusDelta),
  }
}

function THREE_CLAMP(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v))
}

/** Map landmark face size (approx eye-distance or bbox) → z 0…1 */
export function faceSizeToDepth(size: number): number {
  const { faceSizeNear, faceSizeFar } = PARALLAX
  if (size <= faceSizeFar) return 0
  if (size >= faceSizeNear) return 1
  return (size - faceSizeFar) / (faceSizeNear - faceSizeFar)
}
```

- [ ] **Step 4: Add vitest + tests**

In `orb-platform/`:

```bash
npm install -D vitest
```

Add script `"test": "vitest run"` to `package.json`.

`orb-platform/src/lib/faceParallax.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { computeOrbit, faceSizeToDepth } from './faceParallax'

describe('computeOrbit', () => {
  it('returns base framing when face absent', () => {
    expect(computeOrbit({ x: 1, y: 1, z: 1, present: false }, 5.4, false)).toEqual({
      yaw: 0,
      pitch: 0,
      radius: 5.4,
    })
  })

  it('maps left face x to negative yaw (mirrored input assumed)', () => {
    const o = computeOrbit({ x: -1, y: 0, z: 0.5, present: true }, 5.4, false)
    expect(o.yaw).toBeLessThan(0)
  })

  it('pulls radius in when z is near', () => {
    const far = computeOrbit({ x: 0, y: 0, z: 0, present: true }, 5.4, false)
    const near = computeOrbit({ x: 0, y: 0, z: 1, present: true }, 5.4, false)
    expect(near.radius).toBeLessThan(far.radius)
  })

  it('shrinks travel under reduced motion', () => {
    const full = computeOrbit({ x: 1, y: 0, z: 0.5, present: true }, 5.4, false)
    const reduced = computeOrbit({ x: 1, y: 0, z: 0.5, present: true }, 5.4, true)
    expect(Math.abs(reduced.yaw)).toBeLessThan(Math.abs(full.yaw))
  })
})

describe('faceSizeToDepth', () => {
  it('clamps outside near/far', () => {
    expect(faceSizeToDepth(0)).toBe(0)
    expect(faceSizeToDepth(1)).toBe(1)
  })
})
```

- [ ] **Step 5: Run tests**

```bash
cd orb-platform && npm test
```

Expected: PASS

---

### Task 2: Combined media sensors hook (mic + Face Landmarker)

**Files:**
- Create: `orb-platform/src/hooks/useMediaSensors.ts`
- Modify: `orb-platform/package.json` (add `@mediapipe/tasks-vision`)
- Modify: `orb-platform/src/App.tsx` (wire hook; keep `useAudioAnalyser` unused or remove import)

**Interfaces:**
- Consumes: `facePose`, `audioLevels`, `AUDIO`, `PARALLAX`
- Produces: `{ start, stop, audioActive, videoActive, error, status }`

- [ ] **Step 1: Install MediaPipe**

```bash
cd orb-platform && npm install @mediapipe/tasks-vision@0.10.18
```

- [ ] **Step 2: Implement `useMediaSensors.ts`**

```ts
import { useCallback, useEffect, useRef, useState } from 'react'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { audioLevels } from '../lib/audioLevels'
import { facePose } from '../lib/facePose'
import { faceSizeToDepth } from '../lib/faceParallax'
import { AUDIO, PARALLAX } from '../config'

export type MediaSensorsHandle = {
  start: () => Promise<void>
  stop: () => void
  audioActive: boolean
  videoActive: boolean
  error: string | null
  starting: boolean
}

export function useMediaSensors(): MediaSensorsHandle {
  const [audioActive, setAudioActive] = useState(false)
  const [videoActive, setVideoActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  const streamRef = useRef<MediaStream | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const landmarkerRef = useRef<FaceLandmarker | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastDetectRef = useRef(0)
  const freqRef = useRef<Uint8Array | null>(null)
  const timeRef = useRef<Uint8Array | null>(null)
  // smooth targets
  const sx = useRef(0)
  const sy = useRef(0)
  const sz = useRef(0.5)

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    void ctxRef.current?.close()
    ctxRef.current = null
    analyserRef.current = null
    landmarkerRef.current?.close()
    landmarkerRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current.remove()
      videoRef.current = null
    }
    audioLevels.active = false
    audioLevels.level = 0
    audioLevels.bass = 0
    audioLevels.mid = 0
    audioLevels.treble = 0
    facePose.active = false
    facePose.present = false
    facePose.x = 0
    facePose.y = 0
    facePose.z = 0.5
    setAudioActive(false)
    setVideoActive(false)
    setStarting(false)
  }, [])

  const tickAudio = useCallback(() => {
    // Copy band analysis from useAudioAnalyser.tick (identical math)
  }, [])

  const loop = useCallback(() => {
    // 1) audio bands → audioLevels (same as useAudioAnalyser)
    // 2) if video ready + landmarker: every PARALLAX.detectIntervalMs
    //    result = landmarker.detectForVideo(video, performance.now())
    //    if face: nose tip landmark (~1) or average of face oval → x,y
    //      mirror: x = -(cx - 0.5) * 2
    //      y = -(cy - 0.5) * 2  (or + depending on playtest)
    //      size = distance(leftEye, rightEye) or bbox; z = faceSizeToDepth(size)
    //      sx/sy/sz lerp toward raw; write facePose
    //    else: facePose.present = false; ease sx→0 etc slowly in CameraParallax OR here
    // 3) raf again
    rafRef.current = requestAnimationFrame(loop)
  }, [])

  const start = useCallback(async () => {
    if (streamRef.current || starting) return
    setStarting(true)
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      })
      streamRef.current = stream

      // Audio path (same as useAudioAnalyser)
      const hasAudio = stream.getAudioTracks().length > 0
      if (hasAudio) {
        const ctx = new AudioContext()
        ctxRef.current = ctx
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = AUDIO.fftSize
        analyser.smoothingTimeConstant = 0.75
        source.connect(analyser)
        analyserRef.current = analyser
        freqRef.current = new Uint8Array(analyser.frequencyBinCount)
        timeRef.current = new Uint8Array(analyser.fftSize)
        audioLevels.active = true
        setAudioActive(true)
        if (ctx.state === 'suspended') await ctx.resume()
      }

      // Video path
      const hasVideo = stream.getVideoTracks().length > 0
      if (hasVideo) {
        const video = document.createElement('video')
        video.playsInline = true
        video.muted = true
        video.setAttribute('playsinline', 'true')
        video.style.position = 'fixed'
        video.style.width = '1px'
        video.style.height = '1px'
        video.style.opacity = '0'
        video.style.pointerEvents = 'none'
        video.srcObject = stream
        document.body.appendChild(video)
        videoRef.current = video
        await video.play()

        const vision = await FilesetResolver.forVisionTasks(PARALLAX.wasmBase)
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: PARALLAX.modelUrl,
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
        })
        landmarkerRef.current = landmarker
        facePose.active = true
        setVideoActive(true)
      }

      setStarting(false)
      rafRef.current = requestAnimationFrame(loop)
    } catch (err) {
      // Retry audio-only if combined failed
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        })
        streamRef.current = audioStream
        // …setup audio only…
        setAudioActive(true)
        setError('Camera unavailable — mic only')
        setStarting(false)
        rafRef.current = requestAnimationFrame(loop)
      } catch (err2) {
        const message =
          err2 instanceof Error ? err2.message : 'Sensor permission denied'
        setError(message)
        stop()
      }
    }
  }, [loop, starting, stop])

  useEffect(() => () => stop(), [stop])

  return { start, stop, audioActive, videoActive, error, starting }
}
```

**Landmark indices (MediaPipe Face Mesh):** use nose tip `1` for center; left eye outer `33`, right eye outer `263` for inter-ocular size. Confirm against MediaPipe docs if indices differ in tasks-vision output (478 landmarks, same topology).

Implement `loop` fully — do not leave the stub comments. Copy audio RMS/band math verbatim from `useAudioAnalyser.ts` lines 43–80.

- [ ] **Step 3: Wire App.tsx**

Replace `useAudioAnalyser` with `useMediaSensors`:

- `ensureMic` → `sensors.start()`
- `M` toggles `sensors.audioActive || sensors.videoActive` ? `stop` : `start`
- Status:

```ts
sensors.error
  ? sensors.error
  : sensors.starting
    ? 'Starting mic & camera…'
    : sensors.audioActive && sensors.videoActive
      ? 'Mic + camera on — lean to look around'
      : sensors.audioActive
        ? 'Mic on (camera unavailable)'
        : 'Click once to enable mic & camera'
```

Update `aria-label` similarly.

- [ ] **Step 4: Build check**

```bash
cd orb-platform && npm run build
```

Expected: success (CameraParallax not required yet; facePose unused is fine).

---

### Task 3: CameraParallax component + Scene integration

**Files:**
- Create: `orb-platform/src/components/CameraParallax.tsx`
- Modify: `orb-platform/src/components/Scene.tsx`

**Interfaces:**
- Consumes: `facePose`, `computeOrbit`, `PARALLAX`, `CAMERA`, `useOrbContext().reducedMotion`
- Produces: per-frame camera position + lookAt

- [ ] **Step 1: Create `CameraParallax.tsx`**

```tsx
import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CAMERA, PARALLAX } from '../config'
import { facePose } from '../lib/facePose'
import { computeOrbit } from '../lib/faceParallax'
import { useOrbContext } from '../context/OrbContext'

/**
 * Dramatic window parallax — orbits camera around look-at from facePose.
 * Base framing (fov/narrow Z) remains owned by Scene's resize effect.
 */
export function CameraParallax() {
  const { camera, size } = useThree()
  const { reducedMotion } = useOrbContext()
  const lookAt = useRef(new THREE.Vector3(...CAMERA.lookAt))
  const current = useRef({ yaw: 0, pitch: 0, radius: CAMERA.position[2] })
  const spherical = useRef(new THREE.Spherical())

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05)
    const narrow = size.width < CAMERA.narrowBreakpoint
    const baseRadius = narrow ? CAMERA.narrowZ : CAMERA.position[2]
    const baseY = CAMERA.position[1]

    const target = computeOrbit(
      {
        x: facePose.x,
        y: facePose.y,
        z: facePose.z,
        present: facePose.present && facePose.active,
      },
      baseRadius,
      reducedMotion,
    )

    const lambda = facePose.present ? PARALLAX.damp : PARALLAX.lostDamp
    current.current.yaw = THREE.MathUtils.damp(
      current.current.yaw,
      target.yaw,
      lambda,
      d,
    )
    current.current.pitch = THREE.MathUtils.damp(
      current.current.pitch,
      target.pitch,
      lambda,
      d,
    )
    current.current.radius = THREE.MathUtils.damp(
      current.current.radius,
      target.radius,
      lambda,
      d,
    )

    // Spherical around look-at: theta = yaw, phi = π/2 + pitch
    const s = spherical.current
    s.radius = current.current.radius
    s.theta = current.current.yaw
    s.phi = Math.PI / 2 + current.current.pitch

    const pos = new THREE.Vector3().setFromSpherical(s).add(lookAt.current)
    // Preserve relative height bias from base framing
    pos.y += baseY - lookAt.current.y
    // Re-normalize height: better approach — offset lookAt with fixed Y offset
    // Final preferred: start from base camera offset vector, rotate by yaw/pitch

    camera.position.copy(pos)
    camera.lookAt(lookAt.current)
  })

  return null
}
```

**Preferred final camera math (use this instead of the draft spherical+Y hack):**

```ts
// Base offset from look-at to default camera
const base = new THREE.Vector3(
  CAMERA.position[0] - CAMERA.lookAt[0],
  CAMERA.position[1] - CAMERA.lookAt[1],
  (narrow ? CAMERA.narrowZ : CAMERA.position[2]) - CAMERA.lookAt[2],
)
const baseLen = base.length()
const dir = base.clone().normalize()
// Apply yaw around Y, pitch around camera-right
const qYaw = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(0, 1, 0),
  current.current.yaw,
)
const right = new THREE.Vector3(1, 0, 0).applyQuaternion(qYaw)
const qPitch = new THREE.Quaternion().setFromAxisAngle(right, current.current.pitch)
const rotated = dir.applyQuaternion(qYaw).applyQuaternion(qPitch)
camera.position
  .copy(lookAt.current)
  .addScaledVector(rotated, current.current.radius || baseLen)
camera.lookAt(lookAt.current)
```

Allocate `THREE.Vector3` / `Quaternion` in refs — do not `new` every frame.

Also: **stop Scene’s resize effect from resetting `persp.position` every time** once parallax is active — only set fov/near/far/projection on resize; let `CameraParallax` own position continuously. On resize, update a `baseRadiusRef` that CameraParallax reads (via `size` as above).

- [ ] **Step 2: Mount in Scene**

```tsx
import { CameraParallax } from './CameraParallax'

// inside Scene return:
<CameraParallax />
```

Change the resize `useEffect` so it does **not** call `persp.position.set(...)` / `lookAt` every resize after mount — only FOV + `updateProjectionMatrix`. Initial position still comes from Canvas `camera={{ position }}`.

- [ ] **Step 3: Build**

```bash
cd orb-platform && npm run build && npm test
```

Expected: both pass.

- [ ] **Step 4: Manual browser check**

```bash
cd orb-platform && npm run dev
```

Checklist:
1. Click once → status “Starting…” then “Mic + camera on…”
2. Lean left/right/up/down → strong camera swing; orb stays framed
3. Lean closer → pull in; back → ease out
4. Cover camera / leave frame → ease to default
5. Deny camera only (if testable) → mic still works
6. No video preview visible

---

### Task 4: Cleanup + polish

**Files:**
- Modify or delete: `orb-platform/src/hooks/useAudioAnalyser.ts` (if unused, delete)
- Modify: status / aria strings if needed
- Modify: `PARALLAX` knobs after playtest

- [ ] **Step 1:** Remove dead `useAudioAnalyser` if nothing imports it.
- [ ] **Step 2:** Soften/strengthen `maxYaw` / `maxPitch` / `radiusMinFactor` so dramatic but walls still read.
- [ ] **Step 3:** `npm run build && npm test` final gate.

---

## Spec coverage

| Spec item | Task |
|-----------|------|
| MediaPipe Face Landmarker | 2 |
| Hidden video | 2 |
| Shared facePose | 1–2 |
| Camera sphere/orbit around look-at | 3 |
| Dramatic clamped range | 1 config + 4 tune |
| One gesture audio+video | 2 + App |
| Mic-only fallback | 2 |
| Reduced motion shrink | 1 `computeOrbit` |
| Status copy | 2 App |
| No preview / no orb face reaction | 2–3 |

## Placeholder / consistency review

- Hook name: `useMediaSensors` throughout
- Shared state: `facePose` + `audioLevels`
- Pure API: `computeOrbit`, `faceSizeToDepth`
- Commits omitted unless user requests
