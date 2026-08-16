# Mirror Stations I and II Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add complete, interactive `#/station-1` and `#/station-2` portrait mirror journeys grounded in the approved Figma sketches.

**Architecture:** Pure reducers own station flow, a shared local-only camera hook owns MediaPipe, and focused React components compose the camera, overlays, Debora, controls, and companion outline. Existing experimental routes and Station III remain isolated.

**Tech Stack:** React 19, TypeScript 5.9, Vite 8, Vitest 4, MediaPipe Tasks Vision, React Three Fiber, CSS.

## Global Constraints

- Visual palette is only white, cool grey, and pale blue.
- The live mirrored camera remains the dominant surface.
- Facial overlays use actual MediaPipe landmarks when available.
- Face data is ephemeral and never stored or transmitted.
- New routes are `#/station-1` and `#/station-2`; `#/mirror` remains Station III.
- Existing experiment routes remain available.
- Do not add new dependencies.
- Do not commit, stage, or push without explicit authorization.

---

### Task 1: Route and journey state models

**Files:**
- Modify: `orb-platform/src/lib/stationRoute.ts`
- Modify: `orb-platform/src/lib/stationRoute.test.ts`
- Create: `orb-platform/src/lib/mirrorJourney.ts`
- Create: `orb-platform/src/lib/mirrorJourney.test.ts`

**Interfaces:**
- Produces `StationOnePhase`, `StationTwoPhase`, `stationOneReducer`, `stationTwoReducer`, `STATION_TWO_QUESTIONS`, `sessionPercentile`, and new station route values.

- [ ] Write failing tests for route parsing/building, exact phase order, answer storage, slider normalization, and deterministic percentile bounds.
- [ ] Run `npm test -- --run src/lib/stationRoute.test.ts src/lib/mirrorJourney.test.ts` and verify failures identify missing routes/models.
- [ ] Implement the minimum pure types, reducers, question constants, and percentile helper.
- [ ] Re-run the focused tests and verify they pass.

### Task 2: Landmark geometry and camera lifecycle

**Files:**
- Create: `orb-platform/src/lib/mirrorLandmarks.ts`
- Create: `orb-platform/src/lib/mirrorLandmarks.test.ts`
- Create: `orb-platform/src/hooks/useMirrorCamera.ts`

**Interfaces:**
- Produces `mapLandmarkToMirror`, `landmarkBounds`, `computeCameraCrop`, `MirrorLandmarkSample`, and `useMirrorCamera()`.

- [ ] Write failing geometry tests covering horizontal mirroring, padding, missing samples, and crop clamping.
- [ ] Run `npm test -- --run src/lib/mirrorLandmarks.test.ts` and verify the module is missing.
- [ ] Implement pure geometry helpers.
- [ ] Re-run geometry tests.
- [ ] Implement the hook using `getUserMedia`, one hidden processing video, `FaceLandmarker`, GPU-to-CPU fallback, cleanup, and ephemeral landmark state.
- [ ] Run `npm run build` to verify browser API and MediaPipe types.

### Task 3: Shared mirror visual components

**Files:**
- Create: `orb-platform/src/components/MirrorStationShell.tsx`
- Create: `orb-platform/src/components/MirrorCameraLayer.tsx`
- Create: `orb-platform/src/components/MirrorChoice.tsx`
- Create: `orb-platform/src/components/DeboraGuide.tsx`
- Create: `orb-platform/src/components/CompanionOutline.tsx`
- Create: `orb-platform/src/components/MirrorJourney.css`
- Create: `orb-platform/src/components/MirrorChoice.runtime.test.tsx`

**Interfaces:**
- Produces reusable station composition, camera overlay modes (`none`, `face`, `eyes`, `dissolve`), Y/N choice controls, drifting Debora, and height-adjustable outline.

- [ ] Write a failing jsdom runtime test proving Y/N keys and pointer buttons emit exactly one answer and expose accessible labels.
- [ ] Run the focused runtime test and verify failure.
- [ ] Implement `MirrorChoice` and pass the runtime test.
- [ ] Implement the shared shell, visible mirrored video, canvas landmark drawing, fallback copy, Debora wrapper, and companion outline.
- [ ] Run `npm run build` and correct any component/type errors.

### Task 4: Station I flow

**Files:**
- Create: `orb-platform/src/components/StationOne.tsx`
- Create: `orb-platform/src/components/StationOne.runtime.test.tsx`
- Modify: `orb-platform/src/components/MirrorJourney.css`

**Interfaces:**
- Consumes Task 1 reducers and Task 3 components.
- Produces the complete Station I route component.

- [ ] Write failing runtime tests for name submission, age submission, analysis copy, Yes/No answer, calculating state, and Station II completion link.
- [ ] Run the focused Station I test and verify failure.
- [ ] Implement the phase scheduler and render mapping with short injectable test durations.
- [ ] Re-run the Station I test.

### Task 5: Station II flow

**Files:**
- Create: `orb-platform/src/components/StationTwo.tsx`
- Create: `orb-platform/src/components/StationTwo.runtime.test.tsx`
- Modify: `orb-platform/src/components/MirrorJourney.css`

**Interfaces:**
- Consumes Task 1 reducers, questions, percentile helper, and Task 3 components.
- Produces the complete Station II route component.

- [ ] Write failing runtime tests for percentile copy, Debora briefing, three questions, height slider, persistent recording/timer chrome, and Station III completion link.
- [ ] Run the focused Station II test and verify failure.
- [ ] Implement phase orchestration, elapsed timer, question flow, Debora placement, slider, and completion.
- [ ] Re-run the Station II test.

### Task 6: Application integration

**Files:**
- Modify: `orb-platform/src/App.tsx`
- Modify: `orb-platform/src/index.css`
- Modify: `orb-platform/src/components/stationComposition.test.ts`

**Interfaces:**
- Consumes Station I/II components and new route values.
- Produces navigation and rendering for both new routes without altering existing route output.

- [ ] Add failing composition assertions for the two imports, route branches, and semantic navigation labels.
- [ ] Run the focused composition and route tests.
- [ ] Integrate both components and station links into `App.tsx`; add neutral switcher styling for the new routes.
- [ ] Re-run focused tests.

### Task 7: Full verification and design QA

**Files:**
- Create: `orb-platform/design-qa.md`

**Interfaces:**
- Validates the complete implementation; produces a design QA record with `final result: passed` or an explicit blocker.

- [ ] Run `npm test` and fix regressions.
- [ ] Run `npm run build` and fix type/bundle failures.
- [ ] Start Vite on a strict local port and open both routes in a real browser.
- [ ] Test name/age input, Y/N keyboard and pointer controls, question progression, slider adjustment, completion links, camera-denied fallback, and route preservation.
- [ ] Capture Station I analysis, Station I calculating, Station II question, and Station II height states at portrait dimensions.
- [ ] Compare captures against Figma nodes `115:40`, `115:37`, `115:34`, and `115:33`; record findings in `design-qa.md`.
- [ ] Fix all P0–P2 discrepancies and repeat capture until `final result: passed`.

