import { button, useControls } from 'leva'
import { settings } from './settingsStore'

function snapshotSettings() {
  // Deep plain clone so the clipboard gets exact live values, not proxies.
  return JSON.parse(JSON.stringify(settings)) as typeof settings
}

/**
 * Live tuning panel — sliders/color pickers write straight into
 * settingsStore, which the scene reads every frame/redraw. Nothing here
 * is wired through React state or props; it's a thin UI over that store.
 */
export function DevPanel() {
  const orb = useControls('Orb', {
    heartbeatBpm: { value: settings.orb.heartbeatBpm, min: 4, max: 80, step: 1 },
    heartbeatScale: { value: settings.orb.heartbeatScale, min: 0, max: 0.03, step: 0.001 },
    heartbeatRipple: { value: settings.orb.heartbeatRipple, min: 0, max: 1, step: 0.01 },
    floatAmplitude: { value: settings.orb.floatAmplitude, min: 0, max: 0.3, step: 0.005 },
    floatSpeed: { value: settings.orb.floatSpeed, min: 0, max: 3, step: 0.01 },
    breathAmplitude: { value: settings.orb.breathAmplitude, min: 0, max: 0.1, step: 0.001 },
    breathSpeed: { value: settings.orb.breathSpeed, min: 0, max: 3, step: 0.01 },
    hoverScale: { value: settings.orb.hoverScale, min: 1, max: 1.5, step: 0.01 },
    scaleDamp: { value: settings.orb.scaleDamp, min: 0.5, max: 10, step: 0.1 },
    brightness: { value: settings.orb.brightness, min: 0, max: 3, step: 0.01 },
    alphaFloor: { value: settings.orb.alphaFloor, min: 0, max: 1, step: 0.01 },
  })
  Object.assign(settings.orb, orb)

  const room = useControls('Background — Room', {
    baseColor: settings.room.baseColor,
    liftColor: settings.room.liftColor,
    saturation: { value: settings.room.saturation, min: 0, max: 2, step: 0.01 },
    glowRadius: { value: settings.room.glowRadius, min: 2, max: 20, step: 0.1 },
    grain: { value: settings.room.grain, min: 0, max: 0.1, step: 0.002 },
  })
  Object.assign(settings.room, room)

  const darkspace = useControls('Background — Void', {
    baseColor: settings.darkspace.baseColor,
    liftColor: settings.darkspace.liftColor,
    saturation: { value: settings.darkspace.saturation, min: 0, max: 2, step: 0.01 },
    grain: { value: settings.darkspace.grain, min: 0, max: 0.1, step: 0.002 },
  })
  Object.assign(settings.darkspace, darkspace)

  const text = useControls('Text', {
    fontPx: { value: settings.text.fontPx, min: 40, max: 220, step: 1 },
    crispAlpha: { value: settings.text.crispAlpha, min: 0, max: 1, step: 0.01 },
    color: settings.text.color,
    smudgeAlpha: { value: settings.text.smudgeAlpha, min: 0, max: 1, step: 0.01 },
    smudgeColor: settings.text.smudgeColor,
    smudgeBlurPx: { value: settings.text.smudgeBlurPx, min: 0, max: 20, step: 0.1 },
    smudgeWeight: { value: settings.text.smudgeWeight, min: 100, max: 900, step: 10 },
    smudgeBoost: { value: settings.text.smudgeBoost, min: 1, max: 5, step: 1 },
    smudgeContrast: { value: settings.text.smudgeContrast, min: 50, max: 400, step: 5 },
    smudgeFloor: { value: settings.text.smudgeFloor, min: 0, max: 1, step: 0.01 },
    driftPeriod: { value: settings.text.driftPeriod, min: 1, max: 30, step: 0.5 },
    grain: { value: settings.text.grain, min: 0, max: 120, step: 1 },
    edgeFade: { value: settings.text.edgeFade, min: 0, max: 1, step: 0.01 },
    fadeSpeed: { value: settings.text.fadeSpeed, min: 0.05, max: 3, step: 0.01 },
  })
  Object.assign(settings.text, text)

  const scan = useControls('Scan Sweep', {
    color: settings.scan.color,
    opacity: { value: settings.scan.opacity, min: 0, max: 0.3, step: 0.005 },
    pointSize: { value: settings.scan.pointSize, min: 0.005, max: 0.15, step: 0.005 },
    speed: { value: settings.scan.speed, min: 0.02, max: 1, step: 0.01 },
  })
  Object.assign(settings.scan, scan)

  useControls('Clipboard', {
    'Copy all settings': button(() => {
      void navigator.clipboard.writeText(JSON.stringify(snapshotSettings(), null, 2))
    }),
  })

  return null
}
