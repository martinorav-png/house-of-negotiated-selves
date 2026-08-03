/**
 * Environment / room / platform point-cloud shader.
 * Illumination is simulated from orb uniforms (not MeshStandard lights).
 */
export const envPointVertexShader = /* glsl */ `
uniform float uTime;
uniform float uHover;
uniform float uPulse;
uniform float uActivation;
uniform float uShockwave;
uniform vec3 uOrbPosition;
uniform float uOrbIntensity;
uniform float uReducedMotion;
uniform float uScanY;
uniform float uPointScale;
uniform vec3 uScreenPosition;
uniform vec3 uScreenColor;
uniform float uScreenIntensity;
uniform vec2 uScreenHalfSize;

attribute float aSeed;
attribute float aSize;
attribute float aBrightness;
attribute float aVisibility;
attribute float aDisplace;
attribute vec3 aNormal;

varying float vAlpha;
varying float vBright;
varying float vSeed;
varying float vWave;
varying float vScreenMix;

void main() {
  vSeed = aSeed;
  vScreenMix = 0.0;
  vec3 pos = position;

  // Low-frequency scan flicker displacement
  float motion = mix(1.0, 0.2, uReducedMotion);
  float n = sin(uTime * (0.7 + aSeed) + aSeed * 40.0) * cos(uTime * 0.35 + pos.y * 1.5);
  pos += aNormal * aDisplace * n * 0.55 * motion;

  // Activation shockwave — wider, clearer ring through the room
  float dist = distance(pos, uOrbPosition);
  float wave = 0.0;
  if (uShockwave > 0.08) {
    wave = 1.0 - smoothstep(0.0, 2.6, abs(dist - uShockwave));
    wave = pow(wave, 0.65);
  }
  vWave = wave;
  pos += aNormal * wave * max(uActivation, 0.35) * 0.22 * motion;

  // Heartbeat + hover: ripple lift nearby points
  float near = 1.0 - smoothstep(0.5, 5.5, dist);
  float rippleAmt = max(uHover, uPulse * 0.85);
  float hoverRipple = sin(dist * 3.2 - uTime * 4.5) * 0.5 + 0.5;
  // Expanding ring timed to the pulse peak
  float pulseRing = 1.0 - smoothstep(0.0, 1.4, abs(dist - uPulse * 3.2));
  pos += aNormal * near * rippleAmt * (0.035 + hoverRipple * 0.045) * motion;
  pos += aNormal * pulseRing * uPulse * 0.06 * motion;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // Distance-based point size
  float distScale = 120.0 / max(0.1, -mvPosition.z);
  float sizeBoost = 1.0 + rippleAmt * 0.18 * near + wave * 0.85 + uPulse * pulseRing * 0.35;
  gl_PointSize = aSize * uPointScale * distScale * sizeBoost;
  gl_PointSize = clamp(gl_PointSize, 1.0, 22.0);

  // Depth fade toward camera / open front (positive Z in room)
  float depthFade = smoothstep(5.2, 1.2, pos.z);
  float edgeFade = aVisibility;

  // Orb illumination (Lambert-ish)
  vec3 toOrb = normalize(uOrbPosition - pos);
  float ndotl = max(dot(normalize(aNormal), toOrb), 0.0);
  float atten = 1.0 / (1.0 + dist * dist * 0.045);
  float light = (0.12 + ndotl * 0.9 * atten * uOrbIntensity) ;

  // CRT screen rect light — spills cyan glow into nearby room points
  vec3 toScreen = uScreenPosition - pos;
  float sDist = length(toScreen);
  vec3 sDir = toScreen / max(sDist, 0.001);
  // Screen faces +Z into the room
  float screenFacing = max(dot(normalize(aNormal), vec3(0.0, 0.0, 1.0)), 0.0);
  float receive = max(dot(sDir, vec3(0.0, 0.0, 1.0)), 0.0);
  // Soft rect falloff in XY relative to screen center
  vec2 local = pos.xy - uScreenPosition.xy;
  vec2 q = abs(local) / max(uScreenHalfSize, vec2(0.001));
  float inRect = 1.0 - smoothstep(1.0, 1.85, max(q.x, q.y));
  float sAtten = 1.0 / (1.0 + sDist * sDist * 0.035);
  float screenLight = inRect * receive * sAtten * uScreenIntensity * (0.45 + screenFacing * 0.55);
  // Prefer lighting surfaces in front of the screen (toward camera / room)
  screenLight *= smoothstep(-4.6, -2.5, pos.z);
  light += screenLight * 1.65;
  vScreenMix = clamp(screenLight * 0.85, 0.0, 1.0);

  // Scan band across room height — thicker travelling sheet
  float scan = 1.0 - smoothstep(0.0, 0.42, abs(pos.y - uScanY));
  scan = pow(scan, 0.7);
  light += scan * 1.15;

  // Shockwave brightness — visible even late in the pulse
  float waveAmp = max(uActivation, 0.55);
  light += wave * waveAmp * 2.8;
  light += near * rippleAmt * (0.3 + hoverRipple * 0.4);
  light += pulseRing * uPulse * 0.55;

  // Flicker
  float flicker = 0.92 + 0.08 * sin(uTime * (3.0 + aSeed * 5.0) + aSeed * 20.0);
  light *= mix(flicker, 1.0, uReducedMotion);

  vBright = aBrightness * light;
  vAlpha = edgeFade * depthFade * clamp(0.25 + light * 0.55, 0.0, 1.0);

  gl_Position = projectionMatrix * mvPosition;
}
`

