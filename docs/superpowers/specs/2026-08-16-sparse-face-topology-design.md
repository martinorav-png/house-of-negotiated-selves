# Sparse facial topology design

## Outcome

Station I's face-analysis overlay gains a moderately richer topology across the forehead, cheeks, and jaw without becoming a dense mask. The existing face oval, eyes, nose, lips, gaze targets, and expression response remain visually dominant.

## Geometry

- Use MediaPipe's canonical `FaceLandmarker.FACE_LANDMARKS_TESSELATION` connections so every new edge follows the detected face rather than an invented drawing.
- Select every fourth tessellation connection in its stable source order. This creates a consistent sparse mesh while retaining coverage across the full face.
- Draw the sampled connections as one batched Canvas path per frame for predictable performance.
- Skip connections whose endpoint landmarks are unavailable.

## Visual hierarchy

- Sparse mesh: pale blue at 0.16 alpha and 0.55 CSS-pixel line width.
- Existing feature contours: retain their current 0.42–0.94 alpha and 1–3.5 pixel widths.
- Dissolve phase: reduce sparse topology to 0.04 alpha together with the existing layer fade.
- No mesh is drawn when the overlay mode is `none` or no face has been detected.

The result should read as technical facial analysis at close range while disappearing into the reflection from farther away.

## Architecture

A pure `sampleFaceTopologyConnections` helper owns deterministic connection sampling and malformed-connection filtering. `MirrorCameraLayer` consumes the helper and MediaPipe's official tessellation list, maps endpoints through the existing mirrored cover-crop coordinate system, and batches them into the current canvas render pass. No camera, model, or signal pipeline changes are required.

## Verification

Unit tests cover deterministic sampling and invalid endpoints. The camera-layer runtime test verifies that topology edges are actually added without restoring the removed “EYE VECTOR” label. The full suite, production build, and a live-camera visual check provide final coverage; if camera permission remains unavailable, automated geometry coverage is recorded as the residual visual-test limitation.
