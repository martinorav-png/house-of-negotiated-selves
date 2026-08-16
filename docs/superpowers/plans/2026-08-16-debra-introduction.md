# Debra Introduction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename Station II's AI guide to Debra and keep her enlarged introductory sentence directly beneath the orb while it first appears and while “Let's get started” is shown.

**Architecture:** Keep Station II's existing reducer-driven timeline and introduce the copy as an explicit presentation prop on the guide component. Rename the guide component, phase identifier, CSS selectors, and accessibility label together so visible and internal terminology cannot drift.

**Tech Stack:** React 19, TypeScript 5.9, CSS, Vitest 4, jsdom, Vite 8

## Global Constraints

- The guide's name is `Debra` everywhere; do not retain visible or internal `Debora` naming.
- Show `I will help you describe the companion you believe you want.` directly beneath Debra when the orb first appears and throughout the `debra-brief` phase.
- Hide the introduction when Station II begins asking questions.
- Render the introduction centered in white at `18px`, with a maximum line length of `24ch`.
- Keep “Let's get started.” in its existing lower message position without duplicating the introduction there.
- Preserve the existing black, high-contrast 9:16 layout and pale-blue orb treatment.
- Work test-first and do not commit or push changes.

---

### Task 1: Rename the guide and timeline phase

**Files:**
- Create: `orb-platform/src/components/DebraGuide.tsx`
- Delete: `orb-platform/src/components/DeboraGuide.tsx`
- Modify: `orb-platform/src/components/StationTwo.tsx`
- Modify: `orb-platform/src/lib/mirrorJourney.ts`
- Test: `orb-platform/src/lib/mirrorJourney.test.ts`
- Test: `orb-platform/src/components/StationTwo.runtime.test.tsx`

**Interfaces:**
- Consumes: `MirrorGuideOrb` and the existing `StationTwoPhase` reducer state machine.
- Produces: `DebraGuide({ position, showIntroduction })` and the phase literal `debra-brief`.

- [ ] **Step 1: Write failing reducer and runtime assertions**

Add explicit phase-sequence expectations to `mirrorJourney.test.ts`:

```ts
const introductionPhases = []
let state = createStationTwoState()
for (let step = 0; step < 3; step += 1) {
  state = stationTwoReducer(state, { type: 'ADVANCE' })
  introductionPhases.push(state.phase)
}
expect(introductionPhases).toEqual(['companion-intro', 'debra-brief', 'question'])
```

In `StationTwo.runtime.test.tsx`, assert the guide's accessible label and visible name are `Debra`/`DEBRA`, and assert that `Debora` is absent.

- [ ] **Step 2: Run focused tests to verify RED**

Run: `npm test -- src/lib/mirrorJourney.test.ts src/components/StationTwo.runtime.test.tsx`

Expected: FAIL because the reducer still emits `debora-brief` and the component still labels the guide `Debora`.

- [ ] **Step 3: Apply the complete rename**

Rename the union member and reducer branch to `debra-brief`. Replace `DeboraGuide.tsx` with `DebraGuide.tsx`, exporting this interface:

```tsx
export function DebraGuide({
  position = 'upper',
  showIntroduction = false,
}: {
  position?: 'upper' | 'left' | 'right'
  showIntroduction?: boolean
})
```

Update `StationTwo.tsx` imports, phase checks, local variable names, and guide usage to the new spelling.

- [ ] **Step 4: Run focused tests to verify GREEN**

Run: `npm test -- src/lib/mirrorJourney.test.ts src/components/StationTwo.runtime.test.tsx`

Expected: both test files PASS with no warnings.

### Task 2: Attach the introduction to Debra

**Files:**
- Modify: `orb-platform/src/components/DebraGuide.tsx`
- Modify: `orb-platform/src/components/StationTwo.tsx`
- Modify: `orb-platform/src/components/MirrorJourney.css`
- Test: `orb-platform/src/components/StationTwo.runtime.test.tsx`

**Interfaces:**
- Consumes: `DebraGuide.showIntroduction?: boolean` from Task 1.
- Produces: `.journey-debra-introduction` nested within `.journey-debra`, visible only during `companion-intro` and `debra-brief`.

- [ ] **Step 1: Write failing copy-lifecycle assertions**

Extend the Station II runtime test to assert this lifecycle:

```ts
expect(container.querySelector('.journey-debra-introduction')).toBeNull()
// after first timed advance
expect(container.querySelector('.journey-debra-introduction')?.textContent)
  .toBe('I will help you describe the companion you believe you want.')
// after second timed advance
expect(container.querySelector('.journey-debra-introduction')).not.toBeNull()
// after third timed advance
expect(container.querySelector('.journey-debra-introduction')).toBeNull()
```

Also assert the introduction's closest `.journey-debra` ancestor exists, which catches accidental placement back in the lower message block.

- [ ] **Step 2: Run the runtime test to verify RED**

Run: `npm test -- src/components/StationTwo.runtime.test.tsx`

Expected: FAIL because no `.journey-debra-introduction` is rendered beneath the guide.

- [ ] **Step 3: Implement the attached introduction and styling**

Render the paragraph inside `DebraGuide` only when `showIntroduction` is true. Pass that prop during `companion-intro` and `debra-brief`; remove the old lower paragraph from the `debra-brief` block. Rename all `.journey-debora*` selectors to `.journey-debra*` and add:

```css
.journey-debra-introduction {
  max-width: 24ch;
  margin: 24px auto 0;
  color: #fff;
  font-size: 18px;
  line-height: 1.35;
  text-align: center;
}
```

Wrap the 150px orb and name in `.journey-debra-orb-wrap` so the guide container can accommodate the paragraph without stretching or moving the orb.

- [ ] **Step 4: Run focused tests to verify GREEN**

Run: `npm test -- src/components/StationTwo.runtime.test.tsx src/lib/mirrorJourney.test.ts`

Expected: both test files PASS with no warnings.

### Task 3: Verify the portrait presentation and regression suite

**Files:**
- Modify: `docs/design-qa.md`

**Interfaces:**
- Consumes: Station II at `http://127.0.0.1:5176/#/station-2` with its normal three-second phase cadence.
- Produces: browser evidence for the introduction's placement, visibility lifecycle, and non-overlap in the 9:16 presentation.

- [ ] **Step 1: Run static checks and the complete automated suite**

Run: `rg -n -i "debora" src`

Expected: no matches.

Run: `npm test`

Expected: all test files PASS with no warnings.

Run: `npm run build`

Expected: TypeScript and the Vite production build complete successfully.

- [ ] **Step 2: Inspect all three affected Station II phases in the in-app browser**

At a 9:16 viewport, confirm during `companion-intro` that the 18px introduction is directly below Debra and does not overlap the bottom headline. Confirm it remains attached during `debra-brief`, while “Let's get started.” remains lower on screen. Confirm the paragraph disappears on the first question.

- [ ] **Step 3: Record the verified result**

Add a dated `Debra introduction` entry to `docs/design-qa.md` listing the three inspected states, the 9:16 viewport, and the successful test/build results.

