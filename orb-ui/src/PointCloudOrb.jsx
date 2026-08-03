import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import './PointCloudOrb.css'

const ORB_RADIUS = 1.42
const SPHERE_COUNT = 5200
const AUTO_ROTATE_Y = 0.0014
const AUTO_ROTATE_X = 0.0005

const WEB_LAYERS = [
  { count: 1000, clusters: 54, rMin: 1.08, rMax: 1.38, spread: 0.42, radialSpread: 0.06, size: 0.025, breathe: 0.75 },
  { count: 1900, clusters: 90, rMin: 1.32, rMax: 2.02, spread: 0.54, radialSpread: 0.1, size: 0.028, breathe: 1 },
  { count: 1100, clusters: 64, rMin: 1.7, rMax: 2.7, spread: 0.66, radialSpread: 0.12, size: 0.021, breathe: 1.1 },
]

const PALETTE = {
  lavenderGrey: new THREE.Color(0x7a8baa),
  rosyGranite: new THREE.Color(0xa39897),
  mauveBark: new THREE.Color(0x745452),
  chocolatePlum: new THREE.Color(0x5a4547),
  deepTeal: new THREE.Color(0x497b75),
  lilacAsh: new THREE.Color(0xa89fa7),
  alabasterGrey: new THREE.Color(0xe4e3e1),
  rosyGranite2: new THREE.Color(0x8d929a),
  scanGrey: new THREE.Color(0x8a939c),
  scanWhite: new THREE.Color(0xd8dde2),
}

function createSpriteTexture() {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

function randomUnit(out = new THREE.Vector3()) {
  const t = Math.random() * Math.PI * 2
  const p = Math.acos(2 * Math.random() - 1)
  out.set(Math.sin(p) * Math.cos(t), Math.cos(p), Math.sin(p) * Math.sin(t))
  return out
}

function pickColor(mix, brightness = 1, mode = 'orb') {
  const c = new THREE.Color()
  if (mode === 'scan') {
    c.lerpColors(PALETTE.scanGrey, PALETTE.scanWhite, mix)
  } else if (mode === 'bright') {
    c.lerpColors(PALETTE.lilacAsh, PALETTE.alabasterGrey, mix)
  } else {
    if (mix < 0.2) c.lerpColors(PALETTE.chocolatePlum, PALETTE.mauveBark, mix / 0.2)
    else if (mix < 0.45) c.lerpColors(PALETTE.mauveBark, PALETTE.deepTeal, (mix - 0.2) / 0.25)
    else if (mix < 0.65) c.lerpColors(PALETTE.deepTeal, PALETTE.lavenderGrey, (mix - 0.45) / 0.2)
    else if (mix < 0.82) c.lerpColors(PALETTE.lavenderGrey, PALETTE.lilacAsh, (mix - 0.65) / 0.17)
    else c.lerpColors(PALETTE.lilacAsh, PALETTE.alabasterGrey, (mix - 0.82) / 0.18)
    c.lerp(PALETTE.rosyGranite2, (Math.random() - 0.5) * 0.08)
  }
  c.multiplyScalar(brightness)
  return c
}

function fillSphere(count) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const dir = randomUnit()
    const r = ORB_RADIUS * Math.cbrt(Math.random())
    const i3 = i * 3
    positions[i3] = dir.x * r
    positions[i3 + 1] = dir.y * r
    positions[i3 + 2] = dir.z * r

    const radialT = r / ORB_RADIUS
    const mix = 0.15 + radialT * 0.55 + (Math.random() - 0.5) * 0.12
    const col = pickColor(mix, 1.25 + (1 - radialT) * 0.2)
    colors[i3] = col.r
    colors[i3 + 1] = col.g
    colors[i3 + 2] = col.b
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return geo
}

function buildTangentFrame(normal, tangent, bitangent) {
  const up = Math.abs(normal.y) > 0.88 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)
  tangent.crossVectors(normal, up).normalize()
  bitangent.crossVectors(normal, tangent).normalize()
}

function createClusterParticle(layer, cx, cy, cz, normal) {
  const tangent = new THREE.Vector3()
  const bitangent = new THREE.Vector3()
  buildTangentFrame(normal, tangent, bitangent)

  const spread = layer.spread * (0.35 + Math.random() * 0.65)
  const tu = (Math.random() - 0.5) * 2
  const tv = (Math.random() - 0.5) * 2
  const radial = (Math.random() - 0.5) * layer.radialSpread

  return {
    homeX: cx + tangent.x * tu * spread + bitangent.x * tv * spread + normal.x * radial,
    homeY: cy + tangent.y * tu * spread + bitangent.y * tv * spread + normal.y * radial,
    homeZ: cz + tangent.z * tu * spread + bitangent.z * tv * spread + normal.z * radial,
    tx: tangent.x,
    ty: tangent.y,
    tz: tangent.z,
    bx: bitangent.x,
    by: bitangent.y,
    bz: bitangent.z,
    curl: 0.025 + Math.random() * 0.08,
    phase1: Math.random() * Math.PI * 2,
    phase2: Math.random() * Math.PI * 2,
    f1: 0.00012 + Math.random() * 0.00018,
    breathe: layer.breathe,
    colorMix: 0.5 + Math.random() * 0.48,
    x: 0,
    y: 0,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
  }
}

