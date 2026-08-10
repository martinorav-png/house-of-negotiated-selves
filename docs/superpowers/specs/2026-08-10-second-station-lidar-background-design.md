# Second Station LiDAR Background and Glass Cards Design

## Authority

This design adapts the user's full stochastic point-cloud prompt to the actual second-station architecture. It supersedes the earlier procedural dot-mask direction.

## Goal

Render the second station as a dark room reconstructed from real `THREE.Points`: seeded stochastic samples across the floor, ceiling, walls, platform, and orb. Surfaces must dissolve into irregular LiDAR-like spatial data with dense clusters, missing regions, noisy thickness, and no visible rows, columns, UV lattice, polka-dot spacing, halftone pattern, or repeated tessellation.

Cards retain the exact React Bits behavior and receive the approved sharp smoked-glass material.

## Layered Architecture

The station uses three independent visual layers:

1. `CardPointCloudRoom` renders the reusable 3D point-cloud room, platform, and ambient orb in one React Three Fiber canvas.
2. The existing `GridScan` remains above it in scan-only mode. Its base grid is disabled, but its scan sweep, timing, direction, glow, bloom, noise, and chromatic aberration code remain unchanged. All scan colors are fixed to white.
3. The question deck remains above both backgrounds with its exact CardSwap source, seven-question cycle, three-visible-card controller, opening hold, and unclipped motion.

This separates true point geometry from the already-approved scan effect and avoids approximating 3D reconstruction with a full-screen fragment pattern.

## Stochastic Surface Sampling

Create a deterministic seeded sampler for planar and platform surfaces. Each candidate point is generated in continuous surface coordinates rather than from mesh vertices or a UV lattice.

Acceptance combines:

- broad multi-frequency density noise;
- probabilistic keep/discard decisions;
- randomly positioned micro-cluster centers with varied radii and strengths;
- a mixture of uniform points, cluster-biased points, and isolated outliers;
- irregular noise-based dropout regions with soft boundaries;
- mostly normal-direction Gaussian jitter plus smaller tangent jitter;
- extra noisy density and overlap near surface intersections and platform edges;
- deterministic point size, brightness, visibility, displacement, and color seeds.

The output is stable across React renders and stored in typed buffer attributes. Geometry is generated with `useMemo`; animation remains GPU-side.

## Configuration

Expose `SECOND_STATION_POINT_CLOUD_CONFIG` in one easy-to-edit module. It contains desktop and mobile point budgets plus density, cluster, dropout, jitter, thickness, flicker, depth, orb influence, scan-layer, and point-size parameters.

Initial budgets:

- desktop: approximately 150,000 room/platform points plus the ambient orb;
- mobile: approximately 60,000 room/platform points plus a reduced orb;
- point sprites: approximately 1–3 device pixels with bounded seeded variation.

Values may be tuned during visual verification, but configuration remains centralized.

## Geometry and Composition

Reuse existing `ROOM`, `PLATFORM`, and `ORB` dimensions and camera framing. The final background must clearly reveal:

- floor;
- ceiling;
- left and right walls;
- back wall;
- platform;
- ambient orb;
- room depth.

Room architecture stays mostly stable. Corners remain legible but fuzzy through denser overlapping samples and increased edge jitter.

## GPU Rendering

Use a small number of `THREE.Points` objects with custom `ShaderMaterial` instances.

Vertex responsibilities:

- perspective-aware point size;
- smooth distance attenuation;
- tiny seeded temporal instability for a small subset;
- subtle depth opacity;
- localized orb brightness/displacement falloff;
- rare flicker/dropout without moving the whole room.

Fragment responsibilities:

- circular point sprites using `gl_PointCoord`;
- narrow anti-aliased edges;
- subtle seeded dark cyan/blue/violet/green variation with rare restrained magenta noise;
- stable dark overall exposure.

No per-frame JavaScript position updates or React state changes are allowed.

## White Scan Overlay

Add an explicit scan-only/base-pattern-disabled mode to `GridScan`. In this mode its line masks and line halo contribute zero, while its existing scan pulse/aura and post-processing remain active.

`SecondStation` sets:

- `scanColor="#ffffff"`;
- `scanColorAlt="#ffffff"`;
- `scanColors={['#ffffff']}`;
- scan-only mode enabled;
- every existing timing, opacity, bloom, chromatic aberration, noise, and softness value unchanged.

The card slide animation is unrelated and remains unchanged.

## Glass Cards

Cards use square corners, translucent smoked surfaces, restrained blur/saturation, thin refractive edges, subtle tinted card art, and a localized reading veil. The moving point reconstruction and white scan remain visible through the material without compromising question readability.

All overrides remain station-owned; generated React Bits files remain untouched.

## Performance

- Desktop/mobile budgets are selected once from viewport capability and remain stable.
- Typed arrays and buffer geometry are memoized.
- A small number of draw calls is preferred.
- Shader uniforms update per frame; buffer attributes do not.
- All geometries and materials dispose on unmount.
- Device pixel ratio and point size remain bounded.

## Verification

Automated tests cover deterministic sampling, density variance, micro-clusters, dropout, volumetric thickness, point-size range, mobile/desktop budgets, buffer attributes, scan-only masking, fixed white scan colors, unchanged scan/post values, exact CardSwap integrity, and existing card behavior.

Browser verification covers desktop, mobile portrait, and 844×390 landscape. It must show true irregular clusters and gaps with no rows, columns, polka dots, halftone, pegboard appearance, square sprites, large holes, or obvious repetition. It also verifies room/platform/orb legibility, white scan, chromatic aberration, stable architecture, subtle localized instability, glass readability, exact-three cards, opening hold, and unclipped card motion.

## Scope

This work changes the second-station background and card material only. It reuses existing scene dimensions and does not change questions, CardSwap source, card timing, station navigation, or other stations.
