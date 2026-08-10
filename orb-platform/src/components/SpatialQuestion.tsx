import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { QUESTION } from '../config'
import { useOrbContext } from '../context/OrbContext'
import { scanUniforms } from '../lib/scanUniforms'
import { audioLevels } from '../lib/audioLevels'
import { drawGrainyText } from '../lib/grainyText'

const REDRAW_INTERVAL = 1 / 18

type SpatialQuestionProps = {
  answerText: string
  submitSerial: number
}

type TextPlane = {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  texture: THREE.CanvasTexture
  geometry: THREE.PlaneGeometry
  basePositions: Float32Array
  material: THREE.MeshBasicMaterial
}

function bendPlane(
  geometry: THREE.PlaneGeometry,
  base: Float32Array,
  recess: number,
  width: number = QUESTION.maxWidth,
) {
  const pos = geometry.attributes.position as THREE.BufferAttribute
  const halfW = width * 0.5
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

function createTextPlane(width: number, height: number): TextPlane {
  const canvas = document.createElement('canvas')
  canvas.width = 2048
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.premultiplyAlpha = true

  const geometry = new THREE.PlaneGeometry(width, height, 64, 1)
  const basePositions = new Float32Array(
    (geometry.attributes.position as THREE.BufferAttribute).array as Float32Array,
  )
  bendPlane(geometry, basePositions, QUESTION.arcRecess, width)

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  })

  return { canvas, ctx, texture, geometry, basePositions, material }
}

export function SpatialQuestion({ answerText, submitSerial }: SpatialQuestionProps) {
  const { reducedMotion } = useOrbContext()
  const group = useRef<THREE.Group>(null)
  const answerFlash = useRef(0)
  const lastSubmitSerial = useRef(submitSerial)
  const lastDraw = useRef(-1)

  const answerPlane = useMemo(
    () => createTextPlane(QUESTION.answerMaxWidth, QUESTION.answerMaxWidth * (256 / 2048) * 0.92),
    [],
  )

  useEffect(() => {
    return () => {
      answerPlane.texture.dispose()
      answerPlane.geometry.dispose()
      answerPlane.material.dispose()
    }
  }, [answerPlane])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const d = Math.min(delta, 0.05)
    const motion = reducedMotion ? 0.25 : 1
    if (submitSerial !== lastSubmitSerial.current) {
      lastSubmitSerial.current = submitSerial
      answerFlash.current = 1
    }
    answerFlash.current = THREE.MathUtils.damp(answerFlash.current, 0, 4.5, d)

    const activity = Math.min(
      1,
      scanUniforms.uHover.value * 0.35 +
        scanUniforms.uActivation.value * 0.45 +
        audioLevels.level * 0.4,
    )

    if (t - lastDraw.current >= REDRAW_INTERVAL) {
      lastDraw.current = t
      const cursorOn = Math.floor(t * 2.4) % 2 === 0
      const display = answerText.length > 0 ? answerText : ''
      const content = `${display}${cursorOn ? '|' : ''}`
      const crispAlpha = Math.min(1, 0.75 + activity * 0.15 + answerFlash.current * 0.2)
      drawGrainyText(answerPlane.ctx, answerPlane.canvas, content, {
        fontPx: 74,
        weight: 400,
        maxWidthPx: answerPlane.canvas.width * 0.9,
        crispAlpha,
        smudgeAlpha: 0.3,
        smudgeBlurPx: 3,
        grain: 20,
      })
      answerPlane.texture.needsUpdate = true
    }

    const recess =
      QUESTION.arcRecess *
      (1 + audioLevels.bass * 0.12 * motion + Math.sin(t * 0.6) * 0.04 * motion)
    bendPlane(
      answerPlane.geometry,
      answerPlane.basePositions,
      recess * 0.92,
      QUESTION.answerMaxWidth,
    )

    const bob = Math.sin(t * 0.7) * 0.01 * motion + audioLevels.bass * 0.012 * motion
    if (group.current) {
      group.current.position.y = QUESTION.position[1] + QUESTION.answerYOffset + bob
      group.current.position.x = QUESTION.position[0] + Math.sin(t * 0.35) * 0.008 * motion
    }
  })

  return (
    <group ref={group} position={QUESTION.position} rotation={QUESTION.rotation}>
      <mesh geometry={answerPlane.geometry} material={answerPlane.material} />
    </group>
  )
}