export const envPointFragmentShader = /* glsl */ `
uniform vec3 uEnvColor;
uniform vec3 uOrbColor;
uniform vec3 uScreenColor;
uniform float uActivation;

varying float vAlpha;
varying float vBright;
varying float vSeed;
varying float vWave;
varying float vScreenMix;

void main() {
  vec2 c = gl_PointCoord - vec2(0.5);
  float r = length(c);
  if (r > 0.5) discard;
  // Mild soft edge — enough for bloom to catch, not a heavy glow disc
  float soft = smoothstep(0.5, 0.22, r);

  vec3 col = mix(uEnvColor, uOrbColor, clamp(vBright * 0.22 + uActivation * 0.08 + vWave * 0.45, 0.0, 0.75));
  col = mix(col, uScreenColor, vScreenMix * 0.65);
  col *= vBright;

  float alpha = soft * vAlpha;
  if (alpha < 0.02) discard;
  gl_FragColor = vec4(col, alpha);
}
`

/**
 * Orb point-cloud shader — denser, brighter scan volume.
 */
export const orbPointVertexShader = /* glsl */ `
uniform float uTime;
uniform float uIntensity;
uniform float uHover;
uniform float uPulse;
uniform float uActivation;
uniform float uReducedMotion;
uniform float uPointScale;
uniform float uRadius;
uniform float uAudio;
uniform float uAudioBass;
uniform float uAudioMid;

attribute float aSeed;
attribute float aSize;
attribute float aBrightness;
attribute float aVisibility;
attribute float aDisplace;
attribute vec3 aNormal;

varying float vAlpha;
varying float vBright;
varying float vSeed;
varying float vScan;

void main() {
  vSeed = aSeed;
  vec3 pos = position;
  float motion = mix(1.0, 0.2, uReducedMotion);
  float len0 = length(pos);
  vec3 dir = len0 > 0.0001 ? pos / len0 : aNormal;

  // Gentle procedural displacement + a few drift-away points (high aDisplace)
  float rippleDrive = max(uHover, uPulse);
  float drift = sin(uTime * (0.6 + aSeed * 0.8) + aSeed * 30.0);
  float radial = aDisplace * drift * (1.0 + rippleDrive * 1.2) * motion;
  // Halo points (farther) drift more
  float halo = smoothstep(uRadius * 0.95, uRadius * 1.35, len0);
  pos += dir * radial * (1.0 + halo * 2.5);

  // Voice / sound — bass expands shell, mids agitate surface
  float audioPulse = uAudioBass * (0.7 + aSeed * 0.6) + uAudioMid * sin(uTime * 18.0 + aSeed * 50.0) * 0.5;
  pos += dir * audioPulse * aDisplace * 14.0 * motion;
  pos += dir * uAudio * 0.05 * (0.5 + halo) * motion;

  // Heartbeat expand + radial ripple (always on; hover strengthens)
  pos += dir * rippleDrive * 0.035 * (0.4 + halo) * motion;
  // Travelling shell ring synced to pulse envelope
  float beatRing = sin(len0 * 16.0 - uPulse * 9.0 - uTime * 2.2 + aSeed * 4.0);
  pos += dir * uPulse * beatRing * 0.055 * motion;
  float hoverBand = sin(len0 * 14.0 - uTime * 6.5 + aSeed * 6.0);
  pos += dir * uHover * hoverBand * 0.03 * motion;

  // Activation push outward then lag (activation envelope from JS)
  float push = uActivation * (0.18 + aSeed * 0.1) * motion;
  float lag = sin(aSeed * 40.0 + uTime * 2.0) * uActivation * 0.05;
  // Secondary activation ripple across the shell
  float actRipple = sin(len0 * 18.0 - uTime * 9.0) * uActivation * 0.06 * motion;
  pos += dir * (push + lag + actRipple);

  // Dual circular scan slices travelling through the orb
  float scanLocal = fract(uTime * 0.22);
  float bandY = mix(-uRadius, uRadius, scanLocal);
  float bandY2 = mix(-uRadius, uRadius, fract(scanLocal + 0.5));
  float scan1 = 1.0 - smoothstep(0.0, 0.16, abs(pos.y - bandY));
  float scan2 = 1.0 - smoothstep(0.0, 0.12, abs(pos.y - bandY2));
  vScan = max(pow(scan1, 0.55), pow(scan2, 0.7) * 0.75);
  // Radial ripple ring for extra prevalence
  float radialScan = 1.0 - smoothstep(0.0, 0.12, abs(len0 - mix(0.15, uRadius * 1.15, fract(uTime * 0.35))));
  vScan = max(vScan, pow(radialScan, 0.6) * 0.85);
  // Audio-driven scan emphasis
  vScan = max(vScan, uAudio * 0.35 * (0.5 + 0.5 * sin(len0 * 20.0 - uTime * 12.0)));

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  float distScale = 140.0 / max(0.1, -mvPosition.z);
  float sizeBoost = 1.0 + uHover * 0.3 + uPulse * 0.4 + uActivation * 0.55 + vScan * 1.1 + uAudio * 0.25;
  gl_PointSize = aSize * uPointScale * distScale * sizeBoost;
  gl_PointSize = clamp(gl_PointSize, 1.2, 26.0);

  float flicker = 0.94 + 0.06 * sin(uTime * (4.0 + aSeed * 6.0));
  // Dimmer orb — additive points stack fast; keep readable without flare
  vBright = aBrightness * uIntensity * 0.2 * mix(flicker, 1.0, uReducedMotion);
  vBright += vScan * 0.18 + uAudio * 0.08 + uPulse * 0.1;
  vAlpha = aVisibility * (0.32 + uIntensity * 0.1 + vScan * 0.12 + uPulse * 0.06);

  gl_Position = projectionMatrix * mvPosition;
}
`

