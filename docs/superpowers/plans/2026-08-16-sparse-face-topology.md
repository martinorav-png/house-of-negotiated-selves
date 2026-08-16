# Sparse Face Topology Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a faint, deterministic subset of MediaPipe's official facial tessellation behind Station I's existing feature contours.

**Architecture:** A pure helper samples and validates MediaPipe connection objects. `MirrorCameraLayer` maps those sampled endpoints through its existing mirrored camera projection and strokes them as one low-opacity Canvas path before drawing the stronger feature contours.

**Tech Stack:** React 19, TypeScript, MediaPipe Tasks Vision, Canvas 2D, Vitest/jsdom, Vite.

## Global Constraints

- Use `FaceLandmarker.FACE_LANDMARKS_TESSELATION`; do not define invented facial edges.
- Select every fourth valid connection in stable source order.
- Draw the sparse topology with `rgba(185, 220, 235, 0.16)` and `0.55` CSS-pixel line width.
- Use `0.04` alpha in dissolve mode.
- Preserve all existing oval, eye, nose, lip, gaze, expression, and head-pose behavior.
- Batch the sparse edges into one Canvas path and one stroke call per render.
- Do not draw topology for `none` mode, missing landmarks, or unavailable endpoints.
- Do not commit or push the current worktree.

---

### Task 1: Deterministic topology sampling

**Files:**
- Create: `orb-platform/src/lib/mirrorFaceTopology.ts`
- Create: `orb-platform/src/lib/mirrorFaceTopology.test.ts`

**Interfaces:**
- Consumes: `FaceTopologyConnection[]`, where each item has numeric `start` and `end` properties.
- Produces: `sampleFaceTopologyConnections(connections: FaceTopologyConnection[], stride?: number): FaceTopologyConnection[]` with a default stride of `4`.

- [ ] **Step 1: Write failing unit tests**

Use nine literal connections and assert that default sampling returns connection indices `0`, `4`, and `8`. Add malformed values with negative, fractional, `NaN`, and equal endpoints and assert they are excluded before stable stride sampling.

- [ ] **Step 2: Run the focused unit test**

Run: `npm test -- --run src/lib/mirrorFaceTopology.test.ts`

Expected: FAIL because `mirrorFaceTopology.ts` does not exist.

- [ ] **Step 3: Implement minimal validated sampling**

Export the structural `FaceTopologyConnection` type and a function that filters for distinct, non-negative integer endpoints, clamps an invalid stride to `4`, and returns filtered items whose filtered index modulo stride is zero.

- [ ] **Step 4: Re-run the focused unit test**

Run: `npm test -- --run src/lib/mirrorFaceTopology.test.ts`

Expected: all topology sampling tests pass.

### Task 2: Batched sparse topology rendering

**Files:**
- Modify: `orb-platform/src/components/MirrorCameraLayer.tsx`
- Modify: `orb-platform/src/components/MirrorCameraLayer.runtime.test.tsx`

**Interfaces:**
- Consumes: `sampleFaceTopologyConnections`, `FaceLandmarker.FACE_LANDMARKS_TESSELATION`, existing `point(index)` camera mapping, and `MirrorOverlayMode`.
- Produces: one additional low-opacity Canvas stroke before existing contour strokes when landmarks and an active analysis mode are present.

- [ ] **Step 1: Add a failing runtime assertion**

Record the Canvas `moveTo`, `lineTo`, `stroke`, `strokeStyle`, and `lineWidth` operations. Render `MirrorCameraLayer` in `eyes` mode with the existing 455-landmark fixture and assert that a batched stroke uses `rgba(185, 220, 235, 0.16)`, width `0.55`, and more than 40 mapped topology edges. Retain the assertion that no `EYE VECTOR` text is drawn.

- [ ] **Step 2: Run the camera-layer runtime test**

Run: `npm test -- --run src/components/MirrorCameraLayer.runtime.test.tsx`

Expected: FAIL because the sparse topology stroke is absent.

- [ ] **Step 3: Implement the batched draw pass**

Import `FaceLandmarker` and the sampling helper. Precompute the sampled official connections at module scope. In `drawLandmarks`, begin one path, add each available edge with `moveTo`/`lineTo`, and stroke once using alpha `0.16` or `0.04` for dissolve and width `0.55`, before the existing feature paths.

- [ ] **Step 4: Re-run focused topology and camera tests**

Run: `npm test -- --run src/lib/mirrorFaceTopology.test.ts src/components/MirrorCameraLayer.runtime.test.tsx`

Expected: all focused tests pass.

### Task 3: Verification and QA record

**Files:**
- Modify: `orb-platform/design-qa.md`

**Interfaces:**
- Consumes: the completed sparse topology render pass.
- Produces: fresh regression evidence and an explicit record of any live-camera visual limitation.

- [ ] **Step 1: Run the full suite**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: TypeScript and Vite complete successfully; the existing bundle-size advisory may remain.

- [ ] **Step 3: Inspect Station I**

Open `#/station-1`, reach the face-analysis phase, and verify no layout overflow or Vite error overlay. If camera permission is unavailable, record that the topology render itself is verified by Canvas-operation tests rather than a live screenshot.

- [ ] **Step 4: Update the QA note**

Record the official MediaPipe source, one-in-four sampling, batched draw call, visual hierarchy, automated coverage, and live-camera visual status. Leave the worktree uncommitted.
