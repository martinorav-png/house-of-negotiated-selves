# Mirror Stations I and II — Design Specification

**Date:** 2026-08-16  
**Status:** Approved for implementation  
**Source of truth:** User brief, Figma section `115:5` (“Mirror test, sketches”), and the three question sheets in `/questions`

## Objective

Rebuild Stations I and II as coherent portrait smart-mirror experiences while preserving the existing experimental routes and the existing Station III (`#/mirror`). The two new routes are `#/station-1` and `#/station-2`.

The visitor’s live mirrored camera image is the primary surface. Interface graphics sit directly on that image and use only white, cool grey, and pale blue. The defining visual gesture is a real facial-landmark analysis that gradually disappears until the visitor is left looking at only themselves.

## Visual Direction

- Palette: white, cool grey, pale ice blue; no saturated accent colors.
- Camera: full-bleed portrait reflection, mirrored horizontally, softly desaturated, with a light translucent veil for legibility.
- Surfaces: open composition; no cards, glass panels, gradients, dark HUD fields, or pill clusters.
- Lines: thin-to-medium outlined geometry, with face-oval, eye, nose, and tracking shapes derived from MediaPipe landmarks.
- Tracking blobs: small outlined organic loops that follow smoothed landmark groups.
- Typography: restrained technical sans/monospace hierarchy, quiet rather than theatrical.
- Motion: slow deceleration, no bounce. Analysis elements disappear in a deliberate sequence.
- Portrait target: 9:16 production mirror, responsive and pillarboxed in landscape browser previews.

## Shared Runtime

Both stations use a shared mirror shell with:

1. A visible live `<video>` reflection.
2. MediaPipe Face Landmarker running locally in the browser.
3. A canvas overlay that maps landmark coordinates to the mirrored video crop.
4. Shared status chrome, prompts, outlined controls, progress, timer, and transition treatments.
5. A camera-unavailable fallback that preserves the journey with a neutral pale field and clearly states that the camera is unavailable.

No face images or biometric results are stored or transmitted. Landmark data is ephemeral and used only for live drawing and camera framing.

## Station I — Facial Analysis

Route: `#/station-1`

### State sequence

1. **Name** — “What is your name?” with a keyboard/touch text input.
2. **Age** — “What is your age?” with numeric input.
3. **Analysis notice** — “Proceeding with facial analysis.”
4. **Whole-face scan** — full reflection with face oval, eyes, nose guide, measurements, and tracking blobs.
5. **Eye focus** — camera presentation zooms toward the detected eye region while eye contours intensify.
6. **Face focus** — crop relaxes to the whole face while the full outline and quiet analysis labels return.
7. **Self-check** — “Do you like what you see?” with Yes/No controls and the instruction “Press Y or N”.
8. **Dissolve** — after the answer, labels, tracking blobs, eye contours, measurement lines, and face outline disappear one group at a time.
9. **Calculating** — raw reflection remains with a minimal outlined loading indicator.
10. **Complete** — “Proceed to the next station.” with a link to `#/station-2`.

Name and age require explicit submission. Analysis phases advance automatically at short, testable durations. Yes/No supports pointer, keyboard, and physical-keyboard input.

## Station II — Companion Construction

Route: `#/station-2`

### Persistent chrome

- Top left: outlined dot plus “RECORDING IN PROGRESS”.
- Top right: elapsed session timer.
- Full live reflection remains visible.
- Debora appears as a pale-blue point-cloud orb and drifts around the visitor without obscuring their face.

### State sequence

1. **Percentile** — “Our systems have found you to be an Xth percentile specimen.” The percentile is deterministic for the session and presented as theatrical system copy, not a real biometric claim.
2. **Companion announcement** — “You will now be matched with an AI companion.”
3. **Debora briefing** — Debora gives a concise explanation, ending with “Let’s get started.”
4. **Question 1** — “Is attractiveness important to you?”
5. **Question 2** — “Should your companion challenge you?”
6. **Question 3** — “Would you choose companionship over independence?”
7. **Height** — an outlined companion silhouette appears beside the visitor. A bottom slider adjusts its height live.
8. **Complete** — “Proceed to the next station.” with a link to `#/mirror`.

The Yes/No questions use the same pointer and Y/N keyboard controls as Station I. Debora’s path changes subtly between phases. The companion silhouette is a parametric outlined figure, visually secondary to the live visitor.

## Architecture

- `lib/mirrorJourney.ts`: pure station phase models, reducers, question data, and deterministic percentile helper.
- `lib/mirrorLandmarks.ts`: pure landmark-to-overlay geometry and crop calculations.
- `hooks/useMirrorCamera.ts`: camera permission, MediaPipe lifecycle, video stream, and current landmark sample.
- `components/MirrorCameraLayer.tsx`: live mirrored video and landmark overlay.
- `components/MirrorStationShell.tsx`: shared portrait composition and status chrome.
- `components/MirrorChoice.tsx`: accessible Yes/No input.
- `components/CompanionOutline.tsx`: live height-adjustable companion outline.
- `components/StationOne.tsx` and `StationTwo.tsx`: station-specific state orchestration and copy.
- `components/MirrorJourney.css`: shared visual system and responsive behavior.

Existing `ThirdStation`, orb, card, and avatar experiences remain unchanged.

## Failure and Reduced-Motion Behavior

- Camera denied/unavailable: show a calm fallback field; inputs and state transitions remain usable.
- Face not detected: keep full camera framing and display “ALIGN FACE WITH FRAME”; do not freeze the journey.
- MediaPipe load failure: preserve camera reflection and use static alignment guides.
- Reduced motion: remove drifting and zoom interpolation; phase changes remain readable through opacity transitions.

## Testing

- Unit-test both state machines, question order, route mapping, deterministic percentile, crop bounds, mirrored landmark mapping, and height normalization.
- Runtime-test keyboard/pointer choice behavior and form progression with jsdom.
- Run the complete Vitest suite and TypeScript/Vite production build.
- Verify both routes in a real browser at portrait and landscape sizes, including camera-denied fallback and primary keyboard interactions.

## Out of Scope

- Persisting visitor data.
- Producing a real attractiveness score.
- Recording or uploading video.
- Changing Station III.
- Connecting to production hardware, MQTT, or a backend.

