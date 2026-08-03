/**
 * CRT panel shader — scanlines, mild barrel, RGB chromatic aberration, flicker.
 */
export const crtVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const crtFragmentShader = /* glsl */ `
uniform sampler2D uMap;
uniform float uTime;
uniform float uGlow;
uniform float uAberration;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec2 centered = uv - 0.5;
  float r2 = dot(centered, centered);

  // Mild CRT barrel warp
  uv = 0.5 + centered * (1.0 + r2 * 0.07);

  // Outside warped screen → dark bezel falloff
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.01, 0.015, 0.02, 1.0);
    return;
  }

  // Mild chromatic aberration (RGB channel split)
  float ca = uAberration * (1.0 + r2 * 1.2);
  float cr = texture2D(uMap, uv + vec2(ca, ca * 0.25)).r;
  float cg = texture2D(uMap, uv).g;
  float cb = texture2D(uMap, uv - vec2(ca, ca * 0.2)).b;
  vec3 col = vec3(cr, cg, cb);

  // Horizontal scanlines
  float scan = sin(uv.y * 980.0) * 0.5 + 0.5;
  col *= 0.78 + scan * 0.28;

  // Coarse RGB triad mask
  float mask = sin(uv.x * 1400.0) * 0.04;
  col.r += mask;
  col.b -= mask * 0.5;

  // Rolling refresh bar
  float roll = fract(uTime * 0.08);
  float band = 1.0 - smoothstep(0.0, 0.04, abs(uv.y - roll));
  col += vec3(0.08, 0.14, 0.18) * band;

  // Phosphor / emissive lift for bloom + room spill
  col *= 1.05 + uGlow * 0.35;
  col += col * col * (0.12 + uGlow * 0.18);

  // Edge vignette
  float vig = smoothstep(0.85, 0.15, r2);
  col *= vig;

  // Micro flicker
  col *= 0.96 + 0.04 * sin(uTime * 27.0);

  gl_FragColor = vec4(col, 1.0);
}
`

/**
 * Soft additive screen halo — spills light visually into the room.
 */
export const screenGlowVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const screenGlowFragmentShader = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv;

void main() {
  vec2 c = vUv - 0.5;
  float d = length(c) * 2.0;
  float a = smoothstep(1.0, 0.15, d) * uOpacity;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uColor * a, a);
}
`
