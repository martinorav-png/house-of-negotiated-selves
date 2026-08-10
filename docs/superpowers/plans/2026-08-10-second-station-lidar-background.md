# Second Station LiDAR Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the second station's procedural grid/dot background with a seeded stochastic `THREE.Points` reconstruction of the room, platform, and orb; retain the exact scan as a white scan-only overlay; and finish the sharp smoked-glass cards.

**Architecture:** A reusable sampler builds stable typed buffers for irregular room/platform surfaces. `CardPointCloudRoom` renders those buffers and an ambient orb with dedicated point shaders. The existing `GridScan` remains a separate transparent overlay with its base grid disabled, preserving its scan/post pipeline exactly.

**Tech Stack:** React 19, React Three Fiber, Three.js `BufferGeometry`/`THREE.Points`, custom GLSL, seeded TypeScript sampling, CSS glass materials, Vitest, Vite

## Global Constraints

- The user's attached stochastic LiDAR prompt is authoritative; no procedural full-screen dot grid may remain.
- Use actual `THREE.Points` buffer geometry sampled in continuous surface coordinates.
- Do not modify `CardSwap.jsx` or `CardSwap.css`.
- Preserve seven questions, exact-three visibility, 4200ms opening hold, reduced-motion fallback, and unclipped card motion.
- Preserve `GridScan` scan timing, direction, opacity, glow, bloom, chromatic aberration, noise, softness, and animation code.
- Disable only the base line/grid contribution in scan-only mode.
- The scan color and scan color cycle are fixed to `#ffffff`.
- Reuse `ROOM`, `PLATFORM`, `ORB`, and existing second-station camera composition.
- Expose all new visual tuning under one `SECOND_STATION_POINT_CLOUD_CONFIG` object.
- Use seeded deterministic generation, memoized typed buffers, GPU-side animation, and bounded DPR/point size.
- Keep other stations unchanged.

---

### Task 1: Build deterministic stochastic surface sampling

**Files:**
- Create: `orb-platform/src/lib/secondStationPointCloud.ts`
- Create: `orb-platform/src/lib/secondStationPointCloud.test.ts`

**Interfaces:**
- Produces: `SECOND_STATION_POINT_CLOUD_CONFIG`, `PointCloudQuality`, `ScannedPlaneSpec`, `buildScannedPlane(spec, quality)`, `buildSecondStationRoomCloud(quality)`, and `buildSecondStationPlatformCloud(quality)`.
- Returns: existing `PointCloudData` shape so `buildPointGeometry()` remains reusable.

- [ ] **Step 1: Write failing sampler tests**

Tests must assert:

```ts
expect(SECOND_STATION_POINT_CLOUD_CONFIG.desktop.pointCount).toBe(150000)
expect(SECOND_STATION_POINT_CLOUD_CONFIG.mobile.pointCount).toBe(60000)
expect(a.positions).toEqual(b.positions) // same seed
expect(a.positions).not.toEqual(c.positions) // different seed
expect(result.count).toBe(requestedCount)
expect(Math.min(...result.sizes)).toBeGreaterThanOrEqual(1)
expect(Math.max(...result.sizes)).toBeLessThanOrEqual(3)
```

For a test plane, bucket points into a 12×12 UV histogram and assert that there are empty/sparse buckets, dense buckets at least three times the sparse non-empty count, and no dominant repeated X/Y coordinates after 1e-4 quantization. Assert signed normal offsets exist on both sides of the source plane and remain within configured thickness.

- [ ] **Step 2: Run red**