export const orbPointFragmentShader = /* glsl */ `
uniform vec3 uColorCore;
uniform vec3 uColorMid;
uniform vec3 uColorRim;
uniform float uHover;
uniform float uPulse;
uniform float uActivation;

varying float vAlpha;
varying float vBright;
varying float vSeed;
varying float vScan;

void main() {
  vec2 c = gl_PointCoord - vec2(0.5);
  float r = length(c);
  if (r > 0.5) discard;
  float soft = smoothstep(0.5, 0.2, r);

  float tone = fract(vSeed * 7.13);
  vec3 col = mix(uColorCore, uColorMid, tone);
  col = mix(col, uColorRim, tone * 0.35 + vScan * 0.75);
  col *= vBright * (1.0 + uHover * 0.06 + uPulse * 0.08 + uActivation * 0.1 + vScan * 0.15);

  float alpha = soft * vAlpha;
  if (alpha < 0.025) discard;
  gl_FragColor = vec4(col, alpha);
}
`

/** Soft sprite particles matching orb scan language */
export const particlePointVertexShader = /* glsl */ `
attribute float aSize;
attribute float aAlpha;
attribute vec3 aColor;

uniform float uPointScale;

varying float vAlpha;
varying vec3 vColor;

void main() {
  vAlpha = aAlpha;
  vColor = aColor;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  float distScale = 160.0 / max(0.1, -mvPosition.z);
  gl_PointSize = aSize * uPointScale * distScale;
  gl_PointSize = clamp(gl_PointSize, 1.0, 28.0);
  gl_Position = projectionMatrix * mvPosition;
}
`

export const particlePointFragmentShader = /* glsl */ `
varying float vAlpha;
varying vec3 vColor;

void main() {
  vec2 c = gl_PointCoord - vec2(0.5);
  float r = length(c);
  if (r > 0.5) discard;
  float soft = smoothstep(0.5, 0.18, r);
  float flicker = 0.85 + 0.15 * sin(gl_FragCoord.x * 0.17 + gl_FragCoord.y * 0.11);
  gl_FragColor = vec4(vColor * flicker, soft * vAlpha);
}
`
