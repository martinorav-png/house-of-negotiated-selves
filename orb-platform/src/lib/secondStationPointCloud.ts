import { PLATFORM, ROOM } from '../config'
import { mergePointClouds, type PointCloudData } from './samplePoints'

export const SECOND_STATION_POINT_CLOUD_CONFIG = {
  seed: 260810,
  desktop: { pointCount: 150000, orbCount: 26000 },
  mobile: { pointCount: 60000, orbCount: 12000 },
  pointSize: { min: 1.55, max: 4, scale: 0.58 },
  baseDensity: 0.75,
  densityNoiseScale: 0.35,
  densityNoiseStrength: 0.7,
  clusterStrength: 0.48,
  clusterScale: 1.8,
  clusterCount: 34,
  normalJitter: 0.012,
  tangentJitter: 0.004,
  dropoutStrength: 0.2,
  dropoutScale: 0.7,
  flickerAmount: 0.015,
  flickerSpeed: 0.5,
  depthFade: 0.15,
  ripple: {
    center: [0, 1, 0] as [number, number, number],
    duration: 3.4,
    radius: 7,
    width: 0.42,
    displacement: 0.055,
    brightness: 0.78,
  },
  orbInfluenceRadius: 2.5,
  orbInfluenceStrength: 0.35,
  scanColor: '#ffffff',
  /** Match the previous GridScan second-station post stack */
  post: {
    bloomIntensity: 0.6,
    bloomThreshold: 0,
    bloomSmoothing: 0,
    chromaticAberration: 0.003,
    noiseOpacity: 0.1,
  },
  noiseOctaves: 3,
  noiseLacunarity: 2.03,
  noiseGain: 0.52,
  clusterRadius: { min: 0.014, max: 0.065 },
  clusterRadiusScaleMin: 0.72,
  clusterStrengthRange: { min: 0.45, max: 1 },
  candidateMix: { cluster: 0.38, outlier: 0.045 },
  edgeStart: 0.72,
  edgeDensityStrength: 0.34,
  edgeJitterStrength: 2.4,
  edgeNormalJitterStrength: 0.65,
  maxAttemptMultiplier: 18,
  brightness: { min: 0.28, max: 1.05 },
  brightnessDensityBoost: 0.08,
  brightnessEdgeBoost: 0.06,
  visibility: { min: 0.48, max: 1 },
  displacement: { min: 0.002, max: 0.022 },
  dropoutRadius: { min: 0.1, max: 0.22 },
  dropoutCore: 0.68,
  dropoutNoiseSoftness: 0.28,
  minimumDropoutCount: 2,
  densityNoiseCeiling: 1.45,
  roomDistribution: {
    back: 0.27,
    floor: 0.22,
    left: 0.15,
    right: 0.15,
    ceiling: 0.1,
  },
  roomEdgeBand: 0.22,
  roomEdgeDistribution: [0.25, 0.25, 0.25, 0.25],
  surfaceThickness: 0.036,
  platformPointShare: 0.18,
  platformTopShare: 0.44,
  platformBoxDistribution: [0.22, 0.22, 0.22, 0.22, 0.12],
  platformWidthScale: 1.85,
  platformTopOffset: 0.012,
} as const

export type PointCloudQuality = 'desktop' | 'mobile'

type VectorTuple = readonly [number, number, number]

export type ScannedPlaneSpec = {
  seed: number
  count: number
  center: VectorTuple
  axisU: VectorTuple
  axisV: VectorTuple
  normal: VectorTuple
  sizeU: number
  sizeV: number
  thickness: number
  edgeNoise?: boolean
}

type Cluster = {
  u: number
  v: number
  radius: number
  strength: number
}

type Dropout = {
  u: number
  v: number
  radius: number
}

type Candidate = {
  u: number
  v: number
  edge: number
  density: number
}

const UINT32_RANGE = 4_294_967_296

function createRandom(seed: number) {
  let state = seed >>> 0

  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / UINT32_RANGE
  }
}

function hash2D(x: number, y: number, seed: number) {
  let value = Math.imul(x, 0x1f123bb5) ^ Math.imul(y, 0x5f356495) ^ seed
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b)
  value = Math.imul(value ^ (value >>> 16), 0x45d9f3b)
  return ((value ^ (value >>> 16)) >>> 0) / UINT32_RANGE
}

