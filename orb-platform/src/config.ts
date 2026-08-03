/**
 * Scene tuning knobs — adjust these first when iterating on look & feel.
 */
export const ROOM = {
  width: 8,
  height: 5.2,
  depth: 9,
  wallThickness: 0.18,
  /** Soft edge radius approximation via slightly inset bevels on meshes */
  edgeInset: 0.04,
} as const

export const PLATFORM = {
  radius: 1.15,
  height: 0.28,
  y: 0.14,
  segments: 64,
} as const

export const ORB = {
  radius: 0.55,
  segments: 96,
  /** World Y of orb center (platform top + float gap) */
  baseY: PLATFORM.y + PLATFORM.height / 2 + 0.72,
  floatAmplitude: 0.06,
  floatSpeed: 0.7,
  breathAmplitude: 0.018,
  breathSpeed: 1.1,
  hoverScale: 1.08,
  clickPulseScale: 1.14,
  cooldownMs: 900,
  /** Lower = smoother hover ease (damp lambda) */
  hoverDampIn: 3.2,
  hoverDampOut: 2.4,
  scaleDamp: 4.5,
  /** Idle heartbeat ripple (lub–dub) */
  heartbeatBpm: 64,
  heartbeatScale: 0.028,
  heartbeatLight: 0.22,
  heartbeatRipple: 1,
} as const

/** Cool cyan–violet installation palette — restrained scan colours */
export const PALETTE = {
  orbCore: '#c8f0ff',
  orbMid: '#5ec8ff',
  orbRim: '#7b6cff',
  orbAccent: '#a8fff0',
  envPoint: '#6a7380',
  envPointDim: '#3a424c',
  wall: '#1a1c1f',
  wallRoughness: 0.82,
  floor: '#121416',
  floorRoughness: 0.55,
  platform: '#2a2e35',
  platformMetalness: 0.55,
  platformRoughness: 0.35,
  ambient: '#1a2030',
  fill: '#304058',
} as const

export const LIGHT = {
  /** Idle point-light intensity (orb as primary source) */
  orbIdle: 2.5,
  orbHover: 4,
  orbClick: 7,
  orbDistance: 14,
  orbDecay: 1.6,
  ambientIntensity: 0.04,
  hemiIntensity: 0.06,
  fillIntensity: 0.08,
  shadowMapSize: 512,
} as const

export const CAMERA = {
  fov: 42,
  near: 0.1,
  far: 60,
  /** Default desktop framing — looking at orb center */
  position: [0, ORB.baseY + 0.15, 5.4] as [number, number, number],
  lookAt: [0, ORB.baseY - 0.05, 0] as [number, number, number],
  /** Narrow screens: pull back slightly */
  narrowZ: 6.4,
  narrowFov: 48,
  narrowBreakpoint: 720,
} as const

export const PARTICLES = {
  count: 140,
  reducedCount: 48,
  lifetime: 0.95,
  speedMin: 1.8,
  speedMax: 4.2,
  size: 1.8,
} as const

/** Point-cloud densities — tune for GPU */
export const SCAN = {
  orbShell: 28000,
  orbVolume: 10000,
  orbHalo: 4000,
  roomBack: 18000,
  roomLeft: 10000,
  roomRight: 10000,
  roomFloor: 14000,
  roomCeiling: 6000,
  platformBox: 7000,
  platformDisk: 5000,
  envPointScale: 1.0,
  orbPointScale: 0.7,
  shockwaveMaxRadius: 8.5,
  scanSpeed: 0.28,
} as const

export const POST = {
  /** Soft bloom — keep threshold high so points don't melt together */
  bloomIntensity: 0.28,
  bloomLuminanceThreshold: 0.88,
  bloomLuminanceSmoothing: 0.4,
  bloomMipmapBlur: true,
  /** Global CA — keep very slight; CRT panel has its own stronger split */
  chromaticAberration: 0.00035,
  vignetteOffset: 0.32,
  vignetteDarkness: 0.78,
  noiseOpacity: 0.018,
} as const

export const RENDERER = {
  maxDpr: 1.75,
  exposure: 0.88,
} as const

/** Mic-driven orb motion — sensitivity & motion amounts */
export const AUDIO = {
  fftSize: 512,
  sensitivity: 1.35,
  /** EMA factor toward new samples (higher = snappier) — applied as 1-smoothing in hook */
  smoothing: 0.82,
  floatBoost: 0.22,
  scaleBoost: 0.12,
  displaceBoost: 1.8,
  intensityBoost: 0.15,
} as const

/** Back-wall faux TV / stats log display */
export const STATS_SCREEN = {
  width: 5.6,
  height: 3.15,
  /** Slightly in front of back wall */
  zOffset: 0.12,
  /** Vertical center of the panel */
  y: 2.65,
  textureWidth: 1024,
  textureHeight: 576,
  lineIntervalMs: 1800,
  maxVisibleLines: 1,
  /** Room point-cloud spill from the CRT */
  spillIntensity: 1.15,
} as const

/** Spatial question prompt below the orb */
export const QUESTION = {
  position: [0, 0.02, 1.45] as [number, number, number],
  /** Tilt slightly toward camera for readable foreshortening */
  rotation: [-0.18, 0, 0] as [number, number, number],
  fontSize: 0.15,
  maxWidth: 4.2,
  /** How far edge of the bent sentence sits back vs the center */
  arcRecess: 0.62,
  intervalMs: 5200,
  fadeMs: 700,
} as const
