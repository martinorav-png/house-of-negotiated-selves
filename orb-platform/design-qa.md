# Mirror Stations I–II Design QA

## Comparison target

- Source visual truth: Figma board `ARS ELECTRONICA UI`, file `x3C2gq8J7oU6XpIKWZ1OSV`, overview node `115:5`.
- Focused Station I source: `qa-source-station-1.png` (node `115:40`, 289 × 456 px).
- Focused Station II height source: `qa-source-station-2-height.png` (node `115:33`, 284 × 456 px).
- Implementation URL: `http://127.0.0.1:5176/#/station-1` and `#/station-2`.
- Final Station I evidence: `qa-monochrome-1080x1920.png` (1080 × 1920 px).
- Final Station II evidence: `qa-monochrome-station-2.png` and `qa-monochrome-station-2-height.png` (1080 × 1920 px each).
- Responsive evidence: `qa-monochrome-portrait-preview-final.png` and `qa-monochrome-fill-preview.png` at a 1280 × 720 CSS viewport.
- Device scale factor: 1. Portrait source sketches and implementation captures were compared by composition and state rather than pixel-for-pixel density because the Figma source is a photographed hand sketch, not a dimensioned UI frame.

## State and interaction coverage

- Station I: name, age, automated face/eye/profile sequence, self-check, yes/no answer, dissolve/calculating, and handoff to Station II.
- Station II: percentile, companion match, Debra briefing, three yes/no questions, live height slider, completion, and handoff to Station III.
- Camera permission was intentionally not accepted during automated browser QA. Denied/pending permission now produces a usable `Camera unavailable` mirror fallback after four seconds. Active camera setup and cleanup are covered by runtime tests.
- Keyboard/button controls, range input, internal journey links, portrait layout, and landscape layout were exercised.
- Runtime overlay checked: no Vite error overlay appeared on either route. One previously observed non-blocking upstream Three.js deprecation warning (`THREE.Clock`) remains.

## Full-view comparison evidence

- The final implementation preserves the sketch’s sparse mirror composition: the visitor/reflection occupies the central visual field, station status stays peripheral, and interaction copy is held in a lower panel.
- The approved follow-up keeps black and white dominant, with lightly saturated pale blue restricted to active system feedback. Thin-to-medium outlines, unrounded controls, and restrained diagnostic typography remain consistent across both stations.
- Station II keeps only the recording status at upper left; the top-right timer and Station I phase labels were removed. Debra moves independently over the reflection field.
- The portrait preview measures exactly 405 × 720 at a 1280 × 720 viewport (9:16, ratio 0.5625); fill mode measures 1280 × 720. At a 1080 × 1920 viewport the portrait station measures exactly 1080 × 1920 and fills the screen.

## Focused comparison evidence

- Station I node `115:40` was compared directly with `qa-station-1-final.png`: face/eye analysis leads to the same central self-image question and paired Yes/No control.
- Station II node `115:33` was compared directly with `qa-station-2-height-final.png`: a second outlined figure sits beside the visitor and responds to a horizontal height control.
- Typography, control outlines, margins, status framing, and copy were legible at full size, so no additional crops were needed.

## Required fidelity surfaces

- Fonts and typography: neutral grotesk display text plus compact monospaced/letter-spaced system labels support the sketch’s utilitarian mirror annotation language; hierarchy and wrapping are stable in both orientations.
- Spacing and layout rhythm: large quiet mirror field, thin top/bottom rules, lower-aligned prompts, and compact controls match the source’s proportions and sequencing.
- Colors and tokens: implementation uses `#000000` and `#ffffff` for primary surfaces and narrative text. `#b9dceb` and related translucent values identify focus, recording, progress, range, and live tracking state; the pale blue does not replace high-contrast white copy.
- Large-title treatment: Stations I and II now reuse Station III's `MirrorHeadline` canvas renderer, including uppercase Helvetica-style glyphs, animated grain, smudge, and fade-in. Crisp DOM text remains available to assistive technology while the duplicate canvas is decorative.
- Face topology: Station I samples every fourth edge from MediaPipe's official face tessellation and draws the result as one `0.55px`, low-opacity pale-blue Canvas stroke behind the stronger feature contours. Dissolve reduces that mesh from `0.16` to `0.04` alpha.
- Image quality and asset fidelity: the live camera is the primary image layer; Debra reuses the project’s existing rendered orb asset. The companion outline is a live functional visualization controlled by the slider.
- Copy and content: prompts implement the approved journey and draw Station II questions from the supplied question material while keeping the short yes/no interaction style shown in Figma.
- Accessibility and behavior: labelled fields/slider, semantic buttons and links, keyboard Y/N shortcuts, visible focus, reduced-motion handling, and a camera-unavailable state are present.

## Findings