function smooth(value: number) {
  return value * value * (3 - 2 * value)
}

function valueNoise2D(x: number, y: number, seed: number) {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const tx = smooth(x - x0)
  const ty = smooth(y - y0)
  const top = lerp(hash2D(x0, y0, seed), hash2D(x0 + 1, y0, seed), tx)
  const bottom = lerp(
    hash2D(x0, y0 + 1, seed),
    hash2D(x0 + 1, y0 + 1, seed),
    tx,
  )
  return lerp(top, bottom, ty)
}

function fbm2D(x: number, y: number, seed: number) {
  const config = SECOND_STATION_POINT_CLOUD_CONFIG
  let amplitude = 1
  let frequency = 1
  let value = 0
  let amplitudeSum = 0

  for (let octave = 0; octave < config.noiseOctaves; octave += 1) {
    value += valueNoise2D(x * frequency, y * frequency, seed + octave * 1013) * amplitude
    amplitudeSum += amplitude
    frequency *= config.noiseLacunarity
    amplitude *= config.noiseGain
  }

  return value / amplitudeSum
}

function gaussian(random: () => number) {
  const magnitude = Math.sqrt(-2 * Math.log(Math.max(random(), Number.EPSILON)))
  return magnitude * Math.cos(Math.PI * 2 * random())
}

function lerp(start: number, end: number, amount: number) {
  return start + (end - start) * amount
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value))
}

function smootherStep(edge0: number, edge1: number, value: number) {
  const amount = clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return amount * amount * amount * (amount * (amount * 6 - 15) + 10)
}

function normalized(vector: VectorTuple): VectorTuple {
  const length = Math.hypot(vector[0], vector[1], vector[2])
  if (length === 0) throw new Error('Scanned plane axes and normal must be non-zero')
  return [vector[0] / length, vector[1] / length, vector[2] / length]
}

function emptyPointCloud(): PointCloudData {
  return {
    positions: new Float32Array(),
    normals: new Float32Array(),
    seeds: new Float32Array(),
    sizes: new Float32Array(),
    brightness: new Float32Array(),
    visibility: new Float32Array(),
    displace: new Float32Array(),
    count: 0,
  }
}

