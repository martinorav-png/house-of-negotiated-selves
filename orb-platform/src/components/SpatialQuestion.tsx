import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { QUESTION } from '../config'
import { useOrbContext } from '../context/OrbContext'
import { scanUniforms } from '../lib/scanUniforms'
import { audioLevels } from '../lib/audioLevels'
import { drawGrainyText } from '../lib/grainyText'

const REDRAW_INTERVAL = 1 / 10

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
  canvas.width = 1280
  canvas.height = 160
  const ctx = canvas.getContext('2d')!
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.premultiplyAlpha = true

  const geometry = new THREE.PlaneGeometry(width, height, 32, 1)
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
  const lastRecess = useRef(Number.NaN)

  const answerPlane = useMemo(
    () => createTextPlane(QUESTION.answerMaxWidth, QUESTION.answerMaxWidth * (160 / 1280) * 0.92),
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
      const crispAlpha = Math.min(1, 0.75 + activity * 0.15 + answerFlash.current * 0.2)
      // Keep the cursor out of drawGrainyText so glyph-layer cache stays warm
      // across blinks (rebuilding blur+grain every blink is the expensive path).
      drawGrainyText(answerPlane.ctx, answerPlane.canvas, display, {
        fontPx: 56,
        weight: 400,
        maxWidthPx: answerPlane.canvas.width * 0.9,
        crispAlpha,
        smudgeAlpha: 0.3,
        smudgeBlurPx: 3,
        grain: 20,
      })
      if (cursorOn) {
        const { ctx, canvas } = answerPlane
        ctx.save()
        ctx.globalAlpha = crispAlpha
        ctx.fillStyle = '#ffffff'
        ctx.font = '400 56px "Helvetica Neue", Arial, sans-serif'
        const textW = display ? ctx.measureText(display).width : 0
        const maxW = canvas.width * 0.9
        const scale = textW > maxW && textW > 0 ? maxW / textW : 1
        ctx.font = `400 ${56 * scale}px "Helvetica Neue", Arial, sans-serif`
        const drawnW = display ? ctx.measureText(display).width : 0
        ctx.fillText('|', canvas.width / 2 + drawnW * 0.5 + 6 * scale, canvas.height / 2)
        ctx.restore()
      }
      answerPlane.texture.needsUpdate = true
    }

    const recess =
      QUESTION.arcRecess *
      (1 + audioLevels.bass * 0.12 * motion + Math.sin(t * 0.6) * 0.04 * motion) *
      0.92
    // Skip tiny recess deltas — computeVertexNormals is the costly part.
    if (!(Math.abs(recess - lastRecess.current) < 0.0008)) {
      lastRecess.current = recess
      bendPlane(
        answerPlane.geometry,
        answerPlane.basePositions,
        recess,
        QUESTION.answerMaxWidth,
      )
    }

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
