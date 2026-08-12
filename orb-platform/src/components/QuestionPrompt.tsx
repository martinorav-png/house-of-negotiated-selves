import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ROOM } from '../config'
import { drawGrainyText } from '../lib/grainyText'
import { settings } from '../dev/settingsStore'

// Drift mask updates slowly; 8 fps is enough with cached glyph layers.
const REDRAW_INTERVAL = 1 / 8
const _color = new THREE.Color()
const _smudgeColor = new THREE.Color()

/**
 * The rotating prompt, shown as plain glowing text floating above the orb —
 * no CRT panel, no liquid-mirror surface, no spill lighting. Fades in slowly
 * as a whole rather than typing itself out character by character. The
 * smudge mask drifts continuously (each cell eases toward its next value
 * rather than jumping to a fresh random one), so it reads as a slow, calm
 * boil instead of the jarring reshuffle an earlier version had.
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
  const lastDraw = useRef(-1)

  const { canvas, ctx, texture } = useMemo(() => {
    const canvas = document.createElement('canvas')
    // ~0.7× prior pixels — still sharp on a ~7.3m world plane at typical DPR.
    canvas.width = 1536
    canvas.height = 336
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

  const draw = (t: number) => {
    const s = settings.text
    _color.set(s.color)
    _smudgeColor.set(s.smudgeColor)
    drawGrainyText(ctx, canvas, currentText.current, {
      fontPx: s.fontPx,
      // Thin base letterform — the smudge is what gives it mass, not the font.
      weight: 350,
      maxWidthPx: canvas.width * 0.92,
      shade: 200,
      shadeVariance: 40,
      color: [_color.r, _color.g, _color.b],
      smudgeColor: [_smudgeColor.r, _smudgeColor.g, _smudgeColor.b],
      crispAlpha: s.crispAlpha,
      // Present but restrained, and hugging the crisp letters closely
      // rather than reading as a separate, offset layer.
      smudgeAlpha: s.smudgeAlpha,
      smudgeWeight: s.smudgeWeight,
      smudgeBoost: s.smudgeBoost,
      smudgeBlurPx: s.smudgeBlurPx,
      smudgeCellsX: 12,
      smudgeCellsY: 4,
      smudgeContrast: s.smudgeContrast,
      smudgeFloor: s.smudgeFloor,
      smudgeDriftTime: t,
      smudgeDriftPeriod: s.driftPeriod,
      grain: s.grain,
      edgeFade: s.edgeFade,
    })
    texture.needsUpdate = true
  }

  // New question: reset the fade; force an immediate redraw next frame.
  useEffect(() => {
    currentText.current = questionText.toUpperCase()
    fadeStart.current = -1
    fadeIn.current = 0
    material.opacity = 0
    lastDraw.current = -1
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionText, submitSerial])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    if (fadeStart.current === -1) fadeStart.current = t

    // Slow, deliberate fade — several seconds, not a snap-in.
    const d = Math.min(delta, 0.05)
    fadeIn.current = THREE.MathUtils.damp(fadeIn.current, 1, settings.text.fadeSpeed, d)
    material.opacity = fadeIn.current

    if (t - lastDraw.current >= REDRAW_INTERVAL) {
      lastDraw.current = t
      draw(t)
    }

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