export function buildScannedPlane(
  spec: ScannedPlaneSpec,
  quality: PointCloudQuality,
): PointCloudData {
  if (!Number.isInteger(spec.count) || spec.count < 0) {
    throw new Error('Scanned plane point count must be a non-negative integer')
  }
  if (spec.count === 0) return emptyPointCloud()

  const config = SECOND_STATION_POINT_CLOUD_CONFIG
  const qualitySalt = quality === 'desktop' ? 0x51f15e : 0xa24baed
  const random = createRandom((spec.seed ^ qualitySalt) >>> 0)
  const axisU = normalized(spec.axisU)
  const axisV = normalized(spec.axisV)
  const normal = normalized(spec.normal)
  const clusters: Cluster[] = []
  const dropouts: Dropout[] = []

  for (let cluster = 0; cluster < config.clusterCount; cluster += 1) {
    clusters.push({
      u: random() - 0.5,
      v: random() - 0.5,
      radius:
        lerp(config.clusterRadius.min, config.clusterRadius.max, random()) *
        lerp(config.clusterRadiusScaleMin, config.clusterScale, random()),
      strength: lerp(
        config.clusterStrengthRange.min,
        config.clusterStrengthRange.max,
        random(),
      ),
    })
  }

  const dropoutCount = Math.max(
    config.minimumDropoutCount,
    Math.round(config.clusterCount * config.dropoutStrength),
  )
  for (let dropout = 0; dropout < dropoutCount; dropout += 1) {
    dropouts.push({
      u: random() - 0.5,
      v: random() - 0.5,
      radius: lerp(config.dropoutRadius.min, config.dropoutRadius.max, random()),
    })
  }

  const positions = new Float32Array(spec.count * 3)
  const normals = new Float32Array(spec.count * 3)
  const seeds = new Float32Array(spec.count)
  const sizes = new Float32Array(spec.count)
  const brightness = new Float32Array(spec.count)
  const visibility = new Float32Array(spec.count)
  const displace = new Float32Array(spec.count)
  const densitySeed = spec.seed ^ 0x68bc21eb
  const dropoutSeed = spec.seed ^ 0x2c9277b5

  const makeCandidate = (): Candidate => {
    const candidateType = random()
    let u: number
    let v: number

    if (candidateType < config.candidateMix.cluster) {
      const cluster = clusters[Math.floor(random() * clusters.length)]
      u = cluster.u + gaussian(random) * cluster.radius
      v = cluster.v + gaussian(random) * cluster.radius
    } else {
      u = random() - 0.5
      v = random() - 0.5
    }

    if (u < -0.5 || u > 0.5 || v < -0.5 || v > 0.5) {
      return { u, v, edge: 0, density: 0 }
    }

    let clusterDensity = 0
    for (const cluster of clusters) {
      const du = u - cluster.u
      const dv = v - cluster.v
      const falloff = Math.exp(-(du * du + dv * dv) / (2 * cluster.radius * cluster.radius))
      clusterDensity = Math.max(clusterDensity, falloff * cluster.strength)
    }

    const densityScale = config.densityNoiseScale
    const broadDensity = fbm2D(
      (u + 0.5) / densityScale + 17.3,
      (v + 0.5) / densityScale - 9.1,
      densitySeed,
    )
    const dropoutNoise = fbm2D(
      (u + 0.5) / config.dropoutScale - 4.7,
      (v + 0.5) / config.dropoutScale + 12.6,
      dropoutSeed,
    )
    const dropoutMask = smootherStep(
      config.dropoutStrength,
      config.dropoutStrength + config.dropoutNoiseSoftness,
      dropoutNoise,
    )
    let dropoutIslandMask = 1
    for (const dropout of dropouts) {
      const distance = Math.hypot(u - dropout.u, v - dropout.v)
      dropoutIslandMask = Math.min(
        dropoutIslandMask,
        smootherStep(dropout.radius * config.dropoutCore, dropout.radius, distance),
      )
    }
    const edgePosition = Math.max(Math.abs(u), Math.abs(v)) * 2
    const edge = spec.edgeNoise
      ? smootherStep(config.edgeStart, 1, edgePosition)
      : 0
    const isolatedOutlier = candidateType > 1 - config.candidateMix.outlier
    const broadWeight =
      config.baseDensity *
      (1 - config.densityNoiseStrength +
        broadDensity * config.densityNoiseStrength * config.densityNoiseCeiling)
    const clusterWeight = isolatedOutlier
      ? 0
      : clusterDensity * config.clusterStrength
    const density = clamp(
      (broadWeight + clusterWeight + edge * config.edgeDensityStrength) *
        dropoutMask *
        dropoutIslandMask,
      0,
      1,
    )

    return { u, v, edge, density }
  }

  const writePoint = (point: number, candidate: Candidate) => {
    const tangentScale = config.tangentJitter * (1 + candidate.edge * config.edgeJitterStrength)
    const u = candidate.u * spec.sizeU + gaussian(random) * tangentScale
    const v = candidate.v * spec.sizeV + gaussian(random) * tangentScale
    const normalOffset = clamp(
      gaussian(random) *
        config.normalJitter *
        (1 + candidate.edge * config.edgeNormalJitterStrength),
      -spec.thickness,
      spec.thickness,
    )
    const offset = point * 3

    positions[offset] =
      spec.center[0] + axisU[0] * u + axisV[0] * v + normal[0] * normalOffset
    positions[offset + 1] =
      spec.center[1] + axisU[1] * u + axisV[1] * v + normal[1] * normalOffset
    positions[offset + 2] =
      spec.center[2] + axisU[2] * u + axisV[2] * v + normal[2] * normalOffset
    normals[offset] = normal[0]
    normals[offset + 1] = normal[1]
    normals[offset + 2] = normal[2]
    seeds[point] = random()
    sizes[point] = lerp(config.pointSize.min, config.pointSize.max, random())
    brightness[point] = clamp(
      lerp(config.brightness.min, config.brightness.max, random()) +
        candidate.density * config.brightnessDensityBoost +
        candidate.edge * config.brightnessEdgeBoost,
      config.brightness.min,
      config.brightness.max,
    )
    visibility[point] = lerp(config.visibility.min, config.visibility.max, random())
    displace[point] = lerp(config.displacement.min, config.displacement.max, random())
  }

  let point = 0
  let attempts = 0
  const maxAttempts = spec.count * config.maxAttemptMultiplier

  while (point < spec.count && attempts < maxAttempts) {
    attempts += 1
    const candidate = makeCandidate()
    if (candidate.density === 0 || random() > candidate.density) continue
    writePoint(point, candidate)
    point += 1
  }

  while (point < spec.count) {
    let candidate = makeCandidate()
    if (candidate.u < -0.5 || candidate.u > 0.5 || candidate.v < -0.5 || candidate.v > 0.5) {
      candidate = {
        u: random() - 0.5,
        v: random() - 0.5,
        edge: 0,
        density: config.baseDensity,
      }
    }
    writePoint(point, candidate)
    point += 1
  }

  return {
    positions,
    normals,
    seeds,
    sizes,
    brightness,
    visibility,
    displace,
    count: spec.count,
  }
}

