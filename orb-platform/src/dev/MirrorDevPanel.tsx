import { useControls } from 'leva'
import { mirrorSettings } from './mirrorSettingsStore'

/**
 * Live tuning for the Mirror station (station III) — mirrors DevPanel.tsx's
 * pattern (sliders write into mirrorSettingsStore, consumers read it).
 * Renders no UI of its own: the app already mounts a single global <Leva/>
 * panel (in DevPanel), and any component calling useControls anywhere just
 * adds its own folder to that same panel.
 */
export function MirrorDevPanel() {
  const orb = useControls('Mirror — Orb', {
    pointScale: { value: mirrorSettings.orb.pointScale, min: 0.1, max: 3, step: 0.01 },
    radius: { value: mirrorSettings.orb.radius, min: 0.3, max: 2, step: 0.05 },
    cameraDistance: { value: mirrorSettings.orb.cameraDistance, min: 2, max: 16, step: 0.1 },
    shellCount: { value: mirrorSettings.orb.shellCount, min: 100, max: 12000, step: 50 },
    volumeCount: { value: mirrorSettings.orb.volumeCount, min: 0, max: 4000, step: 25 },
    haloCount: { value: mirrorSettings.orb.haloCount, min: 0, max: 2000, step: 10 },
    brightness: { value: mirrorSettings.orb.brightness, min: 0, max: 3, step: 0.01 },
    alphaFloor: { value: mirrorSettings.orb.alphaFloor, min: 0, max: 1, step: 0.01 },
    heartbeatBpm: { value: mirrorSettings.orb.heartbeatBpm, min: 4, max: 80, step: 1 },
    heartbeatRipple: { value: mirrorSettings.orb.heartbeatRipple, min: 0, max: 1, step: 0.01 },
    breathAmplitude: { value: mirrorSettings.orb.breathAmplitude, min: 0, max: 0.1, step: 0.001 },
    breathSpeed: { value: mirrorSettings.orb.breathSpeed, min: 0, max: 3, step: 0.01 },
    colorCore: mirrorSettings.orb.colorCore,
    colorMid: mirrorSettings.orb.colorMid,
    colorRim: mirrorSettings.orb.colorRim,
  })
  Object.assign(mirrorSettings.orb, orb)

  const background = useControls('Mirror — Background', {
    top: mirrorSettings.background.top,
    bottom: mirrorSettings.background.bottom,
  })
  Object.assign(mirrorSettings.background, background)

  const text = useControls('Mirror — Text', {
    color: mirrorSettings.text.color,
    smudgeColor: mirrorSettings.text.smudgeColor,
    fontPx: { value: mirrorSettings.text.fontPx, min: 24, max: 120, step: 1 },
    crispAlpha: { value: mirrorSettings.text.crispAlpha, min: 0, max: 1, step: 0.01 },
    smudgeAlpha: { value: mirrorSettings.text.smudgeAlpha, min: 0, max: 1, step: 0.01 },
    smudgeBlurPx: { value: mirrorSettings.text.smudgeBlurPx, min: 0, max: 30, step: 0.1 },
    smudgeWeight: { value: mirrorSettings.text.smudgeWeight, min: 100, max: 900, step: 10 },
    smudgeBoost: { value: mirrorSettings.text.smudgeBoost, min: 1, max: 6, step: 1 },
    smudgeContrast: { value: mirrorSettings.text.smudgeContrast, min: 50, max: 400, step: 5 },
    smudgeFloor: { value: mirrorSettings.text.smudgeFloor, min: 0, max: 1, step: 0.01 },
    driftPeriod: { value: mirrorSettings.text.driftPeriod, min: 1, max: 40, step: 0.5 },
    grain: { value: mirrorSettings.text.grain, min: 0, max: 150, step: 1 },
    edgeFade: { value: mirrorSettings.text.edgeFade, min: 0, max: 1, step: 0.01 },
  })
  Object.assign(mirrorSettings.text, text)

  const accent = useControls('Mirror — Accent', {
    color: mirrorSettings.accent.color,
  })
  Object.assign(mirrorSettings.accent, accent)

  const timing = useControls('Mirror — Timing', {
    introSeconds: { value: mirrorSettings.timing.introSeconds, min: 1, max: 20, step: 0.5 },
    promptSeconds: { value: mirrorSettings.timing.promptSeconds, min: 1, max: 20, step: 0.5 },
    countdownStepSeconds: {
      value: mirrorSettings.timing.countdownStepSeconds,
      min: 0.3,
      max: 3,
      step: 0.1,
    },
    recordingSeconds: { value: mirrorSettings.timing.recordingSeconds, min: 3, max: 60, step: 1 },
    loadingSeconds: { value: mirrorSettings.timing.loadingSeconds, min: 1, max: 20, step: 0.5 },
  })
  Object.assign(mirrorSettings.timing, timing)

  return null
}
