/**
 * Live-tunable values for the dev settings panel (see DevPanel.tsx).
 * A plain mutable object, not React state — components read these
 * directly inside useFrame/draw calls each frame/redraw, the same pattern
 * already used for scanUniforms/audioLevels/typingState. DevPanel's leva
 * controls write into this on change; nothing here is reactive on its own.
 */
export const settings = {
  orb: {
    heartbeatBpm: 5,
    heartbeatScale: 0.007,
    heartbeatRipple: 0.18,
    floatAmplitude: 0.06,
    floatSpeed: 0.7,
    breathAmplitude: 0.018,
    breathSpeed: 1.1,
    hoverScale: 1.08,
    scaleDamp: 5.8,
    brightness: 1.58,
    alphaFloor: 0.02,
  },
  room: {
    baseColor: '#0b0a09',
    liftColor: '#868a8d',
    saturation: 1.34,
    glowRadius: 5.6,
    grain: 0.038,
  },
  darkspace: {
    baseColor: '#0c0908',
    liftColor: '#332519',
    saturation: 1,
    grain: 0.03,
  },
  text: {
    fontPx: 104,
    crispAlpha: 0.59,
    color: '#ffffff',
    smudgeAlpha: 1,
    smudgeColor: '#f8f8f8',
    smudgeBlurPx: 10.9,
    smudgeWeight: 670,
    smudgeBoost: 2,
    smudgeContrast: 215,
    smudgeFloor: 0.12,
    driftPeriod: 17,
    grain: 80,
    edgeFade: 0.17,
    fadeSpeed: 2.49,
  },
  scan: {
    opacity: 0.045,
    pointSize: 0.015,
    speed: 0.75,
    color: '#8c7b63',
  },
}