function distribute(total: number, shares: readonly number[]) {
  const counts = shares.map((share) => Math.floor(total * share))
  counts[counts.length - 1] += total - counts.reduce((sum, count) => sum + count, 0)
  return counts
}

export function buildSecondStationRoomCloud(quality: PointCloudQuality): PointCloudData {
  const config = SECOND_STATION_POINT_CLOUD_CONFIG
  const total = config[quality].pointCount
  const distribution = config.roomDistribution
  const [backCount, floorCount, leftCount, rightCount, ceilingCount, edgeCount] =
    distribute(total, [
      distribution.back,
      distribution.floor,
      distribution.left,
      distribution.right,
      distribution.ceiling,
      1 -
        distribution.back -
        distribution.floor -
        distribution.left -
        distribution.right -
        distribution.ceiling,
    ])
  const halfWidth = ROOM.width / 2
  const halfDepth = ROOM.depth / 2
  const halfHeight = ROOM.height / 2
  const thickness = config.surfaceThickness
  const seed = config.seed
  const planes: ScannedPlaneSpec[] = [
    {
      seed: seed + 1,
      count: backCount,
      center: [0, halfHeight, -halfDepth],
      axisU: [1, 0, 0],
      axisV: [0, 1, 0],
      normal: [0, 0, 1],
      sizeU: ROOM.width,
      sizeV: ROOM.height,
      thickness,
      edgeNoise: true,
    },
    {
      seed: seed + 2,
      count: floorCount,
      center: [0, 0, 0],
      axisU: [1, 0, 0],
      axisV: [0, 0, 1],
      normal: [0, 1, 0],
      sizeU: ROOM.width,
      sizeV: ROOM.depth,
      thickness,
      edgeNoise: true,
    },
    {
      seed: seed + 3,
      count: leftCount,
      center: [-halfWidth, halfHeight, 0],
      axisU: [0, 0, 1],
      axisV: [0, 1, 0],
      normal: [1, 0, 0],
      sizeU: ROOM.depth,
      sizeV: ROOM.height,
      thickness,
      edgeNoise: true,
    },
    {
      seed: seed + 4,
      count: rightCount,
      center: [halfWidth, halfHeight, 0],
      axisU: [0, 0, 1],
      axisV: [0, 1, 0],
      normal: [-1, 0, 0],
      sizeU: ROOM.depth,
      sizeV: ROOM.height,
      thickness,
      edgeNoise: true,
    },
    {
      seed: seed + 5,
      count: ceilingCount,
      center: [0, ROOM.height, 0],
      axisU: [1, 0, 0],
      axisV: [0, 0, 1],
      normal: [0, -1, 0],
      sizeU: ROOM.width,
      sizeV: ROOM.depth,
      thickness,
      edgeNoise: true,
    },
  ]

  const edgeCounts = distribute(edgeCount, config.roomEdgeDistribution)
  const edgeBand = config.roomEdgeBand
  planes.push(
    {
      seed: seed + 6,
      count: edgeCounts[0],
      center: [-halfWidth, halfHeight, -halfDepth],
      axisU: [0, 0, 1],
      axisV: [0, 1, 0],
      normal: [1, 0, 0],
      sizeU: edgeBand,
      sizeV: ROOM.height,
      thickness,
      edgeNoise: true,
    },
    {
      seed: seed + 7,
      count: edgeCounts[1],
      center: [halfWidth, halfHeight, -halfDepth],
      axisU: [0, 0, 1],
      axisV: [0, 1, 0],
      normal: [-1, 0, 0],
      sizeU: edgeBand,
      sizeV: ROOM.height,
      thickness,
      edgeNoise: true,
    },
    {
      seed: seed + 8,
      count: edgeCounts[2],
      center: [0, 0, -halfDepth],
      axisU: [1, 0, 0],
      axisV: [0, 0, 1],
      normal: [0, 1, 0],
      sizeU: ROOM.width,
      sizeV: edgeBand,
      thickness,
      edgeNoise: true,
    },
    {
      seed: seed + 9,
      count: edgeCounts[3],
      center: [0, ROOM.height, -halfDepth],
      axisU: [1, 0, 0],
      axisV: [0, 0, 1],
      normal: [0, -1, 0],
      sizeU: ROOM.width,
      sizeV: edgeBand,
      thickness,
      edgeNoise: true,
    },
  )

  return mergePointClouds(
    planes.map((plane) => buildScannedPlane(plane, quality)),
  )
}

