export type NormalizedLandmark = {
  x: number
  y: number
  z?: number
}

export type Dimensions = {
  width: number
  height: number
}

export type LandmarkBounds = {
  minX: number
  minY: number
  maxX: number
  maxY: number
  width: number
  height: number
  centerX: number
  centerY: number
}

export type CameraFocusMode = 'full' | 'face' | 'eyes'

export type CameraFocus = {
  scale: number
  originX: number
  originY: number
}

export function mapLandmarkToMirror(
  landmark: NormalizedLandmark,
  viewport: Dimensions,
  video: Dimensions,
) {
  const scale = Math.max(viewport.width / video.width, viewport.height / video.height)
  const renderedWidth = video.width * scale
  const renderedHeight = video.height * scale
  const cropX = (renderedWidth - viewport.width) / 2
  const cropY = (renderedHeight - viewport.height) / 2

  return {
    x: (1 - landmark.x) * renderedWidth - cropX,
    y: landmark.y * renderedHeight - cropY,
  }
}

export function landmarkBounds(landmarks: NormalizedLandmark[]): LandmarkBounds | null {
  if (landmarks.length === 0) return null

  let minX = 1
  let minY = 1
  let maxX = 0
  let maxY = 0
  for (const landmark of landmarks) {
    minX = Math.min(minX, landmark.x)
    minY = Math.min(minY, landmark.y)
    maxX = Math.max(maxX, landmark.x)
    maxY = Math.max(maxY, landmark.y)
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  }
}

export function computeCameraFocus(
  landmarks: NormalizedLandmark[],
  mode: CameraFocusMode,
): CameraFocus {
  if (mode === 'full') return { scale: 1, originX: 50, originY: 45 }

  if (mode === 'eyes') {
    const leftEye = landmarks[33]
    const rightEye = landmarks[263]
    if (leftEye && rightEye) {
      return {
        scale: 1.85,
        originX: clamp((1 - (leftEye.x + rightEye.x) / 2) * 100, 10, 90),
        originY: clamp(((leftEye.y + rightEye.y) / 2) * 100, 15, 80),
      }
    }
    return { scale: 1.85, originX: 50, originY: 36 }
  }

  const bounds = landmarkBounds(landmarks)
  if (!bounds) return { scale: 1.08, originX: 50, originY: 43 }
  return {
    scale: clamp(0.52 / Math.max(bounds.width, 0.01), 1.08, 1.45),
    originX: clamp((1 - bounds.centerX) * 100, 15, 85),
    originY: clamp(bounds.centerY * 100, 20, 75),
  }
}

export function normalizeCompanionHeight(value: number) {
  return 0.78 + clamp(value, 0, 1) * 0.44
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
