/**
 * Live-tunable values for the Mirror (station III) dev panel (see
 * MirrorDevPanel). Same pattern as ../dev/settingsStore.ts and
 * cardSettingsStore.ts — a plain mutable object, no leva dependency here,
 * so it's always safe to import from production code.
 */
export const mirrorSettings = {
  orb: {
    pointScale: 0.8,
    radius: 1,
    brightness: 1.5,
    alphaFloor: 0.05,
    heartbeatBpm: 13,
    heartbeatRipple: 0.5,
    breathAmplitude: 0.03,
    breathSpeed: 1,
    colorCore: '#f2fbf8',
    colorMid: '#7fd8c9',
    colorRim: '#3fa8c9',
  },
  background: {
    top: '#2b2e2f',
    bottom: '#020303',
  },
  text: {
    color: '#f4f6f5',
    smudgeColor: '#9fe6d8',
    fontPx: 64,
    crispAlpha: 0.78,
    smudgeAlpha: 0.75,
    smudgeBlurPx: 9,
    smudgeWeight: 650,
    smudgeBoost: 2,
    smudgeContrast: 200,
    smudgeFloor: 0.12,
    driftPeriod: 14,
    grain: 55,
    edgeFade: 0,
  },
  accent: {
    color: '#6fd6c4',
  },
  timing: {
    introSeconds: 5,
    promptSeconds: 6,
    countdownStepSeconds: 1,
    recordingSeconds: 30,
    loadingSeconds: 5,
  },
}
