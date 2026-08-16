import { useEffect, useMemo, useRef } from 'react'
import { drawGrainyText } from '../lib/grainyText'
import { mirrorSettings } from '../dev/mirrorSettingsStore'

const REDRAW_INTERVAL_MS = 1000 / 8
const FADE_IN_MS = 900
const CANVAS_WIDTH = 1000
const CANVAS_HEIGHT = 280

/**
 * DOM-canvas headline text using the same drawGrainyText treatment as the
 * Orb station's QuestionPrompt (crisp base + drifting smudge layer) — the
 * "same text styles as before" the Mirror station's copy should carry.
 * Plain <canvas> rather than a 3D mesh/texture since this station is a
 * flat screen-space UI, not a room you're looking into.
 */
export function MirrorHeadline({ lines, className }: { lines: string[]; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const text = useMemo(() => lines.join('\n').toUpperCase(), [lines])
  const fadeIn = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    let lastDraw = -1
    fadeIn.current = 0
    canvas.style.opacity = '0'
    const start = performance.now()

    const draw = (now: number) => {
      const s = mirrorSettings.text
      const t = (now - start) / 1000
      fadeIn.current = Math.min(1, (now - start) / FADE_IN_MS)
      canvas.style.opacity = String(fadeIn.current)

      if (lastDraw < 0 || now - lastDraw >= REDRAW_INTERVAL_MS) {
        lastDraw = now
        const parts = text.split('\n')
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
        const lineHeight = s.fontPx * 1.08
        const totalHeight = lineHeight * parts.length
        const startY = CANVAS_HEIGHT / 2 - totalHeight / 2 + lineHeight / 2
        parts.forEach((line, i) => {
          const lineCanvas = document.createElement('canvas')
          lineCanvas.width = CANVAS_WIDTH
          lineCanvas.height = lineHeight
          const lctx = lineCanvas.getContext('2d')!
          drawGrainyText(lctx, lineCanvas, line, {
            fontPx: s.fontPx,
            weight: 350,
            maxWidthPx: CANVAS_WIDTH * 0.94,
            shade: 200,
            shadeVariance: 40,
            color: hexToRgbUnit(s.color),
            smudgeColor: hexToRgbUnit(s.smudgeColor),
            crispAlpha: s.crispAlpha,
            smudgeAlpha: s.smudgeAlpha,
            smudgeWeight: s.smudgeWeight,
            smudgeBoost: s.smudgeBoost,
            smudgeBlurPx: s.smudgeBlurPx,
            smudgeCellsX: 10,
            smudgeCellsY: 3,
            smudgeContrast: s.smudgeContrast,
            smudgeFloor: s.smudgeFloor,
            smudgeDriftTime: t,
            smudgeDriftPeriod: s.driftPeriod,
            grain: s.grain,
            edgeFade: s.edgeFade,
          })
          ctx.drawImage(lineCanvas, 0, startY + i * lineHeight - lineHeight / 2)
        })
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [text])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{ transition: 'opacity 0.2s linear' }}
    />
  )
}

function hexToRgbUnit(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16) / 255
  const g = parseInt(clean.slice(2, 4), 16) / 255
  const b = parseInt(clean.slice(4, 6), 16) / 255
  return [r, g, b]
}
