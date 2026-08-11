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
uniform float uDissolveY;
uniform float uDissolveSoft;
uniform float uDissolveFill;
uniform float uPointScale;
uniform float uPeelStrength;
uniform float uPointScaleBoost;
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

  float soft = max(uDissolveSoft, 0.05);
  float dissolved = smoothstep(uDissolveY - soft, uDissolveY + soft, pos.y);
  if (dissolved < 0.01) {
    gl_PointSize = 0.0;
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0;
    vBright = 0.0;
    vWave = 0.0;
    return;
  }

  // Low-frequency organic displacement
  float motion = mix(1.0, 0.2, uReducedMotion);
  float n = sin(uTime * (0.7 + aSeed) + aSeed * 40.0) * cos(uTime * 0.35 + pos.y * 1.5);
  pos += aNormal * aDisplace * n * 0.55 * motion;

  // Peel dissolved wall points off the surface into free particles.
  float peel = dissolved * uDissolveFill * uPeelStrength;
  float drift = sin(uTime * (0.45 + aSeed * 0.7) + aSeed * 28.0);
  pos += aNormal * peel * (0.55 + aDisplace * 18.0) * (0.65 + drift * 0.35) * motion;
  pos.y += dissolved * uDissolveFill * aDisplace * 4.0 * drift * motion;

  // Activation wave — a horizontal sheet rising from floor into ceiling.
  float dist = distance(pos, uOrbPosition);
  float wave = 0.0;
  if (uShockwave > 0.08) {
    wave = 1.0 - smoothstep(0.0, 1.08, abs(pos.y - uShockwave));
    wave = pow(wave, 0.9);
  }
  vWave = wave;
  pos += aNormal * wave * max(uActivation, 0.35) * 0.1 * motion;

  // Hover: ripple lift nearby points. Heartbeat pulse intentionally does NOT
  // drive this — the orb pulses on its own; the room around it stays still.
  float near = 1.0 - smoothstep(0.5, 5.5, dist);
  float rippleAmt = uHover;
  float hoverRipple = sin(dist * 3.2 - uTime * 3.1) * 0.5 + 0.5;
  pos += aNormal * near * rippleAmt * (0.035 + hoverRipple * 0.045) * motion;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // Distance-based point size
  float distScale = 120.0 / max(0.1, -mvPosition.z);
  float sizeBoost = 1.0 + rippleAmt * 0.18 * near + wave * 0.36;
  sizeBoost *= 1.0 + dissolved * uDissolveFill * uPointScaleBoost;
  gl_PointSize = aSize * uPointScale * distScale * sizeBoost;
  gl_PointSize = clamp(gl_PointSize, 0.55, 8.5);

  // Depth fade toward camera / open front (positive Z in room)
  float depthFade = smoothstep(5.2, 1.2, pos.z);
  float edgeFade = aVisibility;

  // Orb illumination (Lambert-ish)
  vec3 toOrb = normalize(uOrbPosition - pos);
  float ndotl = max(dot(normalize(aNormal), toOrb), 0.0);
  float atten = 1.0 / (1.0 + dist * dist * 0.045);
  float light = (0.18 + ndotl * 0.9 * atten * uOrbIntensity) ;

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

  // Rising wave brightness — visible even late in the activation pulse
  float waveAmp = max(uActivation, 0.55);
  light += wave * waveAmp * 1.75;
  light += near * rippleAmt * (0.3 + hoverRipple * 0.4);
  light += dissolved * uDissolveFill * 0.35;

  vBright = aBrightness * light;
  vAlpha = edgeFade * mix(0.6, 1.0, depthFade) * clamp(0.78 + light * 0.32, 0.0, 1.0);
  vAlpha *= dissolved * mix(0.55, 1.0, uDissolveFill);

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
  // Crisp point edge with a narrow antialias feather.
  float soft = smoothstep(0.5, 0.42, r);

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

void main() {
  vSeed = aSeed;
  vec3 pos = position;
  float motion = mix(1.0, 0.2, uReducedMotion);
  float len0 = length(pos);
  vec3 dir = len0 > 0.0001 ? pos / len0 : aNormal;

  // Gentle procedural displacement + a few drift-away points (high aDisplace)
  float rippleDrive = max(uHover, uPulse);
  float drift = sin(uTime * (0.38 + aSeed * 0.45) + aSeed * 30.0);
  float radial = aDisplace * drift * (1.0 + rippleDrive * 1.55) * motion;
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
  float beatRing = sin(len0 * 16.0 - uPulse * 9.0 - uTime * 1.6 + aSeed * 4.0);
  pos += dir * uPulse * beatRing * 0.07 * motion;
  float hoverBand = sin(len0 * 14.0 - uTime * 6.5 + aSeed * 6.0);
  pos += dir * uHover * hoverBand * 0.03 * motion;

  // Activation push outward then lag (activation envelope from JS)
  float push = uActivation * (0.18 + aSeed * 0.1) * motion;
  float lag = sin(aSeed * 40.0 + uTime * 2.0) * uActivation * 0.05;
  // Secondary activation ripple across the shell
  float actRipple = sin(len0 * 18.0 - uTime * 9.0) * uActivation * 0.06 * motion;
  pos += dir * (push + lag + actRipple);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  float distScale = 140.0 / max(0.1, -mvPosition.z);
  float sizeBoost = 1.0 + uHover * 0.22 + uPulse * 0.28 + uActivation * 0.42 + uAudio * 0.2;
  gl_PointSize = aSize * uPointScale * distScale * sizeBoost;
  gl_PointSize = clamp(gl_PointSize, 0.55, 7.5);

  vBright = aBrightness * uIntensity * 1.65;
  vBright += uAudio * 0.35 + uPulse * 0.5;
  vAlpha = aVisibility * clamp(0.95 + uIntensity * 0.15 + uPulse * 0.08, 0.0, 1.0);

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

void main() {
  vec2 c = gl_PointCoord - vec2(0.5);
  float r = length(c);
  if (r > 0.5) discard;
  float soft = smoothstep(0.5, 0.4, r);

  // Biased toward the white core — sage/rim only show at the shell's edges.
  float tone = fract(vSeed * 7.13);
  vec3 col = mix(uColorCore, uColorMid, pow(tone, 1.8));
  col = mix(col, uColorRim, pow(tone, 2.4) * 0.3);
  col *= vBright * (1.0 + uHover * 0.06 + uPulse * 0.08 + uActivation * 0.1);

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
  gl_FragColor = vec4(vColor, soft * vAlpha);
}
`
