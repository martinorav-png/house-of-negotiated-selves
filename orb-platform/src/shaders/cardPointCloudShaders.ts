export const cardPointCloudVertexShader = /* glsl */ `
uniform float uTime;
uniform float uPointScale;
uniform float uPixelRatio;
uniform vec3 uOrbPosition;
uniform float uOrbInfluenceRadius;
uniform float uOrbInfluenceStrength;
uniform float uFlickerAmount;
uniform float uFlickerSpeed;
uniform float uDepthFade;
uniform float uIsOrb;

attribute float aSeed;
attribute float aSize;
attribute float aBrightness;
attribute float aVisibility;
attribute float aDisplace;
attribute vec3 aNormal;

varying float vAlpha;
varying float vBrightness;
varying float vSeed;
varying float vOrbInfluence;
varying float vDepth;

float hash11(float value) {
  return fract(sin(value * 127.1) * 43758.5453123);
}

void main() {
  vSeed = aSeed;
  vec3 pos = position;
  float worldDistanceToOrb = distance(pos, uOrbPosition);
  float orbInfluence = 1.0 - smoothstep(0.0, uOrbInfluenceRadius, worldDistanceToOrb);
  vOrbInfluence = orbInfluence;

  float unstablePoint = step(1.0 - uFlickerAmount, hash11(aSeed * 91.7));
  float temporalNoise = sin(uTime * (0.32 + aSeed * uFlickerSpeed) + aSeed * 73.0);
  pos += aNormal * temporalNoise * aDisplace * unstablePoint * 0.28;
  pos += aNormal * orbInfluence * uOrbInfluenceStrength * (0.006 + temporalNoise * 0.004);

  if (uIsOrb > 0.5) {
    float breath = sin(uTime * 0.72 + aSeed * 8.0) * 0.006;
    pos += normalize(pos + vec3(0.0001)) * breath;
  }

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  float cameraDistance = max(0.1, -mvPosition.z);
  float perspectiveSize = 10.0 / cameraDistance;
  gl_PointSize = clamp(aSize * uPointScale * uPixelRatio * perspectiveSize, 0.7, 3.2);

  float depthAttenuation = mix(1.0, smoothstep(20.0, 3.0, cameraDistance), uDepthFade);
  float flickerPhase = hash11(floor(uTime * uFlickerSpeed * 7.0) + aSeed * 211.0);
  float flicker = mix(1.0, step(0.22, flickerPhase), unstablePoint);
  vBrightness = aBrightness * (0.72 + orbInfluence * 0.38 + uIsOrb * 0.32);
  vAlpha = aVisibility * depthAttenuation * flicker;
  vDepth = clamp(cameraDistance / 20.0, 0.0, 1.0);

  gl_Position = projectionMatrix * mvPosition;
}
`

export const cardPointCloudFragmentShader = /* glsl */ `
varying float vAlpha;
varying float vBrightness;
varying float vSeed;
varying float vOrbInfluence;
varying float vDepth;

void main() {
  vec2 point = gl_PointCoord - vec2(0.5);
  float radius = length(point);
  if (radius > 0.5) discard;
  float edge = smoothstep(0.5, 0.39, radius);

  vec3 nearBlack = vec3(0.018, 0.026, 0.024);
  vec3 mutedCyan = vec3(0.18, 0.33, 0.36);
  vec3 mutedViolet = vec3(0.24, 0.19, 0.32);
  vec3 dimGreen = vec3(0.23, 0.34, 0.27);
  vec3 rareMagenta = vec3(0.38, 0.13, 0.29);

  float tone = fract(vSeed * 17.31);
  vec3 color = mix(nearBlack, mutedCyan, smoothstep(0.08, 0.72, tone) * 0.72);
  color = mix(color, mutedViolet, smoothstep(0.78, 0.96, tone) * 0.46);
  color = mix(color, dimGreen, smoothstep(0.32, 0.5, fract(vSeed * 8.7)) * 0.22);
  color = mix(color, rareMagenta, step(0.982, fract(vSeed * 41.9)) * 0.22);
  color = mix(color, vec3(0.78, 0.9, 0.88), vOrbInfluence * 0.28);
  color *= vBrightness * mix(1.0, 0.68, vDepth);

  float alpha = edge * vAlpha;
  if (alpha < 0.018) discard;
  gl_FragColor = vec4(color, alpha);
}
`
