# Second Station Glass Cards and Point Field Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the second station sharp smoked-glass question cards and replace its continuous grid lines with an isolated circular point field while preserving every existing scan and card interaction.

**Architecture:** Extend `GridScan` with a backward-compatible shader pattern uniform whose default keeps the existing grid path and whose point path changes only the base visibility mask. Opt the second station into that point path without changing its scan/post props. Apply the glass material entirely in station-owned card CSS so the exact registry component remains untouched.

**Tech Stack:** React 19, TypeScript/JSX, Three.js GLSL fragment shader, CSS backdrop filtering, Vitest, Vite

## Global Constraints

- Do not modify `orb-platform/src/components/CardSwap.jsx` or `CardSwap.css`.
- Preserve all seven questions, the exact React Bits animation, three-visible-card cap, 4200ms opening hold, and reduced-motion behavior.
- Preserve the existing `GridScan` scan sweep, duration, delay, direction, glow, colors, bloom, chromatic aberration, noise, and animation loop.
- `GridScan` must default to the current grid behavior so existing consumers do not change.
- The second station alone opts into `patternStyle="points"`.
- Point mode renders isolated anti-aliased circular points, not dotted horizontal or vertical lines.
- Point variation is deterministic and bounded; do not add textures, DOM particles, new Three.js objects, or per-frame allocations.
- Cards use square corners, translucent smoked surfaces, backdrop filtering, restrained refraction edges, and readable text.
- Keep the card viewport overflow-visible and retain short-landscape fit at 844x390.

---

## File Structure

- Modify: `orb-platform/src/components/GridScan.tsx` — add the pattern selector uniform and point-mask shader path.
- Create: `orb-platform/src/components/GridScanPattern.test.ts` — source-level regression for backward compatibility and shader wiring.
- Modify: `orb-platform/src/components/SecondStation.tsx` — opt only this station into point mode.
- Modify: `orb-platform/src/components/stationComposition.test.ts` — protect all unchanged scan/post props and point-mode opt-in.
- Modify: `orb-platform/src/components/QuestionCardDeck.css` — implement sharp smoked-glass material.

### Task 1: Add the true point-field shader mode

**Files:**
- Modify: `orb-platform/src/components/GridScan.tsx`
- Create: `orb-platform/src/components/GridScanPattern.test.ts`
- Modify: `orb-platform/src/components/SecondStation.tsx`
- Modify: `orb-platform/src/components/stationComposition.test.ts`

**Interfaces:**
- Consumes: existing `GridScan` props, shader uniforms, ray-plane projection, and scan/post pipeline.
- Produces: optional `patternStyle` prop with default `'grid'`; uniform `uPatternStyle` where `0` is grid and `1` is points.

- [ ] **Step 1: Write failing shader-contract tests**

Create `GridScanPattern.test.ts` using raw source imports:

```ts
import { describe, expect, it } from 'vitest'
import gridScan from './GridScan.tsx?raw'
import secondStation from './SecondStation.tsx?raw'

describe('GridScan point pattern', () => {
  it('keeps grid as the backward-compatible default', () => {
    expect(gridScan).toContain("patternStyle = 'grid'")
    expect(gridScan).toContain("patternStyle === 'points' ? 1 : 0")
  })

  it('uses an isolated anti-aliased circular point mask', () => {
    expect(gridScan).toContain('uniform float uPatternStyle;')
    expect(gridScan).toContain('float pointFieldMask(vec2 uv)')
    expect(gridScan).toContain('length(localPoint)')
    expect(gridScan).toContain('fwidth(pointDistance)')
    expect(gridScan).toContain('hash21(cellId)')
  })

  it('selects points only for the second station', () => {
    expect(secondStation).toContain('patternStyle="points"')
  })
})
```

- [ ] **Step 2: Run the focused test and verify red**

```bash
npm test -- src/components/GridScanPattern.test.ts
```

Expected: FAIL because `patternStyle`, `uPatternStyle`, and `pointFieldMask` do not exist.

- [ ] **Step 3: Add the deterministic circular shader mask**

Add a pattern uniform and helpers near the existing shader utility functions:

```glsl
uniform float uPatternStyle;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float pointFieldMask(vec2 uv) {
  vec2 cellId = floor(uv);
  vec2 localPoint = fract(uv) - 0.5;
  float pointDistance = length(localPoint);
  float radius = mix(0.12, 0.2, hash21(cellId));
  float aa = max(fwidth(pointDistance), 1e-4);
  return 1.0 - smoothstep(radius, radius + aa, pointDistance);
}
```

Keep the existing line/dashed/dotted calculations intact, then select the mask independently for both projected planes:

```glsl
float primaryMask = uPatternStyle > 0.5
  ? pointFieldMask(gridUV)
  : max(lineX, lineY);

float altMask = uPatternStyle > 0.5
  ? pointFieldMask(gridUV2)
  : max(lineX2, lineY2);
```

In point mode, derive the bloom halo from the selected point mask rather than the old expanded line mask so no continuous line structure leaks through:

```glsl
float lineHalo = max(gx, gy) * fade;
float pointHalo = lineMask * fade;
float halo = mix(lineHalo, pointHalo, step(0.5, uPatternStyle));
```

Do not change scan pulse, aura, timing, colors, or post-processing calculations.

- [ ] **Step 4: Wire the prop and uniform without changing existing defaults**

Add `patternStyle = 'grid'` to `GridScan` props. Initialize and update:

```ts
uPatternStyle: { value: patternStyle === 'points' ? 1 : 0 }
```

