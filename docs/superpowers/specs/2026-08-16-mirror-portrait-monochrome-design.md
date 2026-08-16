# Mirror Stations Portrait Preview and Monochrome Design

## Scope

This refinement applies only to the new `station-1` and `station-2` routes. Existing Station III, Orb, Cards, and Avatars styling remains unchanged.

## Visual direction

Station I and Station II use a strict, high-contrast monochrome palette:

- page and station surface: `#000000`;
- primary text and interactive outlines: `#ffffff`;
- secondary labels, inactive lines, and camera fallback copy: `#bdbdbd` or brighter;
- live camera: mirrored, grayscale, and strongly contrasted;
- face tracking and companion outlines: white with controlled opacity;
- Debora: monochrome white/grey, distinct from the reflection without introducing color.

The existing sparse mirror hierarchy, square controls, fine rules, type scale, motion, and interaction sequence stay unchanged.

## Portrait behavior

The station remains a true 9:16 canvas. On a portrait display whose available viewport matches 9:16, it fills the viewport. On wider screens, a development-only control can switch between:

- `Portrait 9:16`: a centered 9:16 preview framed by the black browser surface;
- `Fill screen`: the station expands to the available viewport for inspection.

The selected mode persists in `localStorage` under `mirror-preview-mode` and applies to both new routes. The control is not rendered in production builds. Its accessible label states the mode it will activate. Keyboard interaction is provided by the native button behavior rather than a global shortcut, avoiding conflicts with Station I/II input.

## Architecture

- `mirrorPreviewMode.ts` owns validation, reading, and writing of the persisted mode.
- `MirrorPreviewToggle.tsx` renders the development-only switch.
- `App.tsx` owns preview mode state and scopes the modifier class/control to Station I and II.
- `MirrorJourney.css` maps the modifier class and monochrome tokens to the station shell.

## Test strategy

- Unit-test invalid/default/stored preview values and persistence.
- Runtime-test the real toggle label and click behavior.
- Assert Station I/II receive the preview modifier without changing other route composition.
- Run the full Vitest suite and production build.
- Browser-test Station I and II at a landscape viewport in portrait-preview mode and at 1080 × 1920 full-bleed.

## Constraints

- No changes to the existing Station III, Orb, Cards, or Avatars visual systems.
- No new runtime dependency.
- No Git staging, commit, push, or PR.

