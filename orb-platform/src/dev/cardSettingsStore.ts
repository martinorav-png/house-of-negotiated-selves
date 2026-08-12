/**
 * Live-tunable values for the Cards-station dev panel (see CardsDevPanel).
 * Same pattern as ../dev/settingsStore.ts — a plain mutable object, no leva
 * dependency here, so it's always safe to import from production code.
 * Consumers either read it per-frame (shader uniforms, inside useFrame) or
 * poll it at a throttled interval to bridge into React props (post-fx,
 * DOM/CSS-driven card styling) without needing leva in their own bundle.
 */
export const cardSettings = {
  pointCloud: {
    pointScale: 0.58,
    flickerAmount: 0.015,
    flickerSpeed: 0.5,
    depthFade: 0.15,
    rippleDuration: 3.4,
    rippleRadius: 7,
    rippleWidth: 0.42,
    rippleDisplacement: 0.055,
    rippleBrightness: 0.78,
    colorNearBlack: '#090d0c',
    colorCyan: '#458a94',
    colorViolet: '#614d85',
    colorGreen: '#578c63',
    colorMagenta: '#8f386e',
  },
  scan: {
    color: '#ffffff',
    pointScale: 0.3,
    thickness: 0.38,
    cycleDuration: 3.4,
  },
  post: {
    bloomIntensity: 0.6,
    bloomThreshold: 0,
    bloomSmoothing: 0,
    chromaticAberration: 0.003,
    noiseOpacity: 0.1,
  },
  cardStyle: {
    holoTeal: '#458a94',
    holoTealAlpha: 0.72,
    holoViolet: '#614d85',
    holoVioletAlpha: 0.55,
    holoMint: '#c7e6e0',
    holoMintAlpha: 0.9,
    holoGreen: '#578c63',
    holoGreenAlpha: 0.35,
    blurPx: 7,
    hoverDuration: 5.4,
    flickerDuration: 3.6,
    grainDuration: 4.8,
  },
  swap: {
    cardDistance: 28,
    verticalDistance: 44,
    delay: 4400,
    skewAmount: 4,
  },
}
