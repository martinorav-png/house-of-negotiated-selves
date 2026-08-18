import { useEffect, useRef } from 'react'
import { useStationVibe } from '../hooks/useStationVibe'
import { normalizeCompanionHeight } from '../lib/mirrorLandmarks'

export function CompanionOutline({ height }: { height: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [vibe] = useStationVibe()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    const width = canvas.clientWidth
    const canvasHeight = canvas.clientHeight
    canvas.width = Math.round(width * ratio)
    canvas.height = Math.round(canvasHeight * ratio)
    context.scale(ratio, ratio)
    context.clearRect(0, 0, width, canvasHeight)

    const scale = normalizeCompanionHeight(height)
    const centerX = width / 2
    const baseY = canvasHeight * 0.9
    context.save()
    context.translate(centerX, baseY)
    context.scale(scale, scale)
    context.translate(-centerX, -baseY)
    context.strokeStyle = vibe === 'original' ? 'rgba(255, 255, 255, .92)' : 'rgba(255, 246, 235, .92)'
    context.lineWidth = 1.8
    context.beginPath()
    context.ellipse(centerX, canvasHeight * 0.28, width * 0.13, width * 0.16, 0, 0, Math.PI * 2)
    context.moveTo(centerX - width * 0.12, canvasHeight * 0.43)
    context.bezierCurveTo(
      centerX - width * 0.3,
      canvasHeight * 0.53,
      centerX - width * 0.34,
      canvasHeight * 0.76,
      centerX - width * 0.32,
      canvasHeight * 0.88,
    )
    context.moveTo(centerX + width * 0.12, canvasHeight * 0.43)
    context.bezierCurveTo(
      centerX + width * 0.3,
      canvasHeight * 0.53,
      centerX + width * 0.34,
      canvasHeight * 0.76,
      centerX + width * 0.32,
      canvasHeight * 0.88,
    )
    context.stroke()
    context.restore()
  }, [height, vibe])

  return <canvas ref={canvasRef} className="journey-companion-outline" aria-label="Companion silhouette" />
}