```bash
npm test -- src/lib/secondStationPointCloud.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Add centralized configuration**

Define and export:

```ts
export const SECOND_STATION_POINT_CLOUD_CONFIG = {
  seed: 260810,
  desktop: { pointCount: 150000, orbCount: 26000 },
  mobile: { pointCount: 60000, orbCount: 12000 },
  pointSize: { min: 1, max: 3, scale: 0.34 },
  baseDensity: 0.75,
  densityNoiseScale: 0.35,
  densityNoiseStrength: 0.7,
  clusterStrength: 0.48,
  clusterScale: 1.8,
  clusterCount: 34,
  normalJitter: 0.012,
  tangentJitter: 0.004,
  dropoutStrength: 0.2,
  dropoutScale: 0.7,
  flickerAmount: 0.015,
  flickerSpeed: 0.5,
  depthFade: 0.15,
  orbInfluenceRadius: 2.5,
  orbInfluenceStrength: 0.35,
  scanColor: '#ffffff',
} as const
```

- [ ] **Step 4: Implement seeded surface generation**

Use a local Mulberry32-style seeded PRNG and deterministic 2D value-noise/FBM helpers. `buildScannedPlane` must:

1. create stable broad density variation from at least two noise octaves;
2. create stable random cluster centers with varied radii/strengths;
3. mix uniform candidates, Gaussian cluster candidates, and rare isolated outliers;
4. reject candidates using density probability and a separate soft irregular dropout noise field;
5. increase density/jitter near plane edges when `edgeNoise` is enabled;
6. add signed Gaussian normal jitter and smaller tangent jitter;
7. assign deterministic size, brightness, visibility, displacement, and seed attributes;
8. fill typed buffers to the exact requested count with a bounded attempt count and deterministic fallback.

No candidate position may be derived from a fixed row/column index.

- [ ] **Step 5: Assemble room and platform clouds**

Use existing scene constants and distribute the quality budget by surface area/importance:

- back wall 27%; floor 22%; left/right 15% each; ceiling 10%; corner/edge overlap remainder;
- platform box and top surface are built separately from the room budget with dense noisy edges;
- transform all samples into shared world coordinates before merging.

Reuse `mergePointClouds()` and the existing `PointCloudData` format.

- [ ] **Step 6: Verify and commit**

```bash
npm test -- src/lib/secondStationPointCloud.test.ts
npm test
npm run build
git diff --check
git add orb-platform/src/lib/secondStationPointCloud.ts orb-platform/src/lib/secondStationPointCloud.test.ts
git commit -m "feat: add stochastic lidar surface sampler"
```

### Task 2: Render the real 3D background and preserve the white scan

**Files:**
- Modify: `orb-platform/src/components/CardPointCloudRoom.tsx`
- Create: `orb-platform/src/shaders/cardPointCloudShaders.ts`
- Create: `orb-platform/src/components/CardPointCloudRoom.test.ts`
- Modify: `orb-platform/src/components/GridScan.tsx`
- Modify: `orb-platform/src/components/SecondStation.tsx`
- Modify: `orb-platform/src/components/SecondStation.css`
- Modify: `orb-platform/src/components/stationComposition.test.ts`

**Interfaces:**
- Consumes: Task 1 room/platform cloud builders, existing `sampleSphere`, `buildPointGeometry`, and scene constants.
- Produces: reusable `<CardPointCloudRoom />` canvas plus `GridScan` prop `showBasePattern?: boolean` defaulting to `true`.

- [ ] **Step 1: Write failing renderer and composition tests**

Test raw source and stable interfaces:

```ts
expect(cardRoom).toContain('buildSecondStationRoomCloud')
expect(cardRoom).toContain('buildSecondStationPlatformCloud')
expect(cardRoom).toContain('<points')
expect(cardRoom).toContain('buildPointGeometry')
expect(cardRoom).toContain('sampleSphere')
expect(shader).toContain('gl_PointCoord')
expect(shader).toContain('if (radius > 0.5) discard')
expect(shader).toContain('uOrbInfluenceRadius')
expect(shader).toContain('aSeed')
expect(gridScan).toContain('showBasePattern = true')
expect(secondStation).toContain('showBasePattern={false}')
expect(secondStation).toContain("scanColors={['#ffffff']}")
```

- [ ] **Step 2: Run red**

```bash
npm test -- src/components/CardPointCloudRoom.test.ts src/components/stationComposition.test.ts
```

- [ ] **Step 3: Add dedicated point shaders**

The vertex shader must use existing attributes (`aSeed`, `aSize`, `aBrightness`, `aVisibility`, `aDisplace`, `aNormal`) and uniforms for time, point scale, orb position/radius/strength, flicker amount/speed, depth fade, and camera DPR.

It must keep architecture stable while applying only:

- tiny seeded normal instability to a small gated subset;
- subtle localized orb displacement/brightness with distance falloff;
- smooth camera-distance point size and opacity attenuation;
- rare seeded flicker/dropout.

The fragment shader discards outside a circular sprite, uses a narrow soft edge, and applies restrained near-black/cyan/blue/violet/green variation with rare dim magenta noise. No rainbow palette or large fuzzy blobs.

- [ ] **Step 4: Upgrade `CardPointCloudRoom`**

Select quality once per mount (`mobile` below 720px, otherwise `desktop`). Memoize and dispose:

- one merged room/platform geometry or at most two draw calls;
- one ambient orb geometry built from `sampleSphere` at the configured count;
- dedicated shared point materials.

Keep the existing room dimensions and camera. Render floor, ceiling, walls, platform, and orb visibly. Update time/orb uniforms with `useFrame` only; do not mutate attributes or React state per frame.

- [ ] **Step 5: Add scan-only mode without changing scan math**

Add `showBasePattern = true` to `GridScan`. Map it to a uniform scalar and multiply only `lineMask` and its line halo by that scalar. Do not alter `combinedPulse`, `combinedAura`, phase, duration, delay, direction, color, bloom, chromatic aberration, noise, or softness.

Default `true` preserves every existing consumer.

- [ ] **Step 6: Integrate station layers and white scan**

`SecondStation` renders:

```tsx
<CardPointCloudRoom />
<GridScan
  {...existingValues}
  showBasePattern={false}
  scanColor="#ffffff"
  scanColorAlt="#ffffff"
  scanColors={['#ffffff']}