function buildWebLayer(layer) {
  const particles = []
  const perCluster = Math.max(4, Math.floor(layer.count / layer.clusters))

  for (let c = 0; c < layer.clusters && particles.length < layer.count; c++) {
    const normal = randomUnit()
    const r = layer.rMin + Math.random() * (layer.rMax - layer.rMin)
    for (let j = 0; j < perCluster && particles.length < layer.count; j++) {
      const p = createClusterParticle(layer, normal.x * r, normal.y * r, normal.z * r, normal)
      p.x = p.homeX
      p.y = p.homeY
      p.z = p.homeZ
      particles.push(p)
    }
  }

  while (particles.length < layer.count) {
    const normal = randomUnit()
    const r = layer.rMin + Math.random() * (layer.rMax - layer.rMin)
    const p = createClusterParticle(layer, normal.x * r, normal.y * r, normal.z * r, normal)
    p.x = p.homeX
    p.y = p.homeY
    p.z = p.homeZ
    particles.push(p)
  }

  const positions = new Float32Array(particles.length * 3)
  const colors = new Float32Array(particles.length * 3)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return { geo, particles }
}

function updateClusterParticle(p, timeMs, globalEbb, layerFlow) {
  const sway =
    Math.sin(timeMs * p.f1 + p.phase1) * p.curl +
    Math.cos(timeMs * p.f1 * 0.62 + p.phase2 + layerFlow) * p.curl * 0.48
  const breathe = 1 + (globalEbb - 0.5) * 0.07 * p.breathe
  const targetX = p.homeX * breathe + p.tx * sway + p.bx * sway * 0.7
  const targetY = p.homeY * breathe + p.ty * sway + p.by * sway * 0.7
  const targetZ = p.homeZ * breathe + p.tz * sway + p.bz * sway * 0.7
  const visc = 0.011
  p.vx += (targetX - p.x) * visc
  p.vy += (targetY - p.y) * visc
  p.vz += (targetZ - p.z) * visc
  p.vx *= 0.958
  p.vy *= 0.958
  p.vz *= 0.958
  p.x += p.vx
  p.y += p.vy
  p.z += p.vz
}

/** img-03: sparse outer haze, biased to one side for counterweight */
function buildAsymmetricHaze(count) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  let written = 0

  while (written < count) {
    const dir = randomUnit()
    if (dir.x + dir.y * 0.4 < 0 && Math.random() > 0.25) continue
    const r = ORB_RADIUS * (1.55 + Math.random() * 1.35)
    const i3 = written * 3
    positions[i3] = dir.x * r + 0.35
    positions[i3 + 1] = dir.y * r + 0.15
    positions[i3 + 2] = dir.z * r
    const mix = 0.35 + Math.random() * 0.55
    const col = pickColor(mix, 0.22 + Math.random() * 0.18, 'scan')
    colors[i3] = col.r
    colors[i3 + 1] = col.g
    colors[i3 + 2] = col.b
    written++
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return geo
}

/** img-07: brighter notes as points only, clustered off-axis */
function buildBrightNotes(count) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const bias = new THREE.Vector3(-0.4, 0.55, 0.25).normalize()

  for (let i = 0; i < count; i++) {
    const dir = randomUnit()
    if (dir.dot(bias) < 0.15 && Math.random() > 0.3) {
      dir.add(bias).normalize()
    }
    const r = ORB_RADIUS * (1.05 + Math.random() * 0.55)
    const i3 = i * 3
    positions[i3] = dir.x * r
    positions[i3 + 1] = dir.y * r
    positions[i3 + 2] = dir.z * r
    const col = pickColor(0.75 + Math.random() * 0.2, 1.35 + Math.random() * 0.25, 'bright')
    colors[i3] = col.r
    colors[i3 + 1] = col.g
    colors[i3 + 2] = col.b
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return geo
}