- No actionable P0, P1, or P2 findings remain.
- P3: Debra is deliberately bright and granular against black. It may benefit from a final on-site brightness calibration for the projector.
- Residual test gap: the live face-landmark overlay could not be visually inspected in the controlled browser without granting camera permission. Its geometry, blendshape/head-pose normalization, signal propagation, success path, denial path, pending-permission timeout, and cleanup are covered by automated tests.

## Comparison history

1. Initial comparison found a P2 kiosk-fidelity issue: the developer station switcher appeared over the Station I and II mirror screens. Fix: hide the switcher on the two new kiosk routes. Post-fix evidence: `qa-station-1-final.png`, `qa-station-2-fresh.png`, and `qa-station-2-height-final.png` show clean station chrome.
2. Live browser testing found a P2 incomplete state: an unanswered browser permission prompt left `Starting camera` indefinitely. Fix: add a four-second fallback with late-stream cleanup and a red-green regression test. Post-fix evidence: final screenshots show `Camera unavailable` while all journey controls remain usable.
3. The initial Debra treatment lacked definition. Fix: tune opacity and cool-filter treatment while keeping the orb pale and non-dominant. Post-fix evidence: `qa-station-2-fresh.png` and `qa-station-2-height-final.png`.
4. The approved monochrome override changed Station I/II to black with white text and outlines. The first landscape pass exposed a P2 overlap between camera fallback copy and the intake heading. Fix: move fallback status to 36vh so it remains distinct at both landscape-preview and portrait heights. Post-fix evidence: `qa-monochrome-portrait-preview-final.png` and `qa-monochrome-1080x1920.png`.
5. Added a development-only persistent portrait/fill switch. Browser measurements confirmed a 0.5625 frame ratio in portrait preview, full 1280 × 720 coverage in fill mode, and exact 1080 × 1920 full-bleed behavior on a portrait viewport.
6. Enabled MediaPipe face blendshapes and facial transformation matrices in the existing browser-native camera pipeline. Blink, gaze, mouth, brow, and head pose now drive the pale-blue face/eye/mouth tracking treatment without a second camera or bridge service.
7. The first post-change Station II inspection found the development portrait/fill control overlapping the recording label. Fix: move the development control to the viewport edge; follow-up bounding-box inspection confirmed no overlap, and both station frames reported no document overflow.
8. Unified the large prompt typography with Station III through a shared `JourneyHeadline` adapter. Portrait browser inspection covered Station I intake, Station II percentile, and the first binary question: the 355 × 99 px canvases remained within their content regions, the question retained a 34 px gap before its controls, and no overflow or Vite error overlay appeared.
9. Added a sparse official MediaPipe facial topology behind the existing oval, eyes, nose, and lips. Pure tests cover deterministic one-in-four sampling and malformed edges; the Canvas runtime test confirms more than 40 mapped edges are emitted in a single `0.55px` stroke without restoring the removed `EYE VECTOR` label. Live appearance remains dependent on camera permission.
10. Renamed the Station II guide to Debra and attached the 18px white introduction directly below her 150px orb for the companion-intro and Debra-brief phases. Browser measurements at 405 × 720 confirmed a 24ch centered measure, no overlap with either lower headline, one copy instance during the briefing, and removal when the first question appears. The full suite passed 103 tests across 29 files, and the production build completed successfully.
11. Added the seven supplied Debra MP3 recordings. A speech-content audit corrected the initial filename-order assumption: Station II is silent through percentile, companion introduction, and briefing; clips 1–5 match attractiveness, challenge, companionship, height, and completion; clips 6–7 match Station III's “Now is your chance” and “Introduce yourself…” screens. In-app browser inspection confirmed no audio element on all three opening screens, clip 1 appearing exactly with the attractiveness question, gesture-unlocked playback, and the Station III intro handoff.
12. Added and semantically named the two later recordings. `08-do-you-like-what-you-see.mp3` now starts only with Station I's self-check text. `09-i-will-help-you-describe-the-companion-you-believe-you-want.mp3` starts when Debra and her introduction first appear in Station II and remains mounted through the following briefing screen, avoiding a restart or early cutoff at the phase boundary.

## Implementation checklist

- [x] Station I and Station II are separate new routes.
- [x] All required phases and controls are implemented.
- [x] Figma sketch layout and the approved high-contrast monochrome override are reflected in the visual system.
- [x] Portrait and landscape views are usable.
- [x] Main path works without camera permission.
- [x] Rich MediaPipe tracking outputs are normalized and test-covered.
- [x] Sparse MediaPipe topology is sampled deterministically and batched into one Canvas stroke.
- [x] Station I/II large titles share Station III's textured headline renderer without losing semantic text.
- [x] Browser runtime overlay checked.
- [x] Debra voice clips are packaged locally, phase-mapped, gesture-recoverable, and transition-cleaned.

final result: passed
