import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ROOM } from '../config'
import { drawGrainyText } from '../lib/grainyText'

/**
 * The rotating prompt, shown as plain glowing text floating above the orb —
 * no CRT panel, no liquid-mirror surface, no spill lighting. Fades in slowly
 * as a whole rather than typing itself out character by character. Fully
 * static once drawn — an earlier version re-rolled the smudge pattern every
 * few seconds, but reshuffling its random blobs read as a jarring jump
 * rather than a drift, so it just draws once per question now.
 */
export function QuestionPrompt({
  questionText,
  submitSerial,
}: {
  questionText: string
  submitSerial: number
}) {
  const fadeStart = useRef(0)
  const fadeIn = useRef(0)
  const currentText = useRef('')
  const meshRef = useRef<THREE.Mesh>(null)

  const { canvas, ctx, texture } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 2200
    canvas.height = 480
    const ctx = canvas.getContext('2d')!
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.premultiplyAlpha = true
    return { canvas, ctx, texture }
  }, [])

  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    [texture],
  )

  useEffect(() => {
    return () => {
      texture.dispose()
      material.dispose()
    }
  }, [texture, material])

  const draw = () => {
    drawGrainyText(ctx, canvas, currentText.current, {
      fontPx: 128,
      // Thin base letterform — the smudge is what gives it mass, not the font.
      weight: 350,
      maxWidthPx: canvas.width * 0.92,
      // Blended into the wall rather than stark white — dimmer, warmer grey.
      shade: 200,
      shadeVariance: 40,
      tint: [0.95, 0.88, 0.78],
      crispAlpha: 0.75,
      // Present but restrained, and hugging the crisp letters closely
      // rather than reading as a separate, offset layer.
      smudgeAlpha: 0.45,
      smudgeWeight: 500,
      smudgeBoost: 1,
      smudgeBlurPx: 3,
      smudgeCellsX: 12,
      smudgeCellsY: 4,
      smudgeContrast: 150,
      smudgeFloor: 0.5,
      grain: 16,
      edgeFade: 0.3,
    })
    texture.needsUpdate = true
  }

  // New question: reset the fade and redraw once. The texture is static
  // from here — no periodic reshuffling.
  useEffect(() => {
    currentText.current = questionText.toUpperCase()
    draw()
    fadeStart.current = -1
    fadeIn.current = 0
    material.opacity = 0
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionText, submitSerial])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (fadeStart.current === -1) fadeStart.current = t

    // Slow, deliberate fade — several seconds, not a snap-in.
    const d = Math.min(delta, 0.05)
    fadeIn.current = THREE.MathUtils.damp(fadeIn.current, 1, 0.4, d)
    material.opacity = fadeIn.current

    // Barely-there drift — visible, but far too small to affect legibility.
    if (meshRef.current) {
      meshRef.current.position.x = Math.sin(t * 0.11) * 0.014
      meshRef.current.position.y = 3.3 + Math.sin(t * 0.07 + 1.7) * 0.01
    }
  })

  return (
    <mesh ref={meshRef} position={[0, 3.3, -ROOM.depth / 2 + 0.4]} material={material}>
      <planeGeometry args={[7.3, 1.59]} />
    </mesh>
  )
}
