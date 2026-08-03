import * as THREE from 'three'

export type PointCloudData = {
  positions: Float32Array
  normals: Float32Array
  seeds: Float32Array
  sizes: Float32Array
  brightness: Float32Array
  visibility: Float32Array
  displace: Float32Array
  count: number
}

function hash(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453
  return x - Math.floor(x)
}

/** Stable pseudo-random from index + salt */
export function rand(i: number, salt = 0) {
  return hash(i * 12.9898 + salt * 78.233)
}

type SampleOpts = {
  count: number
  /** 0–1 keep probability before cluster holes */
  keepChance?: number
  /** fraction of points removed as missing clusters */
  holeFraction?: number
  sizeMin?: number
  sizeMax?: number
  brightnessMin?: number
  brightnessMax?: number
  displaceMin?: number
  displaceMax?: number
  /** optional reject / density weight — return 0 to skip */
  weight?: (x: number, y: number, z: number, i: number) => number
}

/**
 * Sample points on an axis-aligned plane centred at `center`, spanning `sizeX` × `sizeZ`
 * in local UV (u,v ∈ [-0.5,0.5]). `normal` faces outward.
 */
export function samplePlane(
  center: THREE.Vector3,
  axisU: THREE.Vector3,
  axisV: THREE.Vector3,
  sizeU: number,
  sizeV: number,
  normal: THREE.Vector3,
  opts: SampleOpts,
): PointCloudData {
  const {
    count,
    keepChance = 0.92,
    holeFraction = 0.08,
    sizeMin = 1.2,
    sizeMax = 2.8,
    brightnessMin = 0.35,
    brightnessMax = 1,
    displaceMin = 0.002,
    displaceMax = 0.018,
    weight,
  } = opts

  const tmp: number[] = []
  const nrm: number[] = []
  const seeds: number[] = []
  const sizes: number[] = []
  const bright: number[] = []
  const vis: number[] = []
  const disp: number[] = []

  // Precompute a few hole centers in UV space
  const holes: { u: number; v: number; r: number }[] = []
  const holeCount = Math.max(2, Math.floor(count * holeFraction * 0.04))
  for (let h = 0; h < holeCount; h++) {
    holes.push({
      u: rand(h, 1) - 0.5,
      v: rand(h, 2) - 0.5,
      r: 0.04 + rand(h, 3) * 0.1,
    })
  }

  let attempts = 0
  let kept = 0
  const maxAttempts = count * 4

  while (kept < count && attempts < maxAttempts) {
    attempts++
    const i = attempts
    const u = rand(i, 10) - 0.5
    const v = rand(i, 11) - 0.5

    // Edge sparsity
    const edge = Math.max(Math.abs(u), Math.abs(v)) * 2
    const edgeKeep = 1 - Math.pow(edge, 1.6) * 0.45
    if (rand(i, 12) > keepChance * edgeKeep) continue

    let inHole = false
    for (const hole of holes) {
      const du = u - hole.u
      const dv = v - hole.v
      if (du * du + dv * dv < hole.r * hole.r && rand(i, 13) > 0.15) {
        inHole = true
        break
      }
    }
    if (inHole) continue

    const x = center.x + axisU.x * u * sizeU + axisV.x * v * sizeV
    const y = center.y + axisU.y * u * sizeU + axisV.y * v * sizeV
    const z = center.z + axisU.z * u * sizeU + axisV.z * v * sizeV

    // Depth noise along normal
    const noise = (rand(i, 14) - 0.5) * 0.04
    const px = x + normal.x * noise
    const py = y + normal.y * noise
    const pz = z + normal.z * noise

    if (weight) {
      const w = weight(px, py, pz, i)
      if (rand(i, 15) > w) continue
    }

    tmp.push(px, py, pz)
    nrm.push(normal.x, normal.y, normal.z)
    seeds.push(rand(i, 16))
    sizes.push(sizeMin + rand(i, 17) * (sizeMax - sizeMin))
    bright.push(brightnessMin + rand(i, 18) * (brightnessMax - brightnessMin))
    vis.push(0.55 + rand(i, 19) * 0.45)
    disp.push(displaceMin + rand(i, 20) * (displaceMax - displaceMin))
    kept++
  }

  return toData(tmp, nrm, seeds, sizes, bright, vis, disp)
}

