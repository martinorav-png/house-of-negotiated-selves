import { useEffect, useRef, type CSSProperties } from 'react'
import { FaceLandmarker } from '@mediapipe/tasks-vision'
import { useMirrorCamera } from '../hooks/useMirrorCamera'
import type { MirrorFaceSignals } from '../lib/mirrorFaceSignals'
import { sampleFaceTopologyConnections } from '../lib/mirrorFaceTopology'
import {
  computeCameraFocus,
  mapLandmarkToMirror,
  type CameraFocusMode,
  type NormalizedLandmark,
} from '../lib/mirrorLandmarks'

export type MirrorOverlayMode = 'none' | 'face' | 'eyes' | 'dissolve'

const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365,
  379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234,
  127, 162, 21, 54, 103, 67, 109,
]
const LEFT_EYE = [33, 160, 158, 133, 153, 144]
const RIGHT_EYE = [362, 385, 387, 263, 373, 380]
const NOSE = [168, 6, 197, 195, 5, 4, 1]
const LIPS = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146]
const SPARSE_FACE_TOPOLOGY = sampleFaceTopologyConnections(
  FaceLandmarker.FACE_LANDMARKS_TESSELATION,
)

export function MirrorCameraLayer({ mode }: { mode: MirrorOverlayMode }) {
  const camera = useMirrorCamera()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const focusMode: CameraFocusMode = mode === 'eyes' ? 'eyes' : mode === 'none' ? 'full' : 'face'
  const focus = computeCameraFocus(camera.landmarks, focusMode)
  const focusX = clamp(focus.originX + camera.signals.headYaw * 2.8, 22, 78)
  const focusY = clamp(focus.originY + camera.signals.headPitch * 2.2, 22, 72)
  const style = {
    '--journey-focus-scale': focus.scale,
    '--journey-focus-x': `${focusX}%`,
    '--journey-focus-y': `${focusY}%`,
    '--journey-pose-x': `${camera.signals.headYaw * 8}px`,
    '--journey-pose-y': `${camera.signals.headPitch * 6}px`,
    '--journey-pose-roll': `${camera.signals.headRoll * 1.8}deg`,
    '--journey-tracking-glow': `${4 + camera.signals.browLift * 7}px`,
  } as CSSProperties

  useEffect(() => {
    const canvas = canvasRef.current
    const video = camera.videoRef.current
    if (!canvas || !video || mode === 'none') return

    const draw = () =>
      drawLandmarks(canvas, video, camera.landmarks, camera.signals, mode)
    draw()
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
  }, [camera.landmarks, camera.signals, camera.videoRef, mode])

  return (
    <div
      className={`journey-camera-stage journey-camera-${mode}${mode === 'dissolve' ? ' is-dissolving' : ''}`}
      style={style}
      aria-hidden="true"
    >
      <video ref={camera.videoRef} className="journey-camera-video" muted playsInline autoPlay />
      <div className="journey-camera-veil" />
      <canvas ref={canvasRef} className="journey-landmarks" />
      {camera.status !== 'active' ? (
        <div className="journey-camera-fallback">
          {camera.status === 'starting' ? 'Starting camera' : 'Camera unavailable'}
        </div>
      ) : null}
    </div>
  )
}

function drawLandmarks(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  landmarks: NormalizedLandmark[],
  signals: MirrorFaceSignals,
  mode: MirrorOverlayMode,
) {
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  const ratio = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.max(1, Math.round(width * ratio))
  canvas.height = Math.max(1, Math.round(height * ratio))
  const context = canvas.getContext('2d')
  if (!context) return
  context.scale(ratio, ratio)
  context.clearRect(0, 0, width, height)
  if (landmarks.length === 0) return

  const videoSize = {
    width: video.videoWidth || 1080,
    height: video.videoHeight || 1920,
  }
  const viewport = { width, height }
  const point = (index: number) =>
    landmarks[index]
      ? mapLandmarkToMirror(landmarks[index], viewport, videoSize)
      : null
  const drawPath = (indices: number[], alpha: number, lineWidth: number) => {
    const points = indices.map(point).filter((item): item is { x: number; y: number } => Boolean(item))
    if (points.length < 2) return
    context.beginPath()
    context.moveTo(points[0].x, points[0].y)
    points.slice(1).forEach((item) => context.lineTo(item.x, item.y))
    context.closePath()
    context.strokeStyle = `rgba(185, 220, 235, ${alpha})`
    context.lineWidth = lineWidth
    context.stroke()
  }

  const dissolve = mode === 'dissolve'
  if (mode !== 'none') {
    context.beginPath()
    let topologyEdges = 0
    SPARSE_FACE_TOPOLOGY.forEach(({ start, end }) => {
      const from = point(start)
      const to = point(end)
      if (!from || !to) return
      context.moveTo(from.x, from.y)
      context.lineTo(to.x, to.y)
      topologyEdges += 1
    })
    if (topologyEdges > 0) {
      context.strokeStyle = `rgba(185, 220, 235, ${dissolve ? 0.04 : 0.16})`
      context.lineWidth = 0.55
      context.stroke()
    }
  }
  drawPath(FACE_OVAL, dissolve ? 0.24 : 0.82, 1.4)
  const eyeWidth = (mode === 'eyes' ? 2.4 : 1.7) + signals.blink * 1.1
  drawPath(LEFT_EYE, dissolve ? 0.1 : 0.94, eyeWidth)
  drawPath(RIGHT_EYE, dissolve ? 0.1 : 0.94, eyeWidth)
  drawPath(NOSE, dissolve ? 0.05 : 0.42, 1)
  drawPath(LIPS, dissolve ? 0.05 : 0.48 + signals.smile * 0.36, 1.1 + signals.mouthOpen * 1.2)

  const left = point(33)
  const right = point(263)
  if (left && right && !dissolve) {
    context.beginPath()
    context.moveTo(left.x, left.y - 20)
    context.lineTo(right.x, right.y - 20)
    context.strokeStyle = 'rgba(185, 220, 235, .84)'
    context.setLineDash([4, 7])
    context.stroke()
    context.setLineDash([])
  }

  ;[33, 263, 1].forEach((index, blobIndex) => {
    const center = point(index)
    if (!center || dissolve) return
    context.beginPath()
    context.ellipse(
      center.x + signals.gazeX * 12,
      center.y - signals.gazeY * 10,
      14 + blobIndex * 4,
      Math.max(2.5, (9 + blobIndex * 3) * (1 - signals.blink * 0.72)),
      blobIndex * 0.6,
      0,
      Math.PI * 2,
    )
    context.strokeStyle = 'rgba(185, 220, 235, .76)'
    context.lineWidth = 1.2
    context.stroke()
  })
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}
