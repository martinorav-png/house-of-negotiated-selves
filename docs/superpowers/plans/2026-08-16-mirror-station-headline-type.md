# Shared Station III Headline Treatment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render every large Station I/II prompt with Station III's uppercase grain-and-smudge canvas treatment while retaining real semantic text.

**Architecture:** Add a small `JourneyHeadline` adapter around the existing `MirrorHeadline` renderer. The adapter owns accessibility and Station I/II sizing, while each station supplies deliberate line breaks for its current phase copy. Existing inputs, controls, camera logic, and Station III rendering remain unchanged.

**Tech Stack:** React 19, TypeScript, Canvas 2D, CSS, Vitest/jsdom, Vite.

## Global Constraints

- Reuse Station III's `MirrorHeadline` rendering path and live text settings rather than approximating the effect in CSS.
- Preserve the current Station I/II content positions, black field, white hierarchy, and pale-blue tracking accents.
- Apply the treatment only to large titles, questions, and prompts.
- Keep typed values, explanatory copy, buttons, status text, camera fallback copy, and footer text crisp.
- Preserve real DOM text and hide the duplicate decorative canvas from assistive technology.
- Do not commit or push the current worktree.

---

### Task 1: Accessible shared journey headline

**Files:**
- Create: `orb-platform/src/components/JourneyHeadline.tsx`
- Create: `orb-platform/src/components/JourneyHeadline.runtime.test.tsx`
- Modify: `orb-platform/src/components/MirrorJourney.css`

**Interfaces:**
- Consumes: `MirrorHeadline({ lines, className })` from `MirrorHeadline.tsx`.
- Produces: `JourneyHeadline({ as?: 'h1' | 'span', children: string, lines: string[], className?: string })`.

- [ ] **Step 1: Write the failing component test**

Render `JourneyHeadline` with `children="Proceeding with facial analysis"` and `lines={['Proceeding with', 'facial analysis']}`. Assert that the selected semantic element contains the original mixed-case text, exactly one `.journey-headline-canvas` exists inside an `aria-hidden="true"` wrapper, and the semantic copy is present independently of Canvas support.

- [ ] **Step 2: Run the focused test and verify the red state**

Run: `npm test -- --run src/components/JourneyHeadline.runtime.test.tsx`

Expected: FAIL because `JourneyHeadline.tsx` does not exist.

- [ ] **Step 3: Implement the adapter and its CSS**

Create a semantic wrapper whose visually hidden copy is the `children` string and whose decorative branch renders `<MirrorHeadline lines={lines} className="journey-headline-canvas" />`. Add Station I/II-only CSS for the hidden copy, canvas width, natural aspect ratio, and inherited maximum width; do not alter `.mirror-headline` in Station III.

- [ ] **Step 4: Run the focused test and verify green**

Run: `npm test -- --run src/components/JourneyHeadline.runtime.test.tsx`

Expected: one passing test with no warnings.

### Task 2: Replace Station I large titles

**Files:**
- Modify: `orb-platform/src/components/StationOne.tsx`
- Modify: `orb-platform/src/components/StationOne.runtime.test.tsx`

**Interfaces:**
- Consumes: `JourneyHeadline` from Task 1.
- Produces: Station I phases whose large visible copy is rendered by `.journey-headline-canvas` while existing form labels and semantic wording remain intact.

- [ ] **Step 1: Add failing journey assertions**

Assert that the name prompt is a semantic label containing one textured headline canvas, the analysis message contains one textured headline canvas, and the self-check and completion states retain their exact text in a semantic heading.

- [ ] **Step 2: Run the Station I runtime test and verify red**

Run: `npm test -- --run src/components/StationOne.runtime.test.tsx`

Expected: FAIL because the existing large labels and headings do not render `.journey-headline-canvas`.

- [ ] **Step 3: Replace large Station I copy**

Use `JourneyHeadline` for name, age, all `JourneyMessage` phases, self-check, calculating, and completion. Supply deliberate one-to-three-line arrays, including `['WHAT IS YOUR', 'NAME?']`, `['PROCEEDING WITH', 'FACIAL ANALYSIS']`, and `['PROCEED TO THE', 'NEXT STATION']`; retain the original mixed-case `children` for semantic text.

- [ ] **Step 4: Re-run Station I runtime test**

Run: `npm test -- --run src/components/StationOne.runtime.test.tsx`

Expected: PASS with the existing phase and navigation assertions intact.

### Task 3: Replace Station II large titles

**Files:**
- Modify: `orb-platform/src/components/StationTwo.tsx`
- Modify: `orb-platform/src/components/StationTwo.runtime.test.tsx`

**Interfaces:**
- Consumes: `JourneyHeadline` from Task 1.
- Produces: Station II phases whose percentile, matching, Debora, question, height, and completion titles share Station III's renderer.

- [ ] **Step 1: Add failing Station II assertions**

Assert that the percentile, first binary question, height, and completion states each contain `.journey-headline-canvas` while their semantic text remains available through the heading.

- [ ] **Step 2: Run the Station II runtime test and verify red**

Run: `npm test -- --run src/components/StationTwo.runtime.test.tsx`

Expected: FAIL because the existing headings are plain DOM text.

- [ ] **Step 3: Replace large Station II copy**

Use `JourneyHeadline` for percentile, matching, Debora, all questions, height, and completion. Split the percentile message into three lines and every other long prompt into two or three deliberate lines; retain existing body copy and controls unchanged.

- [ ] **Step 4: Re-run Station II runtime test**

Run: `npm test -- --run src/components/StationTwo.runtime.test.tsx`

Expected: PASS with the existing question, slider, and navigation behavior intact.

### Task 4: Visual and regression verification

**Files:**
- Modify: `orb-platform/design-qa.md`

**Interfaces:**
- Consumes: the completed Station I/II headline treatment.
- Produces: verified portrait layouts and an updated QA record.

- [ ] **Step 1: Run the full automated suite**

Run: `npm test`

Expected: all tests pass.

- [ ] **Step 2: Run the production build**

Run: `npm run build`

Expected: TypeScript and Vite complete successfully; the existing bundle-size advisory may remain.

- [ ] **Step 3: Inspect representative browser states**

At the portrait preview ratio, inspect Station I intake and analysis plus Station II percentile and question states. Confirm uppercase textured glyphs, deliberate line wrapping, no clipped canvas, no overflow, preserved crisp controls, and no Vite error overlay.

- [ ] **Step 4: Record the result**

Add the shared Station III headline renderer, semantic fallback, and browser findings to `design-qa.md`. Leave the working tree uncommitted.
