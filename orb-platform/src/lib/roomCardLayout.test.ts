import { describe, expect, it } from 'vitest'
import { getRoomCardLayout, getRoomServedCardTransform } from './roomCardLayout'

describe('getRoomCardLayout', () => {
  it('places cards as a staggered 3d deck behind the orb', () => {
    const first = getRoomCardLayout(0, 7)
    const last = getRoomCardLayout(6, 7)

    expect(first.position[2]).toBeLessThan(-1)
    expect(last.position[2]).toBeLessThan(first.position[2])
    expect(first.rotation[1]).toBeGreaterThan(0)
    expect(last.rotation[1]).toBeLessThan(0)
  })
})

describe('getRoomServedCardTransform', () => {
  it('brings the active card forward and upright enough to read', () => {
    const rest = getRoomCardLayout(2, 7)
    const served = getRoomServedCardTransform(2, 7)

    expect(served.position[2]).toBeGreaterThan(rest.position[2])
    expect(Math.abs(served.rotation[1])).toBeLessThan(Math.abs(rest.rotation[1]))
    expect(served.scale).toBeGreaterThan(rest.scale)
  })
})
