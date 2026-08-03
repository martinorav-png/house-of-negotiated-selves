import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PARTICLES, PALETTE, ORB } from '../config'
import {
  particlePointVertexShader,
  particlePointFragmentShader,
} from '../shaders/pointCloudShaders'

export type OrbParticlesHandle = {
  burst: () => void
}

type Particle = {
  active: boolean
  life: number
  maxLife: number
  vx: number
  vy: number
  vz: number
  spin: number
}

function createPool(count: number): Particle[] {
  return Array.from({ length: count }, () => ({
    active: false,
    life: 0,
    maxLife: PARTICLES.lifetime,
    vx: 0,
    vy: 0,
    vz: 0,
    spin: 0,
  }))
}

/**
 * Detached scan-data burst — Points + soft sprites (same language as the orb).
 * Pool reused; no per-particle React nodes.
 */
export const OrbParticles = forwardRef<OrbParticlesHandle, { count: number }>(
  function OrbParticles({ count }, ref) {
    const points = useRef<THREE.Points>(null)
    const pool = useRef<Particle[]>(createPool(count))
    const countRef = useRef(count)

    const positions = useRef(new Float32Array(count * 3))
    const sizes = useRef(new Float32Array(count))
    const alphas = useRef(new Float32Array(count))
    const colors = useRef(new Float32Array(count * 3))

    const baseColor = useMemo(() => new THREE.Color(PALETTE.orbAccent), [])
    const rimColor = useMemo(() => new THREE.Color(PALETTE.orbRim), [])
    const tmpColor = useMemo(() => new THREE.Color(), [])

    if (countRef.current !== count) {
      countRef.current = count
      pool.current = createPool(count)
      positions.current = new Float32Array(count * 3)
      sizes.current = new Float32Array(count)
      alphas.current = new Float32Array(count)
      colors.current = new Float32Array(count * 3)
    }

    const geometry = useMemo(() => {
      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(positions.current, 3))
      geo.setAttribute('aSize', new THREE.BufferAttribute(sizes.current, 1))
      geo.setAttribute('aAlpha', new THREE.BufferAttribute(alphas.current, 1))
      geo.setAttribute('aColor', new THREE.BufferAttribute(colors.current, 3))
      // Hide until first burst
      for (let i = 0; i < count; i++) {
        positions.current[i * 3 + 1] = -999
        sizes.current[i] = 0
        alphas.current[i] = 0
      }
      return geo
    }, [count])

    // Rebind attributes if buffers replaced
    useMemo(() => {
      geometry.setAttribute('position', new THREE.BufferAttribute(positions.current, 3))
      geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes.current, 1))
      geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas.current, 1))
      geometry.setAttribute('aColor', new THREE.BufferAttribute(colors.current, 3))
    }, [geometry, count])

    const material = useMemo(
      () =>
        new THREE.ShaderMaterial({
          vertexShader: particlePointVertexShader,
          fragmentShader: particlePointFragmentShader,
          uniforms: { uPointScale: { value: 1 } },
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
        }),
      [],
    )

    useImperativeHandle(ref, () => ({
      burst() {
        const particles = pool.current
        const n = countRef.current
        for (let i = 0; i < n; i++) {
          const p = particles[i]
          const u = Math.random()
          const v = Math.random()
          const theta = 2 * Math.PI * u
          const phi = Math.acos(2 * v - 1)
          const r = ORB.radius * (0.85 + Math.random() * 0.2)
          const x = r * Math.sin(phi) * Math.cos(theta)
          const y = r * Math.sin(phi) * Math.sin(theta)
          const z = r * Math.cos(phi)

          positions.current[i * 3] = x
          positions.current[i * 3 + 1] = y
          positions.current[i * 3 + 2] = z

          const speed =
            PARTICLES.speedMin +
            Math.random() * (PARTICLES.speedMax - PARTICLES.speedMin)
          const len = Math.hypot(x, y, z) || 1
          p.vx = (x / len) * speed
          p.vy = (y / len) * speed + 0.35
          p.vz = (z / len) * speed
          p.spin = (Math.random() - 0.5) * 4
          p.life = 0
          p.maxLife = PARTICLES.lifetime * (0.7 + Math.random() * 0.5)
          p.active = true
          alphas.current[i] = 1
          sizes.current[i] = PARTICLES.size
        }
        geometry.attributes.position.needsUpdate = true
      },
    }))

    useFrame((_, delta) => {
      const d = Math.min(delta, 0.05)
      const particles = pool.current
      const n = countRef.current
      let any = false

      for (let i = 0; i < n; i++) {
        const p = particles[i]
        const ix = i * 3
        if (!p.active) {
          alphas.current[i] = 0
          sizes.current[i] = 0
          continue
        }
        any = true
        p.life += d
        const t = p.life / p.maxLife
        if (t >= 1) {
          p.active = false
          alphas.current[i] = 0
          sizes.current[i] = 0
          continue
        }

        const px = positions.current[ix]
        const py = positions.current[ix + 1]
        const pz = positions.current[ix + 2]
        const ang = p.spin * d
        const cos = Math.cos(ang)
        const sin = Math.sin(ang)
        const rx = px * cos - pz * sin
        const rz = px * sin + pz * cos

        positions.current[ix] = rx + p.vx * d
        positions.current[ix + 1] = py + p.vy * d
        positions.current[ix + 2] = rz + p.vz * d

        p.vx *= 0.985
        p.vy *= 0.985
        p.vz *= 0.985
        p.vy -= 0.25 * d

        const fade = 1 - t
        alphas.current[i] = fade * fade
        sizes.current[i] = PARTICLES.size * fade * (0.7 + (1 - t) * 0.5)

        tmpColor.copy(baseColor).lerp(rimColor, t)
        colors.current[ix] = tmpColor.r
        colors.current[ix + 1] = tmpColor.g
        colors.current[ix + 2] = tmpColor.b
      }

      if (any || points.current) {
        geometry.attributes.position.needsUpdate = true
        geometry.attributes.aSize.needsUpdate = true
        geometry.attributes.aAlpha.needsUpdate = true
        geometry.attributes.aColor.needsUpdate = true
      }
    })

    return (
      <points
        ref={points}
        geometry={geometry}
        material={material}
        frustumCulled={false}
      />
    )
  },
)
