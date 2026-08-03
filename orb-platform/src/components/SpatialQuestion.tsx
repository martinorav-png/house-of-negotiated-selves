import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { QUESTION, PALETTE } from '../config'
import { QUESTIONS } from '../lib/questions'
import { useOrbContext } from '../context/OrbContext'
import { scanUniforms } from '../lib/scanUniforms'
import { audioLevels } from '../lib/audioLevels'
import { drawGlitchedText, tickGlitch } from '../lib/textGlitch'

/**
 * Bend a plane so the center sits closest to the camera and the edges recede.
 */
function bendPlane(
  geometry: THREE.PlaneGeometry,
  base: Float32Array,
  recess: number,
) {
  const pos = geometry.attributes.position as THREE.BufferAttribute
  const halfW = QUESTION.maxWidth * 0.5
  for (let i = 0; i < pos.count; i++) {
    const x = base[i * 3]
    const y = base[i * 3 + 1]
    const t = halfW > 0 ? x / halfW : 0
    const z = -t * t * recess
    pos.setXYZ(i, x, y, z)
  }
  pos.needsUpdate = true
  geometry.computeVertexNormals()
}

/**
 * Spatial question as one bent plane — sentence stays a single typographic unit,
 * with intermittent glitch on the painted text.
 */
export function SpatialQuestion() {
  const { reducedMotion } = useOrbContext()
  const group = useRef<THREE.Group>(null)
  const mesh = useRef<THREE.Mesh>(null)
  const [index, setIndex] = useState(0)
  const opacity = useRef(1)
  const targetOpacity = useRef(1)
  const nextSwap = useRef(QUESTION.intervalMs / 1000)
  const displayOpacity = useRef(1)
  const glitchClock = useRef({ nextAt: 2.0, holdUntil: 0, seed: 0 })

  const { canvas, ctx, texture, geometry, basePositions, material } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 2048
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.premultiplyAlpha = true

    const geometry = new THREE.PlaneGeometry(
      QUESTION.maxWidth,
      QUESTION.maxWidth * (256 / 2048) * 1.15,
      64,
      1,
    )
    const basePositions = new Float32Array(
      (geometry.attributes.position as THREE.BufferAttribute).array as Float32Array,
    )
    bendPlane(geometry, basePositions, QUESTION.arcRecess)

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
      side: THREE.DoubleSide,
      color: new THREE.Color(PALETTE.orbCore),
    })

    return { canvas, ctx, texture, geometry, basePositions, material }
  }, [])

  useEffect(() => {
    return () => {
      texture.dispose()
      geometry.dispose()
      material.dispose()
    }
  }, [texture, geometry, material])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const d = Math.min(delta, 0.05)
    const motion = reducedMotion ? 0.25 : 1

    if (t >= nextSwap.current) {
      targetOpacity.current = 0
      if (opacity.current < 0.05) {
        setIndex((i) => (i + 1) % QUESTIONS.length)
        targetOpacity.current = 1
        nextSwap.current = t + QUESTION.intervalMs / 1000
        // Glitch sting on new question
        glitchClock.current.holdUntil = t + 0.18
        glitchClock.current.seed = Math.random()
      }
    }

    opacity.current = THREE.MathUtils.damp(
      opacity.current,
      targetOpacity.current,
      1000 / QUESTION.fadeMs,
      d,
    )

    const activity = Math.min(
      1,
      scanUniforms.uHover.value * 0.35 +
        scanUniforms.uActivation.value * 0.45 +
        audioLevels.level * 0.4,
    )

    displayOpacity.current = opacity.current * (0.75 + activity * 0.25)
    material.opacity = 1

    const g = tickGlitch(
      glitchClock.current,
      t,
      reducedMotion ? 0 : audioLevels.level * 0.55,
    )
    // Soften glitch when reduced motion
    if (reducedMotion) g.amount *= 0.25

    const rgb = new THREE.Color(PALETTE.orbCore)
    drawGlitchedText(ctx, canvas, QUESTIONS[index], {
      opacity: displayOpacity.current,
      color: `rgba(${Math.round(rgb.r * 255)}, ${Math.round(rgb.g * 255)}, ${Math.round(rgb.b * 255)}, ${displayOpacity.current})`,
      font: '600 64px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      glitch: g,
      clear: null,
    })
    texture.needsUpdate = true

    const recess =
      QUESTION.arcRecess *
      (1 + audioLevels.bass * 0.12 * motion + Math.sin(t * 0.6) * 0.04 * motion)
    bendPlane(geometry, basePositions, recess)

    const bob =
      Math.sin(t * 0.7) * 0.01 * motion + audioLevels.bass * 0.012 * motion
    if (group.current) {
      group.current.position.y = QUESTION.position[1] + bob
      group.current.position.x =
        QUESTION.position[0] +
        Math.sin(t * 0.35) * 0.008 * motion +
        (g.amount > 0.3 ? (Math.random() - 0.5) * 0.02 * g.amount : 0)
    }
  })

  return (
    <group
      ref={group}
      position={QUESTION.position}
      rotation={QUESTION.rotation}
    >
      <mesh ref={mesh} geometry={geometry} material={material} />
    </group>
  )
}
