import { describe, expect, it } from 'vitest'
import {
  computeCameraFocus,
  landmarkBounds,
  mapLandmarkToMirror,
  normalizeCompanionHeight,
} from './mirrorLandmarks'

describe('mapLandmarkToMirror', () => {
  it('mirrors horizontal coordinates and accounts for object-cover cropping', () => {
    const point = mapLandmarkToMirror(
      { x: 0.25, y: 0.5 },
      { width: 1080, height: 1920 },
      { width: 1920, height: 1080 },
    )

    expect(point.x).toBeCloseTo(1393.3333, 4)
    expect(point.y).toBeCloseTo(960, 4)
  })
})

describe('landmarkBounds', () => {
  it('returns normalized bounds without mutating the sample', () => {
    const sample = [
      { x: 0.2, y: 0.25 },
      { x: 0.8, y: 0.75 },
      { x: 0.55, y: 0.4 },
    ]

    expect(landmarkBounds(sample)).toEqual({
      minX: 0.2,
      minY: 0.25,
      maxX: 0.8,
      maxY: 0.75,
      width: 0.6000000000000001,
      height: 0.5,
      centerX: 0.5,
      centerY: 0.5,
    })
    expect(sample[0]).toEqual({ x: 0.2, y: 0.25 })
  })

  it('returns null when no face is present', () => {
    expect(landmarkBounds([])).toBeNull()
  })
})

describe('computeCameraFocus', () => {
  const face = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }))
  face[33] = { x: 0.35, y: 0.36 }
  face[263] = { x: 0.65, y: 0.36 }

  it('uses a mirrored eye midpoint as the eye-zoom origin', () => {
    expect(computeCameraFocus(face, 'eyes')).toEqual({
      scale: 1.85,
      originX: 50,
      originY: 36,
    })
  })

  it('falls back to centered full framing without landmarks', () => {
    expect(computeCameraFocus([], 'face')).toEqual({
      scale: 1.08,
      originX: 50,
      originY: 43,
    })
  })
})

describe('normalizeCompanionHeight', () => {
  it('maps the slider to a restrained visible scale range', () => {
    expect(normalizeCompanionHeight(-1)).toBe(0.78)
    expect(normalizeCompanionHeight(0.5)).toBe(1)
    expect(normalizeCompanionHeight(2)).toBe(1.22)
  })
})
