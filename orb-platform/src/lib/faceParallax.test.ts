import { describe, expect, it } from 'vitest'
import { computeOrbit, faceSizeToDepth } from './faceParallax'

describe('computeOrbit', () => {
  it('returns base framing when face absent', () => {
    expect(computeOrbit({ x: 1, y: 1, z: 1, present: false }, 5.4, false)).toEqual({
      yaw: 0,
      pitch: 0,
      radius: 5.4,
    })
  })

  it('maps left face x to negative yaw with mirrored input', () => {
    const orbit = computeOrbit({ x: -1, y: 0, z: 0.5, present: true }, 5.4, false)
    expect(orbit.yaw).toBeLessThan(0)
  })

  it('pulls radius in when z is near', () => {
    const far = computeOrbit({ x: 0, y: 0, z: 0, present: true }, 5.4, false)
    const near = computeOrbit({ x: 0, y: 0, z: 1, present: true }, 5.4, false)
    expect(near.radius).toBeLessThan(far.radius)
  })

  it('shrinks travel under reduced motion', () => {
    const full = computeOrbit({ x: 1, y: 0, z: 0.5, present: true }, 5.4, false)
    const reduced = computeOrbit({ x: 1, y: 0, z: 0.5, present: true }, 5.4, true)
    expect(Math.abs(reduced.yaw)).toBeLessThan(Math.abs(full.yaw))
  })

  it('returns base framing when parallax is disabled', () => {
    expect(computeOrbit({ x: 1, y: 1, z: 1, present: true }, 5.4, false, false)).toEqual({
      yaw: 0,
      pitch: 0,
      radius: 5.4,
    })
  })
})

describe('faceSizeToDepth', () => {
  it('clamps outside near and far face sizes', () => {
    expect(faceSizeToDepth(0)).toBe(0)
    expect(faceSizeToDepth(1)).toBe(1)
  })
})
