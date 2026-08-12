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
    pointScale: 0.1,
    flickerAmount: 0.015,
    flickerSpeed: 0.89,
    depthFade: 0.58,
    rippleDuration: 10,
    rippleRadius: 7,
    rippleWidth: 0.42,
    rippleDisplacement: 0.055,
    rippleBrightness: 0.78,
    colorNearBlack: '#090d0c',
    colorCyan: '#ffffff',
    colorViolet: '#ffffff',
    colorGreen: '#4b4b4b',
    colorMagenta: '#939393',
    // Two more highlight tints the shader mixes in on top of the palette
    // above (orb-proximity glow, ripple-wave glow) — previously hardcoded
    // and NOT covered by the 5 colors above, which is why changing those
    // alone didn't fully remove the green/cyan cast.
    colorOrbInfluence: '#c7e6e0',
    colorRipple: '#b8ede6',
  },
  scan: {
    color: '#000000',
    pointScale: 0.05,
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
    holoTeal: '#2e2e2e',
    holoTealAlpha: 0.72,
    holoViolet: '#000000',
    holoVioletAlpha: 0.55,
    holoMint: '#b1b1b1',
    holoMintAlpha: 0.9,
    holoGreen: '#ffffff',
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
