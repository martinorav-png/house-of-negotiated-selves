# Mirror Portrait Preview and Monochrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Station I and II a strict black-and-white high-contrast UI plus a persistent development-only 9:16 preview switch.

**Architecture:** A small pure preview-mode module owns persistence and validation. App state scopes a modifier class and toggle to only the new stations, while the existing station shell remains responsible for its 9:16 canvas and the journey stylesheet owns monochrome rendering.

**Tech Stack:** React 19, TypeScript, CSS, Vitest, jsdom, Vite.

## Global Constraints

- Apply visual changes only to `station-1` and `station-2`.
- Use `#000000` and `#ffffff` as the primary UI colors with secondary text no darker than `#bdbdbd`.
- Keep existing routes and journey behavior intact.
- Render the preview toggle only when `import.meta.env.DEV` is true.
- Persist the mode under `mirror-preview-mode`.
- Do not stage, commit, push, or create a PR.

---

### Task 1: Preview mode state and persistence

**Files:**
- Create: `orb-platform/src/lib/mirrorPreviewMode.ts`
- Create: `orb-platform/src/lib/mirrorPreviewMode.test.ts`

**Interfaces:**
- Produces: `type MirrorPreviewMode = 'portrait' | 'fill'`, `readMirrorPreviewMode(storage?: Pick<Storage, 'getItem'>): MirrorPreviewMode`, and `writeMirrorPreviewMode(mode, storage?: Pick<Storage, 'setItem'>): void`.

- [ ] Write tests proving the default is `portrait`, `fill` is restored, invalid values fall back to `portrait`, and writes use the exact storage key.
- [ ] Run `npm test -- --run src/lib/mirrorPreviewMode.test.ts` and verify the module-not-found failure.
- [ ] Implement the pure validation/read/write functions with guarded storage access.
- [ ] Re-run the focused test and verify it passes.

### Task 2: Development preview toggle

**Files:**
- Create: `orb-platform/src/components/MirrorPreviewToggle.tsx`
- Create: `orb-platform/src/components/MirrorPreviewToggle.runtime.test.tsx`
- Modify: `orb-platform/src/App.tsx`
- Modify: `orb-platform/src/index.css`

**Interfaces:**
- Consumes: `MirrorPreviewMode`.
- Produces: `MirrorPreviewToggle({ mode, onChange })`, which announces and activates the opposite mode.

- [ ] Write a jsdom runtime test that renders the real toggle, clicks `Fill screen`, and observes `onChange('fill')`.
- [ ] Run the focused runtime test and verify it fails because the component does not exist.
- [ ] Implement the toggle and wire App state to `readMirrorPreviewMode`/`writeMirrorPreviewMode`.
- [ ] Scope the control and `experience-mirror-preview-{mode}` class to Station I/II in development.
- [ ] Re-run the focused unit/runtime tests and verify they pass.

### Task 3: Monochrome station theme and 9:16 modes

**Files:**
- Modify: `orb-platform/src/components/MirrorJourney.css`
- Modify: `orb-platform/src/components/stationComposition.test.ts`

**Interfaces:**
- Consumes: `.experience-mirror-preview-portrait` and `.experience-mirror-preview-fill` on the app root.
- Produces: centered 9:16 preview in portrait mode, available-viewport station in fill mode, and high-contrast monochrome station tokens.

- [ ] Add a composition test that renders App on Station I and verifies the portrait modifier and preview control are present in development behavior.
- [ ] Run the focused test and verify it fails before App wiring exists.
- [ ] Replace the new stations’ pale-blue tokens with black, white, and high-contrast grey; increase camera contrast; convert tracking, Debora, rules, controls, and fallbacks to monochrome.
- [ ] Add portrait/fill modifier rules while preserving automatic 9:16 full-bleed on a 1080 × 1920 viewport.
- [ ] Re-run all focused tests and verify they pass.

### Task 4: Verification and visual QA

**Files:**
- Modify: `orb-platform/design-qa.md`
- Create: refreshed browser screenshots under `orb-platform/qa-*.png`.

**Interfaces:**
- Consumes: the implemented routes and preview modes.
- Produces: verified browser evidence and an updated QA result.

- [ ] Run `npm test` and require zero failures.
- [ ] Run `npm run build` and require a successful TypeScript/Vite build.
- [ ] In the in-app browser, switch to portrait preview at a landscape viewport and verify the 9:16 frame, toggle label, core Station I/II interactions, no clipping, and no error overlay.
- [ ] Set the viewport to 1080 × 1920 and verify the station fills it edge-to-edge.
- [ ] Compare the refreshed implementation captures with the Figma sketch nodes in one visual input and update `design-qa.md` with the monochrome override and final result.

