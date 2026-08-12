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
  baseY: PLATFORM.y + PLATFORM.height / 2 + 1.2,
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
  /** Lower = slower, softer catch-up to target scale — avoids a snappy feel. */
  scaleDamp: 2.2,
  /** Idle heartbeat — slow, deep, almost geological. Single smooth pulse,
   * not a springy double-tap. */
  heartbeatBpm: 15,
  heartbeatScale: 0.007,
  heartbeatLight: 0,
  heartbeatRipple: 0.18,
} as const

/** Warm, sun-bleached Dune palette — sand/rust/bone against near-black */
export const PALETTE = {
  orbCore: '#f9fdf8',
  orbMid: '#a8cdb7',
  orbRim: '#d2b57f',
  orbAccent: '#c8dccd',
  envPoint: '#8c7b63',
  envPointDim: '#453a2e',
  wall: '#1a140f',
  wallRoughness: 0.82,
  floor: '#100c08',
  floorRoughness: 0.55,
  platform: '#2c2118',
  platformMetalness: 0.55,
  platformRoughness: 0.35,
  ambient: '#180f0a',
  fill: '#3d2f22',
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
  fov: 36,
  near: 0.1,
  far: 60,
  /** Default desktop framing — looking at orb center */
  position: [0, ORB.baseY + 0.15, 7.2] as [number, number, number],
  lookAt: [0, ORB.baseY - 0.05, 0] as [number, number, number],
  /** Narrow screens: pull back slightly */
  narrowZ: 8.2,
  narrowFov: 42,
  narrowBreakpoint: 720,
} as const

export const PARTICLES = {
  count: 140,
  reducedCount: 48,
  lifetime: 0.95,
  speedMin: 1.2,
  speedMax: 3.1,
  size: 1.8,
} as const

/** Point-cloud densities — tune for GPU */
export const SCAN = {
  // Modest trim (~30%) — still dense enough for the soft orb silhouette.
  orbShell: 32000,
  orbVolume: 10500,
  orbHalo: 4500,
  roomBack: 42000,
  roomLeft: 24000,
  roomRight: 24000,
  roomFloor: 34000,
  roomCeiling: 15000,
  platformBox: 16000,
  platformDisk: 12000,
  envPointScale: 0.26,
  orbPointScale: 0.2,
  shockwaveMaxRadius: 6.2,
  scanSpeed: 0.28,
} as const

/**
 * Legacy orb-station room dissolve knobs — kept for unused Room/RoomDissolve
 * modules. The live orb scene uses solid SpaceRoom + ScanSweep instead.
 */
export const ROOM_DISSOLVE = {
  soft: 0.55,
  damp: 1.15,
  reducedDamp: 7,
  pointScaleBoost: 0.55,
  peelStrength: 0.085,
  dustStrength: 0.72,
  dustCount: 9000,
  dustReducedCount: 2800,
} as const

export const POST = {
  /** Tight bloom — bright points still glow without washing the room soft */
  bloomIntensity: 0.22,
  bloomLuminanceThreshold: 0.93,
  bloomLuminanceSmoothing: 0.05,
  bloomMipmapBlur: true,
  bloomRadius: 0.18,
  bloomLevels: 2,
  /** Global CA is off: keep orb/background away from VHS language */
  chromaticAberration: 0,
  vignetteOffset: 0.32,
  vignetteDarkness: 0.78,
  noiseOpacity: 0,
} as const

export const RENDERER = {
  maxDpr: 1.5,
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

/** Webcam face -> camera orbit (dramatic window parallax) */
export const PARALLAX = {
  maxYaw: 0.55,
  maxPitch: 0.32,
  /** Orbit radius relative to default camera distance */
  radiusMinFactor: 0.72,
  radiusMaxFactor: 1.08,
  /** Face size (normalized landmark span) -> depth; tuned in playtest */
  faceSizeNear: 0.45,
  faceSizeFar: 0.18,
  damp: 3.2,
  lostDamp: 2.0,
  detectIntervalMs: 66,
  reducedMotionScale: 0.3,
  wasmBase:
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm',
  modelUrl:
    'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
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
  position: [0, 0.5, 1.45] as [number, number, number],
  /** Tilt slightly toward camera for readable foreshortening */
  rotation: [-0.18, 0, 0] as [number, number, number],
  fontSize: 0.15,
  maxWidth: 4.2,
  answerYOffset: -0.1,
  answerMaxWidth: 4.0,
  /** How far edge of the bent sentence sits back vs the center */
  arcRecess: 0.62,
  intervalMs: 5200,
  fadeMs: 700,
} as const