/** img-14: offset depth field — elliptical veil, not concentric stack */
function buildOffsetVeil(count) {
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  const center = new THREE.Vector3(0.45, -0.25, 0.35)
  const radii = new THREE.Vector3(2.1, 1.5, 1.8)

  for (let i = 0; i < count; i++) {
    const dir = randomUnit()
    const t = 0.55 + Math.random() * 0.45
    const x = center.x + dir.x * radii.x * t
    const y = center.y + dir.y * radii.y * t
    const z = center.z + dir.z * radii.z * t
    const i3 = i * 3
    positions[i3] = x
    positions[i3 + 1] = y
    positions[i3 + 2] = z
    const fade = 1 - t
    const col = pickColor(0.55 + fade * 0.35, 0.2 + fade * 0.22, 'scan')
    colors[i3] = col.r
    colors[i3 + 1] = col.g
    colors[i3 + 2] = col.b
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return geo
}

/** compositional grid: tilted, off-center, static against rotating orb */
function buildTensionGrid() {
  const group = new THREE.Group()
  group.position.set(1.35, -1.45, -0.85)
  group.rotation.set(-1.05, 0.22, 0.38)

  const grid = new THREE.GridHelper(7, 14, 0x556068, 0x1a1e22)
  grid.material.transparent = true
  grid.material.opacity = 0.055
  group.add(grid)

  return group
}

function makePoints(geo, sprite, size) {
  return new THREE.Points(
    geo,
    new THREE.PointsMaterial({
      size,
      map: sprite ?? undefined,
      alphaTest: 0.5,
      transparent: true,
      vertexColors: true,
      sizeAttenuation: true,
      depthWrite: true,
      blending: THREE.NormalBlending,
      opacity: 1,
    }),
  )
}

export default function PointCloudOrb() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.01, 100)
    camera.position.set(0, 0, 3.8)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setClearColor(0x000000, 1)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.0
    container.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.06
    controls.enablePan = false
    controls.zoomSpeed = 1.1
    controls.minDistance = 0.25
    controls.maxDistance = 14
    controls.rotateSpeed = 0.85

    scene.add(buildTensionGrid())

    const cloudGroup = new THREE.Group()
    cloudGroup.rotation.z = Math.PI / 2
    scene.add(cloudGroup)

    const sprite = createSpriteTexture()

    const veilGeo = buildOffsetVeil(380)
    const veilPoints = makePoints(veilGeo, sprite, 0.014)
    cloudGroup.add(veilPoints)

    const hazeGeo = buildAsymmetricHaze(320)
    const hazePoints = makePoints(hazeGeo, sprite, 0.012)
    cloudGroup.add(hazePoints)

    const webLayers = WEB_LAYERS.map((layer) => {
      const { geo, particles } = buildWebLayer(layer)
      const points = makePoints(geo, sprite, layer.size)
      cloudGroup.add(points)
      return { geo, particles, mat: points.material }
    })

    const sphereGeo = fillSphere(SPHERE_COUNT)
    const orbPoints = makePoints(sphereGeo, sprite, 0.034)
    cloudGroup.add(orbPoints)

    const notesGeo = buildBrightNotes(18)
    const notesPoints = makePoints(notesGeo, sprite, 0.048)
    cloudGroup.add(notesPoints)

    let userInteracting = false
    let resumeTimer = 0
    controls.addEventListener('start', () => {
      userInteracting = true
      window.clearTimeout(resumeTimer)
    })
    controls.addEventListener('end', () => {
      resumeTimer = window.setTimeout(() => {
        userInteracting = false
      }, 1200)
    })

    const resize = () => {
      const w = container.clientWidth
      const h = container.clientHeight
      if (!w || !h) return
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    }
    resize()
    window.addEventListener('resize', resize)

    const clock = new THREE.Clock()
    let rafId = 0

    const animate = () => {
      rafId = requestAnimationFrame(animate)
      const time = clock.getElapsedTime() * 1000
      const globalEbb = Math.sin(time * 0.00022) * 0.5 + 0.5
      const layerFlows = [0, 1.1, 2.3]

      if (!userInteracting) {
        cloudGroup.rotation.y += AUTO_ROTATE_Y
        cloudGroup.rotation.x += AUTO_ROTATE_X
      }

      for (let li = 0; li < webLayers.length; li++) {
        const { geo, particles } = webLayers[li]
        const layerFlow = Math.sin(time * 0.00017 + layerFlows[li]) * 0.5 + 0.5
        const pos = geo.attributes.position
        const col = geo.attributes.color

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i]
          updateClusterParticle(p, time, globalEbb, layerFlow)
          const i3 = i * 3
          pos.array[i3] = p.x
          pos.array[i3 + 1] = p.y
          pos.array[i3 + 2] = p.z
          const dist = Math.hypot(p.x, p.y, p.z)
          const distT = THREE.MathUtils.clamp((dist - ORB_RADIUS) / 2.4, 0, 1)
          const mix = p.colorMix * 0.5 + distT * 0.42 + li * 0.04
          const layerBright = [0.88, 1, 0.72][li] ?? 1
          const c = pickColor(mix, (1.05 + distT * 0.4) * layerBright)
          col.array[i3] = c.r
          col.array[i3 + 1] = c.g
          col.array[i3 + 2] = c.b
        }
        pos.needsUpdate = true
        col.needsUpdate = true
      }

      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(rafId)
      window.clearTimeout(resumeTimer)
      controls.dispose()
      window.removeEventListener('resize', resize)
      container.removeChild(renderer.domElement)
      sphereGeo.dispose()
      orbPoints.material.dispose()
      veilGeo.dispose()
      veilPoints.material.dispose()
      hazeGeo.dispose()
      hazePoints.material.dispose()
      notesGeo.dispose()
      notesPoints.material.dispose()
      for (const layer of webLayers) {
        layer.geo.dispose()
        layer.mat.dispose()
      }
      sprite?.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="point-cloud-orb"
      aria-label="Interactive point cloud. Drag to rotate, scroll to zoom."
    />
  )
}
