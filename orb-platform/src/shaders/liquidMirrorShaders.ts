export const liquidMirrorVertexShader = /* glsl */ `
varying vec2 vUv;
varying vec3 vWorld;

void main() {
  vUv = uv;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vWorld = world.xyz;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`

export const liquidMirrorFragmentShader = /* glsl */ `
uniform sampler2D uMap;
uniform float uTime;
uniform float uActivity;
uniform vec3 uDeepColor;
uniform vec3 uSheenColor;
uniform vec3 uWarmColor;

varying vec2 vUv;
varying vec3 vWorld;

float wave(vec2 p, float speed, float scale) {
  return sin((p.x * 1.7 + p.y * 1.2) * scale + uTime * speed);
}

void main() {
  vec2 uv = vUv;
  vec2 c = uv - 0.5;
  float d = length(c);

  float w1 = wave(uv + vec2(0.03, -0.02), 0.16, 5.8);
  float w2 = wave(uv.yx + vec2(0.12, 0.04), -0.11, 8.5);
  float w3 = wave(uv * vec2(1.0, 1.8), 0.07, 13.0);
  float fluid = (w1 + w2 * 0.55 + w3 * 0.22) / 1.77;

  vec2 distortion = vec2(
    sin((uv.y + fluid * 0.04) * 7.0 + uTime * 0.10),
    cos((uv.x - fluid * 0.03) * 6.0 - uTime * 0.08)
  ) * (0.008 + uActivity * 0.006);

  vec4 text = texture2D(uMap, uv + distortion);

  float edge = smoothstep(0.92, 0.3, d);
  float vertical = smoothstep(0.0, 1.0, uv.y);
  vec3 base = mix(uDeepColor, uSheenColor, 0.18 + vertical * 0.2 + fluid * 0.08);

  float streak = smoothstep(0.022, 0.0, abs(c.x * 0.78 + c.y * 0.28 + fluid * 0.035));
  float secondary = smoothstep(0.035, 0.0, abs(c.x * -0.45 + c.y * 0.52 - 0.16 + fluid * 0.025));
  float rim = smoothstep(0.5, 0.17, abs(uv.x - 0.5)) * smoothstep(0.55, 0.12, abs(uv.y - 0.5));

  vec3 col = base;
  col += uSheenColor * streak * (0.22 + uActivity * 0.12);
  col += uWarmColor * secondary * 0.10;
  col += vec3(0.8, 0.92, 0.86) * pow(max(0.0, 1.0 - d * 2.1), 3.0) * 0.08;
  col *= 0.72 + edge * 0.34;
  col += text.rgb * text.a * (0.8 + uActivity * 0.2);
  col += uSheenColor * text.a * 0.12;

  float alpha = 0.86 + rim * 0.12;
  gl_FragColor = vec4(col, alpha);
}
`

export const mirrorGlowVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

export const mirrorGlowFragmentShader = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying vec2 vUv;

void main() {
  vec2 c = vUv - 0.5;
  float d = length(c * vec2(0.82, 1.0)) * 2.0;
  float a = smoothstep(1.0, 0.05, d) * uOpacity;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uColor * a, a);
}
`