/** Sample points on a box surface (all 6 faces), denser on top. */
export function sampleBoxSurface(
  center: THREE.Vector3,
  width: number,
  height: number,
  depth: number,
  opts: SampleOpts & { topBias?: number },
): PointCloudData {
  const topBias = opts.topBias ?? 0.45
  const faceCounts = [
    Math.floor(opts.count * topBias), // top
    Math.floor(opts.count * 0.12), // bottom
    Math.floor(opts.count * 0.12), // +z
    Math.floor(opts.count * 0.12), // -z
    Math.floor(opts.count * 0.095), // +x
    0, // -x remainder
  ]
  faceCounts[5] = opts.count - faceCounts.slice(0, 5).reduce((a, b) => a + b, 0)

  const hx = width / 2
  const hy = height / 2
  const hz = depth / 2
  const parts: PointCloudData[] = []

  const faces: {
    c: THREE.Vector3
    u: THREE.Vector3
    v: THREE.Vector3
    su: number
    sv: number
    n: THREE.Vector3
    nPts: number
  }[] = [
    {
      c: new THREE.Vector3(center.x, center.y + hy, center.z),
      u: new THREE.Vector3(1, 0, 0),
      v: new THREE.Vector3(0, 0, 1),
      su: width,
      sv: depth,
      n: new THREE.Vector3(0, 1, 0),
      nPts: faceCounts[0],
    },
    {
      c: new THREE.Vector3(center.x, center.y - hy, center.z),
      u: new THREE.Vector3(1, 0, 0),
      v: new THREE.Vector3(0, 0, 1),
      su: width,
      sv: depth,
      n: new THREE.Vector3(0, -1, 0),
      nPts: faceCounts[1],
    },
    {
      c: new THREE.Vector3(center.x, center.y, center.z + hz),
      u: new THREE.Vector3(1, 0, 0),
      v: new THREE.Vector3(0, 1, 0),
      su: width,
      sv: height,
      n: new THREE.Vector3(0, 0, 1),
      nPts: faceCounts[2],
    },
    {
      c: new THREE.Vector3(center.x, center.y, center.z - hz),
      u: new THREE.Vector3(1, 0, 0),
      v: new THREE.Vector3(0, 1, 0),
      su: width,
      sv: height,
      n: new THREE.Vector3(0, 0, -1),
      nPts: faceCounts[3],
    },
    {
      c: new THREE.Vector3(center.x + hx, center.y, center.z),
      u: new THREE.Vector3(0, 0, 1),
      v: new THREE.Vector3(0, 1, 0),
      su: depth,
      sv: height,
      n: new THREE.Vector3(1, 0, 0),
      nPts: faceCounts[4],
    },
    {
      c: new THREE.Vector3(center.x - hx, center.y, center.z),
      u: new THREE.Vector3(0, 0, 1),
      v: new THREE.Vector3(0, 1, 0),
      su: depth,
      sv: height,
      n: new THREE.Vector3(-1, 0, 0),
      nPts: faceCounts[5],
    },
  ]

  for (const f of faces) {
    if (f.nPts <= 0) continue
    parts.push(
      samplePlane(f.c, f.u, f.v, f.su, f.sv, f.n, {
        ...opts,
        count: f.nPts,
      }),
    )
  }

  return mergePointClouds(parts)
}

