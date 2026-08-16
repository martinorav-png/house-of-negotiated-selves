# MediaPipe-native facial analysis design

## Outcome

Stations I and II keep the approved 9:16 mirror experience while becoming quieter and more responsive. The top-right status/timer is removed, pale blue is used only for active system feedback, and Station I's analysis geometry responds to the visitor's real face without introducing a second camera pipeline or a local bridge service.

## Interface direction

- Preserve the black field, white primary typography, thin outlined geometry, and portrait-first composition.
- Remove the top-right phase label from Station I and elapsed timer from Station II. The top-left station/recording status remains.
- Introduce a lightly saturated pale blue for focus, progress, recording, slider, and face-tracking feedback. Narrative copy remains white for maximum contrast.
- Keep the development portrait/fill preview control unchanged.

## Facial signals

The existing MediaPipe `FaceLandmarker` becomes the single source of camera analysis. It requests face landmarks, blendshapes, and facial transformation matrices in the same browser-native inference call. A pure adapter converts MediaPipe categories into stable, normalized UI signals:

- bilateral blink intensity;
- horizontal and vertical gaze;
- jaw opening and smile;
- brow lift;
- head yaw, pitch, and roll derived from the transformation matrix.

Missing, incomplete, or malformed data resolves to a neutral signal set. No biometric score, identity, image, or video is stored or transmitted.

## Visual response

The camera layer exposes signals as CSS variables and uses them while drawing the tracking canvas. Eye outlines compress with blinking, the mouth outline responds to jaw/smile values, tracking targets drift subtly with gaze, and the overlay origin follows small head-pose changes. Motion remains restrained so the visitor still reads the screen as a mirror rather than a character rig.

## Verification

Pure unit tests cover blendshape aggregation and head-pose normalization. Hook runtime tests cover MediaPipe option activation and propagation of detected values. Station runtime tests ensure the removed top-right content does not return. The full test suite, production build, and portrait browser view provide the final regression checks.