export function buildSecondStationPlatformCloud(
  quality: PointCloudQuality,
): PointCloudData {
  const config = SECOND_STATION_POINT_CLOUD_CONFIG
  const total = Math.round(config[quality].pointCount * config.platformPointShare)
  const topCount = Math.round(total * config.platformTopShare)
  const boxCount = total - topCount
  const sideCounts = distribute(boxCount, config.platformBoxDistribution)
  const width = PLATFORM.radius * config.platformWidthScale
  const depth = width
  const halfWidth = width / 2
  const halfDepth = depth / 2
  const halfHeight = PLATFORM.height / 2
  const thickness = config.surfaceThickness
  const seed = config.seed + 100
  const planes: ScannedPlaneSpec[] = [
    {
      seed: seed + 1,
      count: sideCounts[0],
      center: [halfWidth, PLATFORM.y, 0],
      axisU: [0, 0, 1],
      axisV: [0, 1, 0],
      normal: [1, 0, 0],
      sizeU: depth,
      sizeV: PLATFORM.height,
      thickness,
      edgeNoise: true,
    },
    {
      seed: seed + 2,
      count: sideCounts[1],
      center: [-halfWidth, PLATFORM.y, 0],
      axisU: [0, 0, 1],
      axisV: [0, 1, 0],
      normal: [-1, 0, 0],
      sizeU: depth,
      sizeV: PLATFORM.height,
      thickness,
      edgeNoise: true,
    },
    {
      seed: seed + 3,
      count: sideCounts[2],
      center: [0, PLATFORM.y, halfDepth],
      axisU: [1, 0, 0],
      axisV: [0, 1, 0],
      normal: [0, 0, 1],
      sizeU: width,
      sizeV: PLATFORM.height,
      thickness,
      edgeNoise: true,
    },
    {
      seed: seed + 4,
      count: sideCounts[3],
      center: [0, PLATFORM.y, -halfDepth],
      axisU: [1, 0, 0],
      axisV: [0, 1, 0],
      normal: [0, 0, -1],
      sizeU: width,
      sizeV: PLATFORM.height,
      thickness,
      edgeNoise: true,
    },
    {
      seed: seed + 5,
      count: sideCounts[4],
      center: [0, PLATFORM.y - halfHeight, 0],
      axisU: [1, 0, 0],
      axisV: [0, 0, 1],
      normal: [0, -1, 0],
      sizeU: width,
      sizeV: depth,
      thickness,
      edgeNoise: true,
    },
    {
      seed: seed + 6,
      count: topCount,
      center: [0, PLATFORM.y + halfHeight + config.platformTopOffset, 0],
      axisU: [1, 0, 0],
      axisV: [0, 0, 1],
      normal: [0, 1, 0],
      sizeU: width,
      sizeV: depth,
      thickness,
      edgeNoise: true,
    },
  ]

  return mergePointClouds(
    planes.map((plane) => buildScannedPlane(plane, quality)),
  )
}
