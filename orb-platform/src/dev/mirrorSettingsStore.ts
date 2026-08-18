/**
 * Live-tunable values for the Mirror (station III) dev panel (see
 * MirrorDevPanel). Same pattern as ../dev/settingsStore.ts and
 * cardSettingsStore.ts — a plain mutable object, no leva dependency here,
 * so it's always safe to import from production code.
 */
export const mirrorSettings = {
  orb: {
    pointScale: 0.1,
    radius: 2,
    cameraDistance: 5.1,
    shellCount: 2900,
    volumeCount: 2425,
    haloCount: 1310,
    brightness: 3,
    alphaFloor: 0.05,
    heartbeatBpm: 13,
    heartbeatRipple: 0.5,
    breathAmplitude: 0.03,
    breathSpeed: 1,
    colorCore: '#fff6e8',
    colorMid: '#f0c48a',
    colorRim: '#c47848',
  },
  background: {
    top: '#1a1410',
    bottom: '#0c0907',
  },
  text: {
    color: '#fff4e8',
    smudgeColor: '#f0d4b8',
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
    color: '#e8b88c',
  },
  timing: {
    introSeconds: 20,
    promptSeconds: 20,
    countdownStepSeconds: 3,
    recordingSeconds: 30,
    loadingSeconds: 5,
  },
}
