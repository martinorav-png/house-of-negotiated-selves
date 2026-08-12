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
uniform vec3 uRippleCenter;
uniform float uRippleDuration;
uniform float uRippleRadius;
uniform float uRippleWidth;
uniform float uRippleDisplacement;
uniform float uRippleBrightness;

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
varying float vRipple;

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

  float rippleDistance = distance(pos, uRippleCenter);
  float rippleCycle = mod(uTime, uRippleDuration * 2.0);
  float rippleDirection = rippleCycle < uRippleDuration ? 1.0 : -1.0;
  float rippleLinear = rippleCycle < uRippleDuration
    ? rippleCycle / uRippleDuration
    : 1.0 - ((rippleCycle - uRippleDuration) / uRippleDuration);
  // Ease-in-out-back — same bounce language as the scan sheet.
  float c1 = 1.70158;
  float c2 = c1 * 1.525;
  float ripplePhase = rippleLinear < 0.5
    ? (pow(2.0 * rippleLinear, 2.0) * ((c2 + 1.0) * 2.0 * rippleLinear - c2)) / 2.0
    : (pow(2.0 * rippleLinear - 2.0, 2.0) * ((c2 + 1.0) * (rippleLinear * 2.0 - 2.0) + c2) + 2.0) / 2.0;
  float rippleTravel = clamp(ripplePhase, 0.0, 1.0) * uRippleRadius;
  float rippleEnvelope = smoothstep(0.0, 0.5, rippleTravel)
    * (1.0 - smoothstep(uRippleRadius - 1.0, uRippleRadius, rippleTravel));
  float primaryRipple = 1.0 - smoothstep(0.0, uRippleWidth, abs(rippleDistance - rippleTravel));
  float echoTravel = clamp(rippleTravel - rippleDirection * 0.58, 0.0, uRippleRadius);
  float echoGate = rippleDirection > 0.0
    ? step(0.58, rippleTravel)
    : step(rippleTravel, uRippleRadius - 0.58);
  float echoRipple = (1.0 - smoothstep(0.0, uRippleWidth * 1.18, abs(rippleDistance - echoTravel)))
    * echoGate * 0.42;
  vRipple = max(primaryRipple, echoRipple) * rippleEnvelope;
  pos += aNormal * vRipple * uRippleDisplacement;

  if (uIsOrb > 0.5) {
    float breath = sin(uTime * 0.72 + aSeed * 8.0) * 0.006;
    pos += normalize(pos + vec3(0.0001)) * breath;
  }

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  float cameraDistance = max(0.1, -mvPosition.z);
  float perspectiveSize = 10.0 / cameraDistance;
  float rippleSize = 1.0 + vRipple * 0.34;
  gl_PointSize = clamp(aSize * uPointScale * uPixelRatio * perspectiveSize * rippleSize, 1.15, 5.6);

  float depthAttenuation = mix(1.0, smoothstep(20.0, 3.0, cameraDistance), uDepthFade);
  float flickerPhase = hash11(floor(uTime * uFlickerSpeed * 7.0) + aSeed * 211.0);
  float flicker = mix(1.0, step(0.22, flickerPhase), unstablePoint);
  vBrightness = aBrightness * (1.02 + orbInfluence * 0.38 + uIsOrb * 0.32 + vRipple * uRippleBrightness);
  vAlpha = aVisibility * depthAttenuation * flicker * (1.08 + vRipple * 0.24);
  vDepth = clamp(cameraDistance / 20.0, 0.0, 1.0);

  gl_Position = projectionMatrix * mvPosition;
}
`

export const cardPointCloudFragmentShader = /* glsl */ `
uniform vec3 uNearBlack;
uniform vec3 uMutedCyan;
uniform vec3 uMutedViolet;
uniform vec3 uDimGreen;
uniform vec3 uRareMagenta;
uniform vec3 uOrbInfluenceColor;
uniform vec3 uRippleColor;

varying float vAlpha;
varying float vBrightness;
varying float vSeed;
varying float vOrbInfluence;
varying float vDepth;
varying float vRipple;

void main() {
  vec2 point = gl_PointCoord - vec2(0.5);
  float radius = length(point);
  if (radius > 0.5) discard;
  float edge = smoothstep(0.5, 0.39, radius);

  vec3 nearBlack = uNearBlack;
  vec3 mutedCyan = uMutedCyan;
  vec3 mutedViolet = uMutedViolet;
  vec3 dimGreen = uDimGreen;
  vec3 rareMagenta = uRareMagenta;

  float tone = fract(vSeed * 17.31);
  vec3 color = mix(nearBlack, mutedCyan, smoothstep(0.08, 0.72, tone) * 0.72);
  color = mix(color, mutedViolet, smoothstep(0.78, 0.96, tone) * 0.46);
  color = mix(color, dimGreen, smoothstep(0.32, 0.5, fract(vSeed * 8.7)) * 0.22);
  color = mix(color, rareMagenta, step(0.982, fract(vSeed * 41.9)) * 0.22);
  color = mix(color, uOrbInfluenceColor, vOrbInfluence * 0.28);
  color = mix(color, uRippleColor, vRipple * 0.34);
  color *= vBrightness * mix(1.12, 0.82, vDepth);

  float alpha = edge * min(vAlpha, 1.0);
  if (alpha < 0.018) discard;
  gl_FragColor = vec4(color, alpha);
}
`