```ts
u.uPatternStyle.value = patternStyle === 'points' ? 1 : 0
```

Add `patternStyle` to the relevant effect dependency arrays. Do not alter `lineStyle` mapping.

- [ ] **Step 5: Opt only the second station into points and strengthen composition coverage**

Add only this prop inside the existing `GridScan` call in `SecondStation.tsx`:

```tsx
patternStyle="points"
```

In `stationComposition.test.ts`, assert the point opt-in while retaining exact checks for current scan/post values:

```ts
expect(secondStation).toContain('patternStyle="points"')
expect(secondStation).toContain('scanOpacity={0.4}')
expect(secondStation).toContain('bloomIntensity={0.6}')
expect(secondStation).toContain('chromaticAberration={0.003}')
expect(secondStation).toContain('lineJitter={1}')
expect(secondStation).toContain('scanSoftness={1.5}')
```

- [ ] **Step 6: Run focused and full verification**

```bash
npm test -- src/components/GridScanPattern.test.ts src/components/stationComposition.test.ts
npm test
npm run build
git diff --check
```

Expected: all tests pass; build succeeds; registry CardSwap files have no diff.

- [ ] **Step 7: Verify the shader live**

At the card route, verify desktop and 844x390:

- resting geometry is made from isolated circular dots with no connected lines;
- the same scan sweep, direction, pause, glow, palette cycling, bloom, and chromatic aberration remain;
- no shader compile error, black screen, excessive shimmer, or major frame-rate regression appears;
- card animation and exact-three visibility remain unchanged.

- [ ] **Step 8: Commit**

```bash
git add orb-platform/src/components/GridScan.tsx orb-platform/src/components/GridScanPattern.test.ts orb-platform/src/components/SecondStation.tsx orb-platform/src/components/stationComposition.test.ts
git commit -m "feat: add point-field scan pattern"
```

### Task 2: Apply sharp smoked-glass card materials

**Files:**
- Modify: `orb-platform/src/components/QuestionCardDeck.css`
- Modify: `orb-platform/src/components/stationComposition.test.ts`

**Interfaces:**
- Consumes: existing `.question-swap-card`, `.station-card-*` tint variables, animated visibility markers, and responsive sizing.
- Produces: a station-owned sharp smoked-glass surface with readable question content.

- [ ] **Step 1: Write failing material-contract tests**

Add a dedicated test to `stationComposition.test.ts`:

```ts
it('renders sharp smoked-glass question cards', () => {
  expect(questionCardDeckStyles).toContain('border-radius: 0')
  expect(questionCardDeckStyles).toContain('backdrop-filter: blur(')
  expect(questionCardDeckStyles).toContain('-webkit-backdrop-filter: blur(')
  expect(questionCardDeckStyles).toContain('background-color: rgba(')
  expect(questionCardDeckStyles).toContain('inset 1px 1px 0')
})
```

- [ ] **Step 2: Run the focused test and verify red**

```bash
npm test -- src/components/stationComposition.test.ts
```

Expected: FAIL because the current cards are rounded and opaque.

- [ ] **Step 3: Implement the smoked-glass surface**

In `QuestionCardDeck.css`, preserve all layout, visibility-marker, static-stack, and responsive rules. Change only the card material:

```css
.question-deck-viewport .question-swap-card {
  border: 1px solid rgba(232, 244, 234, 0.42);
  border-radius: 0;
  background-color: rgba(8, 13, 11, 0.42);
  background-image: var(--card-art);
  background-blend-mode: soft-light;
  background-size: cover;
  color: #f3f7f3;
  backdrop-filter: blur(14px) saturate(125%);
  -webkit-backdrop-filter: blur(14px) saturate(125%);
  box-shadow:
    inset 1px 1px 0 rgba(255, 255, 255, 0.28),
    inset -1px -1px 0 rgba(8, 13, 11, 0.48),
    0 24px 54px rgba(0, 0, 0, 0.26);
}
```

Reduce the opacity of the existing `.station-card-*` `--card-art` gradients in `SecondStation.css` only if the current opaque stops prevent transparency. Preserve their sage/gold hues; do not create a new palette.

- [ ] **Step 4: Refine refraction and text legibility**

Use the existing card pseudo-element for a transparent top/left refraction line plus a localized dark reading veil. Avoid an opaque full-card black overlay. Keep the title and kicker above the material layer, and keep the front title readable over bright scan passes.

Do not add rounded corners, glossy plastic blobs, decorative lens flares, or new copy.

- [ ] **Step 5: Run verification**

```bash
npm test -- src/components/stationComposition.test.ts src/components/QuestionCardDeck.runtime.test.tsx
npm test
npm run build
git diff --check
git diff --quiet 8e55e5b716c7b7a564134d18183486db4377aab2..HEAD -- src/components/CardSwap.jsx src/components/CardSwap.css
```

Expected: all tests/build pass and the final registry-diff command exits `0`.

- [ ] **Step 6: Verify the material live**

At desktop, mobile portrait, and 844x390:

- cards have visibly square edges;
- the point field and scan can be seen through the smoked surfaces;
- edges read as thin refractive glass, not white borders;
- question text remains readable during bright scan passes;
- exactly three cards remain visible and no card/departure path is clipped;
- the 4200ms opening hold and full seven-question cycle remain intact.

- [ ] **Step 7: Commit**

```bash
git add orb-platform/src/components/QuestionCardDeck.css orb-platform/src/components/SecondStation.css orb-platform/src/components/stationComposition.test.ts
git commit -m "style: give station cards smoked glass material"
```

Omit `SecondStation.css` if no gradient-opacity change is needed.
