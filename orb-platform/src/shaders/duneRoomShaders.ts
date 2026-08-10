/**
 * Shared unlit "dune" surface shader — used by both the room geometry and
 * the pedestal so the pedestal reads as part of the environment rather than
 * a separately lit object. World-position based glow (two offset soft hot
 * spots, not a single perfect radial) + slow grain-broken sweep + film
 * grain. Desaturated, near-black base with a muted warm lift.
 */
export const duneRoomVertexShader = /* glsl */ `
varying vec3 vWorldPosition;
void main() {
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorldPosition = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

export const duneRoomFragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uHotPointA;
uniform vec3 uHotPointB;
uniform float uHotRadius;
uniform float uGlowStrength;
varying vec3 vWorldPosition;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

// Smoothly interpolated value noise — avoids the hard grid seams a raw
// floor()-based hash produces on large flat surfaces.
float smoothNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float organicNoise(vec3 p) {
  vec2 coord = vec2(p.x * 0.35 + p.z * 0.22, p.y * 0.4);
  float n1 = smoothNoise(coord);
  float n2 = smoothNoise(coord * 2.3 + 11.0);
  return n1 * 0.7 + n2 * 0.3;
}

void main() {
  float dA = length(vWorldPosition - uHotPointA) / uHotRadius;
  float dB = length(vWorldPosition - uHotPointB) / (uHotRadius * 0.72);

  // Values below are in "intended on-screen" terms; converted to linear
  // at the end so the renderer's sRGB output pass lands on these tones.
  // Desaturated toward neutral grey — a hint of warmth, not an orange wash.
  vec3 base = vec3(0.042, 0.038, 0.034);
  vec3 lift = vec3(0.171, 0.1385, 0.109);

  float glowA = smoothstep(1.0, 0.0, dA);
  float glowB = smoothstep(1.0, 0.0, dB) * 0.55;
  float glow = clamp(glowA + glowB, 0.0, 1.0) * uGlowStrength;
  // Break the glow's edge up with slow, soft noise so it doesn't read as a
  // clean CG radial — more like heat-haze / dust settling unevenly.
  float uneven = 0.78 + 0.22 * organicNoise(vWorldPosition + vec3(uTime * 0.015, 0.0, 0.0));
  vec3 col = mix(base, lift, glow * 0.68 * uneven);

  // Sweeping light — faint, slow, grain-broken travelling sheet.
  float sweepCoord = vWorldPosition.x * 0.55 + vWorldPosition.y * 0.85;
  float phase = mod(uTime * 0.06, 26.0) - 13.0;
  float band = exp(-pow((sweepCoord - phase) / 2.6, 2.0));
  band *= 0.6 + 0.4 * organicNoise(vWorldPosition * 1.8 + vec3(uTime * 0.05, 0.0, 0.0));
  col += vec3(0.045, 0.036, 0.028) * band * 0.55 * uGlowStrength;

  float grain = hash(gl_FragCoord.xy + fract(uTime) * 131.0) - 0.5;
  col += grain * 0.028;
  col = max(col, 0.0);

  col = pow(col, vec3(2.2));

  gl_FragColor = vec4(col, 1.0);
}
`
