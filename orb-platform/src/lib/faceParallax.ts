import { PARALLAX } from '../config'

export type FaceSample = {
  x: number
  y: number
  z: number
  present: boolean
}

export function computeOrbit(
  face: FaceSample,
  baseRadius: number,
  reducedMotion: boolean,
  enabled = true,
): { yaw: number; pitch: number; radius: number } {
  const scale = reducedMotion ? PARALLAX.reducedMotionScale : 1

  if (!enabled || !face.present) {
    return { yaw: 0, pitch: 0, radius: baseRadius }
  }

  const yaw = clamp(face.x, -1, 1) * PARALLAX.maxYaw * scale
  const pitch = clamp(face.y, -1, 1) * PARALLAX.maxPitch * scale
  const depth = clamp(face.z, 0, 1)
  const factor =
    PARALLAX.radiusMaxFactor +
    (PARALLAX.radiusMinFactor - PARALLAX.radiusMaxFactor) * depth
  const radiusDelta = (factor - 1) * scale

  return {
    yaw,
    pitch,
    radius: baseRadius * (1 + radiusDelta),
  }
}

/** Map landmark face size (approx eye distance) to z 0..1. */
export function faceSizeToDepth(size: number): number {
  const { faceSizeFar, faceSizeNear } = PARALLAX
  if (size <= faceSizeFar) return 0
  if (size >= faceSizeNear) return 1
  return (size - faceSizeFar) / (faceSizeNear - faceSizeFar)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