/>
<QuestionCardDeck />
```

Remove `CARD_PALETTE` from this file only. Preserve all other existing GridScan values exactly.

In CSS, layer point canvas at z0, scan overlay at z1, vignette at z2, and card deck at z3. Both backgrounds remain full-bleed and pointer-inert.

- [ ] **Step 7: Verify automated behavior**

```bash
npm test -- src/components/CardPointCloudRoom.test.ts src/components/stationComposition.test.ts
npm test
npm run build
git diff --check
```

- [ ] **Step 8: Verify live and tune only centralized config**

At desktop, mobile portrait, and 844×390, verify:

- actual perspective points reconstruct all required room surfaces, platform, and orb;
- clusters, sparse patches, missing regions, fuzzy boundaries, and tiny irregular sprites are visible;
- no rows, columns, polka dots, pegboard, halftone, Moiré, large black holes, or repeated diagonal patterns remain;
- architecture stays mostly stable with only rare subtle instability;
- scan is white and follows the same sweep/timing/glow;
- chromatic aberration remains visible on the scan overlay;
- no WebGL errors and acceptable interaction/frame responsiveness.

Tune only `SECOND_STATION_POINT_CLOUD_CONFIG` unless a correctness defect requires code changes.

- [ ] **Step 9: Commit**

```bash
git add orb-platform/src/components/CardPointCloudRoom.tsx orb-platform/src/components/CardPointCloudRoom.test.ts orb-platform/src/shaders/cardPointCloudShaders.ts orb-platform/src/components/GridScan.tsx orb-platform/src/components/SecondStation.tsx orb-platform/src/components/SecondStation.css orb-platform/src/components/stationComposition.test.ts
git commit -m "feat: render lidar card-station background"
```

### Task 3: Apply sharp smoked-glass cards

**Files:**
- Modify: `orb-platform/src/components/QuestionCardDeck.css`
- Modify: `orb-platform/src/components/SecondStation.css`
- Modify: `orb-platform/src/components/stationComposition.test.ts`

**Interfaces:**
- Consumes: existing question-card classes and translucent point/scan layers.
- Produces: sharp smoked-glass cards without changing layout or CardSwap.

- [ ] **Step 1: Write failing material test**

Assert station-owned CSS includes zero radius, translucent rgba background, backdrop and WebKit backdrop filters, thin refractive inset edges, and a localized reading veil.

- [ ] **Step 2: Run red**

```bash
npm test -- src/components/stationComposition.test.ts
```

- [ ] **Step 3: Implement glass material**

Preserve every layout/visibility/responsive rule. Set `border-radius: 0`, a dark translucent surface, `backdrop-filter: blur(14px) saturate(125%)`, WebKit equivalent, thin pale border, restrained inset top/left highlight, subtle dark opposing inset, and restrained depth shadow.

Reduce existing card-art gradients to transparent tint layers so the point cloud and white scan are visible through them. Use the pseudo-element for a localized dark text veil and refraction, not an opaque full-card cover.

- [ ] **Step 4: Verify live and automated behavior**

```bash
npm test -- src/components/stationComposition.test.ts src/components/QuestionCardDeck.runtime.test.tsx
npm test
npm run build
git diff --check
git diff --quiet 8e55e5b716c7b7a564134d18183486db4377aab2..HEAD -- src/components/CardSwap.jsx src/components/CardSwap.css
```

At desktop/mobile/844×390 verify sharp edges, visible point reconstruction through cards, readable text under the white scan, exactly three cards, opening hold, full cycle, and unclipped motion.

- [ ] **Step 5: Commit**

```bash
git add orb-platform/src/components/QuestionCardDeck.css orb-platform/src/components/SecondStation.css orb-platform/src/components/stationComposition.test.ts
git commit -m "style: add sharp smoked-glass station cards"
```
