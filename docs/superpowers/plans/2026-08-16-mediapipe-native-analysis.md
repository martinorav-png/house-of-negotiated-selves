# MediaPipe-native facial analysis implementation plan

> **For Codex:** Execute this plan test-first in the current working tree. Do not commit or push.

**Goal:** Make Stations I and II visually quieter and add real browser-native facial response to Station I's analysis overlay.

**Architecture:** Extend the existing `useMirrorCamera` FaceLandmarker call instead of adding another tracking stack. Convert vendor result shapes to a small app-owned signal model in a pure library module, then consume that model in the camera canvas and CSS. Keep station shell changes independent of tracking so missing camera permission never blocks the journey.

**Tech Stack:** React 19, TypeScript, Vite, Vitest/jsdom, MediaPipe Tasks Vision, Canvas 2D, CSS.

---

### Task 1: Normalize MediaPipe facial signals

**Files:**
- Create: `orb-platform/src/lib/mirrorFaceSignals.ts`
- Test: `orb-platform/src/lib/mirrorFaceSignals.test.ts`

1. Add failing tests for neutral defaults, bilateral blendshape aggregation, directional gaze, and identity/rotated transformation matrices.
2. Run the focused test and confirm the missing implementation fails.
3. Implement the typed category lookup, clamping, and matrix-to-normalized-head-pose conversion.
4. Re-run the focused test until it passes.

### Task 2: Extend the camera hook

**Files:**
- Modify: `orb-platform/src/hooks/useMirrorCamera.ts`
- Test: `orb-platform/src/hooks/useMirrorCamera.runtime.test.tsx`

1. Add failing runtime assertions that the landmarker requests blendshapes and transformation matrices and that a detected result reaches the hook's signal output.
2. Run the focused hook test and confirm the failure.
3. Enable both MediaPipe outputs for GPU and CPU fallback creation, derive signals on every detection, and reset to neutral when no face is found.
4. Re-run the hook tests until they pass.

### Task 3: Remove top-right station content

**Files:**
- Modify: `orb-platform/src/components/MirrorStationShell.tsx`
- Modify: `orb-platform/src/components/StationTwo.tsx`
- Test: existing Station I and Station II runtime tests

1. Add failing assertions that phase labels and the Station II elapsed timer are absent from the header.
2. Run the focused station tests and confirm the failure.
3. Remove the shell's right-status API and Station II timer state/formatter while preserving the top-left station and recording indicators.
4. Re-run focused station tests until they pass.

### Task 4: Make the analysis overlay responsive and add pale blue

**Files:**
- Modify: `orb-platform/src/components/MirrorCameraLayer.tsx`
- Modify: `orb-platform/src/components/MirrorJourney.css`

1. Pass normalized signals into the canvas draw routine and expose bounded CSS variables on the camera stage.
2. Add a mouth trace, blink-sensitive eyes, gaze-responsive targets, and restrained head-pose offset.
3. Add pale-blue design tokens and apply them only to active/system feedback while retaining white primary copy.
4. Inspect Station I and Station II at 1080x1920 and confirm no top-right text, overflow, or low-contrast primary text.

### Task 5: Regression verification

**Files:**
- Modify: `orb-platform/design-qa.md`

1. Run the full Vitest suite.
2. Run the production build.
3. Inspect both station routes in the portrait browser, check console warnings/errors and the Vite overlay, and record the results in the QA note.
4. Leave the working tree uncommitted and report the exact verification results.