/** Disk / cylinder top + rim sampling for platform accent. */
export function sampleDisk(
  center: THREE.Vector3,
  radius: number,
  opts: SampleOpts & { ringBias?: boolean },
): PointCloudData {
  const {
    count,
    keepChance = 0.9,
    sizeMin = 1.4,
    sizeMax = 3.2,
    brightnessMin = 0.4,
    brightnessMax = 1.1,
    displaceMin = 0.002,
    displaceMax = 0.02,
    ringBias = true,
  } = opts

  const tmp: number[] = []
  const nrm: number[] = []
  const seeds: number[] = []
  const sizes: number[] = []
  const bright: number[] = []
  const vis: number[] = []
  const disp: number[] = []

  let kept = 0
  let i = 0
  while (kept < count && i < count * 5) {
    i++
    const a = rand(i, 30) * Math.PI * 2
    // Prefer concentric rings (scan layers)
    let rNorm = Math.sqrt(rand(i, 31))
    if (ringBias) {
      const ring = Math.floor(rand(i, 32) * 6) / 6
      rNorm = THREE.MathUtils.lerp(rNorm, ring, 0.55)
    }
    // Denser near center (under orb)
    if (rNorm > 0.35 && rand(i, 33) > 0.55) continue
    if (rand(i, 34) > keepChance * (1.1 - rNorm * 0.5)) continue

    const r = rNorm * radius
    const x = center.x + Math.cos(a) * r
    const z = center.z + Math.sin(a) * r
    const y = center.y + (rand(i, 35) - 0.5) * 0.03

    tmp.push(x, y, z)
    nrm.push(0, 1, 0)
    seeds.push(rand(i, 36))
    sizes.push(sizeMin + rand(i, 37) * (sizeMax - sizeMin))
    // Brighter near center
    const b =
      brightnessMin +
      (1 - rNorm) * 0.45 +
      rand(i, 38) * (brightnessMax - brightnessMin) * 0.5
    bright.push(b)
    vis.push(0.5 + rand(i, 39) * 0.5)
    disp.push(displaceMin + rand(i, 40) * (displaceMax - displaceMin))
    kept++
  }

  return toData(tmp, nrm, seeds, sizes, bright, vis, disp)
}

/** Spherical shell + volume fill for the orb. */
export function sampleSphere(
  radius: number,
  opts: {
    shellCount: number
    volumeCount: number
    haloCount: number
  },
): PointCloudData {
  const tmp: number[] = []
  const nrm: number[] = []
  const seeds: number[] = []
  const sizes: number[] = []
  const bright: number[] = []
  const vis: number[] = []
  const disp: number[] = []

  const pushPoint = (
    x: number,
    y: number,
    z: number,
    nx: number,
    ny: number,
    nz: number,
    i: number,
    sizeMin: number,
    sizeMax: number,
    bMin: number,
    bMax: number,
    dMin: number,
    dMax: number,
    visBase: number,
  ) => {
    // Surface gaps
    if (rand(i, 50) < 0.06) return false
    tmp.push(x, y, z)
    nrm.push(nx, ny, nz)
    seeds.push(rand(i, 51))
    sizes.push(sizeMin + rand(i, 52) * (sizeMax - sizeMin))
    bright.push(bMin + rand(i, 53) * (bMax - bMin))
    vis.push(visBase + rand(i, 54) * (1 - visBase))
    disp.push(dMin + rand(i, 55) * (dMax - dMin))
    return true
  }

  // Outer shell
  let i = 0
  let kept = 0
  while (kept < opts.shellCount && i < opts.shellCount * 3) {
    i++
    const u = rand(i, 60)
    const v = rand(i, 61)
    const theta = 2 * Math.PI * u
    const phi = Math.acos(2 * v - 1)
    const jitter = 1 + (rand(i, 62) - 0.5) * 0.04
    const r = radius * jitter
    const x = r * Math.sin(phi) * Math.cos(theta)
    const y = r * Math.sin(phi) * Math.sin(theta)
    const z = r * Math.cos(phi)
    const len = Math.hypot(x, y, z) || 1
    if (
      pushPoint(
        x,
        y,
        z,
        x / len,
        y / len,
        z / len,
        i,
        1.2,
        2.2,
        0.32,
        0.58,
        0.004,
        0.028,
        0.55,
      )
    ) {
      kept++
    }
  }

  // Brighter inner concentration
  i = 0
  kept = 0
  while (kept < opts.volumeCount && i < opts.volumeCount * 3) {
    i++
    const u = rand(i, 70)
    const v = rand(i, 71)
    const theta = 2 * Math.PI * u
    const phi = Math.acos(2 * v - 1)
    const r = radius * Math.cbrt(rand(i, 72)) * 0.72
    const x = r * Math.sin(phi) * Math.cos(theta)
    const y = r * Math.sin(phi) * Math.sin(theta)
    const z = r * Math.cos(phi)
    const len = Math.hypot(x, y, z) || 1
    if (
      pushPoint(
        x,
        y,
        z,
        x / len,
        y / len,
        z / len,
        i + 10000,
        0.9,
        1.7,
        0.35,
        0.6,
        0.002,
        0.016,
        0.65,
      )
    ) {
      kept++
    }
  }

  // Sparse halo / drifting candidates
  i = 0
  kept = 0
  while (kept < opts.haloCount && i < opts.haloCount * 4) {
    i++
    const u = rand(i, 80)
    const v = rand(i, 81)
    const theta = 2 * Math.PI * u
    const phi = Math.acos(2 * v - 1)
    const r = radius * (1.05 + rand(i, 82) * 0.35)
    const x = r * Math.sin(phi) * Math.cos(theta)
    const y = r * Math.sin(phi) * Math.sin(theta)
    const z = r * Math.cos(phi)
    const len = Math.hypot(x, y, z) || 1
    if (
      pushPoint(
        x,
        y,
        z,
        x / len,
        y / len,
        z / len,
        i + 20000,
        0.9,
        1.8,
        0.28,
        0.55,
        0.02,
        0.08,
        0.4,
      )
    ) {
      kept++
    }
  }

  return toData(tmp, nrm, seeds, sizes, bright, vis, disp)
}

