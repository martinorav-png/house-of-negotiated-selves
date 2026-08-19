import { useControls } from 'leva'
import { journeySettings } from './journeySettingsStore'
import { mirrorSettings } from './mirrorSettingsStore'

/**
 * Live tuning for Station II — same pattern as MirrorDevPanel (sliders
 * write into a plain settings store, consumers read it). Renders no UI of
 * its own: the app already mounts a single global <Leva/> panel, and any
 * component calling useControls anywhere just adds its own folder to that
 * same panel.
 *
 * The orb folder targets mirrorSettingsStore's orb directly — Debra's
 * guide orb (DebraGuide.tsx) is the exact same MirrorGuideOrb component
 * Station III uses, so tuning it here tunes the same underlying values.
 * Named "Journey — Orb" (not "Mirror — Orb") purely so leva doesn't see
 * two panels registering the same folder name at once.
 */
export function JourneyDevPanel() {
  const orb = useControls('Journey — Orb', {
    pointScale: { value: mirrorSettings.orb.pointScale, min: 0.1, max: 3, step: 0.01 },
    radius: { value: mirrorSettings.orb.radius, min: 0.3, max: 2, step: 0.05 },
    cameraDistance: { value: mirrorSettings.orb.cameraDistance, min: 2, max: 16, step: 0.1 },
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

  const colors = useControls('Journey — Colors', {
    ice: journeySettings.colors.ice,
    ink: journeySettings.colors.ink,
    quiet: journeySettings.colors.quiet,
    frost: journeySettings.colors.frost,
  })
  Object.assign(journeySettings.colors, colors)

  const timing = useControls('Journey — Timing', {
    percentileMs: { value: journeySettings.timing.percentileMs, min: 500, max: 8000, step: 100 },
    companionIntroMs: {
      value: journeySettings.timing.companionIntroMs,
      min: 500,
      max: 8000,
      step: 100,
    },
    debraBriefMs: { value: journeySettings.timing.debraBriefMs, min: 500, max: 8000, step: 100 },
  })
  Object.assign(journeySettings.timing, timing)

  return null
}
