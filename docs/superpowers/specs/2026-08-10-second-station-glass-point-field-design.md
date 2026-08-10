# Second Station Glass Cards and Point Field Design

## Goal

Refine the second station's visual material without changing its interaction model. Question cards become sharp-edged smoked glass, and the `GridScan` background replaces continuous grid lines with a true field of circular points.

The exact React Bits card animation, three-visible-card cap, seven-question cycle, 4200ms opening hold, scan sweep, scan timing, color cycling, bloom, chromatic aberration, and station navigation remain unchanged.

## Card Material

The cards use an architectural smoked-glass treatment:

- square corners with no radius;
- a dark translucent surface that reveals the scan field behind it;
- restrained backdrop blur and saturation;
- a thin pale edge with a slightly brighter top/left refraction line;
- existing sage and muted-gold card art reduced to transparent internal tinting;
- a localized dark veil behind the question for legibility;
- subtle inset light and restrained depth shadow, with no glossy plastic highlight or rounded UI styling.

The generated `CardSwap.jsx` and `CardSwap.css` files remain unmodified. All material overrides live in the station-owned `QuestionCardDeck.css`.

## Point-Field Background

`GridScan` keeps its current ray-plane projection, perspective response, jitter input, scan band calculation, scan colors, glow, bloom, chromatic aberration, and animation loop.

Only the base grid visibility mask changes for the second station. Instead of combining horizontal and vertical line masks, the shader computes an anti-aliased circular point inside each projected grid cell. A secondary plane uses the same point calculation, preserving the existing spatial volume.

The point field should read as a clustered scan volume rather than dotted graph paper:

- isolated round points, never connected dashes;
- slight deterministic variation in point size or intensity between cells;
- existing positional jitter applied to the field so motion continuity is retained;
- bounded point density and anti-aliasing for stable performance and reduced shimmer;
- dark resting points that brighten under the unchanged traveling scan.

## Component Interface

Add a `patternStyle` option to `GridScan` with at least:

- `grid` — current line behavior for existing consumers;
- `points` — circular point-field behavior for the second station.

Existing `lineStyle` behavior remains available within the grid mode for backward compatibility. `SecondStation` opts into `patternStyle="points"`. No other station changes its background.

## Shader Data Flow

1. Continue projecting the camera ray onto the existing spatial planes.
2. Continue applying the current skew, yaw, tilt, and jitter to projected coordinates.
3. In `grid` mode, evaluate the existing line/dash/dot-line mask unchanged.
4. In `points` mode, evaluate distance from the local cell center and convert it to an anti-aliased circular mask using derivatives.
5. Apply deterministic per-cell variation to point radius or intensity within a narrow range.
6. Feed the selected base mask into the existing fade, scan pulse, scan aura, color, alpha, bloom, and post-processing pipeline.

The scan pulse is not reimplemented or retimed.

## Responsive and Accessibility Behavior

Glass opacity must keep every question readable at desktop and short landscape sizes. The existing unclipped viewport and complete-footprint responsive sizing remain unchanged.

Reduced-motion behavior remains the stable three-card composition. The point field may retain its existing background scan behavior because this change introduces no new motion system.

## Performance and Failure Handling

- Point rendering stays inside the existing fragment shader; no DOM particles or additional Three.js objects are created.
- Point variation uses deterministic shader math without textures or per-frame allocations.
- Derivative-based anti-aliasing prevents hard pixel shimmer.
- `patternStyle` defaults to `grid`, so unknown or omitted values preserve current behavior.
- Shader compilation or post-processing setup is not otherwise changed.

## Verification

Automated checks will confirm:

- `GridScan` defaults to the existing grid mode;
- point mode is represented by a dedicated uniform and circular cell-distance mask;
- `SecondStation` opts into point mode while retaining all existing scan and post-processing props;
- generated React Bits files remain unchanged;
- glass cards use zero radius, translucent station-owned surfaces, backdrop filtering, and legibility treatment;
- existing card depth, opening-hold, reduced-motion, and composition tests continue to pass.

Browser verification will confirm:

- the resting background shows isolated dots rather than continuous or dotted grid lines;
- the traveling scan follows the same direction, timing, glow, color cycling, and slide behavior;
- chromatic aberration and bloom remain visible;
- cards read as sharp smoked glass and reveal the moving point field beneath them;
- question text remains readable;
- exactly three animated cards remain visible;
- desktop, mobile portrait, and 844x390 landscape layouts remain unclipped;
- no runtime errors or material flicker occur.

## Scope

This change is limited to the second station's card material and the reusable `GridScan` pattern selector. It does not change question content, CardSwap source, card timing, scan timing, scan direction, scan colors, post-processing values, other stations, or navigation.
