import { useControls } from 'leva'
import { cardSettings } from './cardSettingsStore'

/**
 * Live tuning for the Cards station — mirrors DevPanel.tsx's pattern
 * (sliders write into cardSettingsStore, consumers read it). Renders no UI
 * of its own: the app already mounts a single global <Leva/> panel (in
 * DevPanel), and any component calling useControls anywhere just adds its
 * own folder to that same panel.
 */
export function CardsDevPanel() {
  const pointCloud = useControls('Cards — Point Cloud', {
    pointScale: { value: cardSettings.pointCloud.pointScale, min: 0.1, max: 1.5, step: 0.01 },
    flickerAmount: { value: cardSettings.pointCloud.flickerAmount, min: 0, max: 0.1, step: 0.001 },
    flickerSpeed: { value: cardSettings.pointCloud.flickerSpeed, min: 0, max: 3, step: 0.01 },
    depthFade: { value: cardSettings.pointCloud.depthFade, min: 0, max: 1, step: 0.01 },
    rippleDuration: { value: cardSettings.pointCloud.rippleDuration, min: 0.5, max: 10, step: 0.1 },
    rippleRadius: { value: cardSettings.pointCloud.rippleRadius, min: 1, max: 15, step: 0.1 },
    rippleWidth: { value: cardSettings.pointCloud.rippleWidth, min: 0.05, max: 2, step: 0.01 },
    rippleDisplacement: {
      value: cardSettings.pointCloud.rippleDisplacement,
      min: 0,
      max: 0.3,
      step: 0.005,
    },
    rippleBrightness: {
      value: cardSettings.pointCloud.rippleBrightness,
      min: 0,
      max: 2,
      step: 0.01,
    },
    colorNearBlack: cardSettings.pointCloud.colorNearBlack,
    colorCyan: cardSettings.pointCloud.colorCyan,
    colorViolet: cardSettings.pointCloud.colorViolet,
    colorGreen: cardSettings.pointCloud.colorGreen,
    colorMagenta: cardSettings.pointCloud.colorMagenta,
    colorOrbInfluence: cardSettings.pointCloud.colorOrbInfluence,
    colorRipple: cardSettings.pointCloud.colorRipple,
  })
  Object.assign(cardSettings.pointCloud, pointCloud)

  const scan = useControls('Cards — Scan Sweep', {
    color: cardSettings.scan.color,
    pointScale: { value: cardSettings.scan.pointScale, min: 0.05, max: 1, step: 0.01 },
    thickness: { value: cardSettings.scan.thickness, min: 0.05, max: 1.5, step: 0.01 },
    cycleDuration: { value: cardSettings.scan.cycleDuration, min: 0.5, max: 10, step: 0.1 },
  })
  Object.assign(cardSettings.scan, scan)

  const post = useControls('Cards — Post', {
    bloomIntensity: { value: cardSettings.post.bloomIntensity, min: 0, max: 2, step: 0.01 },
    bloomThreshold: { value: cardSettings.post.bloomThreshold, min: 0, max: 1, step: 0.01 },
    bloomSmoothing: { value: cardSettings.post.bloomSmoothing, min: 0, max: 1, step: 0.01 },
    chromaticAberration: {
      value: cardSettings.post.chromaticAberration,
      min: 0,
      max: 0.02,
      step: 0.0005,
    },
    noiseOpacity: { value: cardSettings.post.noiseOpacity, min: 0, max: 0.5, step: 0.005 },
  })
  Object.assign(cardSettings.post, post)

  const cardStyle = useControls('Cards — Card Style', {
    holoTeal: cardSettings.cardStyle.holoTeal,
    holoTealAlpha: { value: cardSettings.cardStyle.holoTealAlpha, min: 0, max: 1, step: 0.01 },
    holoViolet: cardSettings.cardStyle.holoViolet,
    holoVioletAlpha: { value: cardSettings.cardStyle.holoVioletAlpha, min: 0, max: 1, step: 0.01 },
    holoMint: cardSettings.cardStyle.holoMint,
    holoMintAlpha: { value: cardSettings.cardStyle.holoMintAlpha, min: 0, max: 1, step: 0.01 },
    holoGreen: cardSettings.cardStyle.holoGreen,
    holoGreenAlpha: { value: cardSettings.cardStyle.holoGreenAlpha, min: 0, max: 1, step: 0.01 },
    blurPx: { value: cardSettings.cardStyle.blurPx, min: 0, max: 24, step: 0.5 },
    hoverDuration: { value: cardSettings.cardStyle.hoverDuration, min: 0.5, max: 12, step: 0.1 },
    flickerDuration: {
      value: cardSettings.cardStyle.flickerDuration,
      min: 0.5,
      max: 12,
      step: 0.1,
    },
    grainDuration: { value: cardSettings.cardStyle.grainDuration, min: 0.5, max: 12, step: 0.1 },
  })
  Object.assign(cardSettings.cardStyle, cardStyle)

  const swap = useControls('Cards — Swap Timing', {
    cardDistance: { value: cardSettings.swap.cardDistance, min: 0, max: 120, step: 1 },
    verticalDistance: { value: cardSettings.swap.verticalDistance, min: 0, max: 160, step: 1 },
    delay: { value: cardSettings.swap.delay, min: 800, max: 10000, step: 100 },
    skewAmount: { value: cardSettings.swap.skewAmount, min: -15, max: 15, step: 0.5 },
  })
  Object.assign(cardSettings.swap, swap)

  return null
}