export function mergePointClouds(parts: PointCloudData[]): PointCloudData {
  let count = 0
  for (const p of parts) count += p.count
  const positions = new Float32Array(count * 3)
  const normals = new Float32Array(count * 3)
  const seeds = new Float32Array(count)
  const sizes = new Float32Array(count)
  const brightness = new Float32Array(count)
  const visibility = new Float32Array(count)
  const displace = new Float32Array(count)
  let o = 0
  for (const p of parts) {
    positions.set(p.positions, o * 3)
    normals.set(p.normals, o * 3)
    seeds.set(p.seeds, o)
    sizes.set(p.sizes, o)
    brightness.set(p.brightness, o)
    visibility.set(p.visibility, o)
    displace.set(p.displace, o)
    o += p.count
  }
  return { positions, normals, seeds, sizes, brightness, visibility, displace, count }
}

export function buildPointGeometry(data: PointCloudData): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(data.positions, 3))
  geo.setAttribute('aNormal', new THREE.BufferAttribute(data.normals, 3))
  geo.setAttribute('aSeed', new THREE.BufferAttribute(data.seeds, 1))
  geo.setAttribute('aSize', new THREE.BufferAttribute(data.sizes, 1))
  geo.setAttribute('aBrightness', new THREE.BufferAttribute(data.brightness, 1))
  geo.setAttribute('aVisibility', new THREE.BufferAttribute(data.visibility, 1))
  geo.setAttribute('aDisplace', new THREE.BufferAttribute(data.displace, 1))
  geo.computeBoundingSphere()
  return geo
}

function toData(
  tmp: number[],
  nrm: number[],
  seeds: number[],
  sizes: number[],
  bright: number[],
  vis: number[],
  disp: number[],
): PointCloudData {
  const count = seeds.length
  return {
    positions: new Float32Array(tmp),
    normals: new Float32Array(nrm),
    seeds: new Float32Array(seeds),
    sizes: new Float32Array(sizes),
    brightness: new Float32Array(bright),
    visibility: new Float32Array(vis),
    displace: new Float32Array(disp),
    count,
  }
}
