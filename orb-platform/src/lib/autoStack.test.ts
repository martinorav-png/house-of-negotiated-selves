import { describe, expect, it } from 'vitest'
import {
  AUTO_STACK_DEPARTURE_MS,
  AUTO_STACK_INTERVAL_MS,
  getAutoCardMotion,
  sendTopCardToBack,
  shouldAdvanceAutoStack,
} from './autoStack'

describe('sendTopCardToBack', () => {
  it('moves the last visible card to the back of the stack', () => {
    expect(sendTopCardToBack([1, 2, 3, 4])).toEqual([4, 1, 2, 3])
  })

  it('leaves empty and single-card stacks unchanged', () => {
    expect(sendTopCardToBack([])).toEqual([])
    expect(sendTopCardToBack([1])).toEqual([1])
  })
})

describe('getAutoCardMotion', () => {
  it('pulls the visible card left during its departure', () => {
    expect(getAutoCardMotion('departing')).toMatchObject({
      x: -112,
      rotateY: -10,
    })
  })

  it('returns the card to its deck position after departure', () => {
    expect(getAutoCardMotion('settled')).toMatchObject({
      x: 0,
      rotateY: 0,
    })
  })
})

describe('shouldAdvanceAutoStack', () => {
  it('pauses the automatic cycle while the front card is hovered', () => {
    expect(shouldAdvanceAutoStack(true)).toBe(false)
  })

  it('allows the automatic cycle to continue after hover ends', () => {
    expect(shouldAdvanceAutoStack(false)).toBe(true)
  })
})

describe('automatic stack timing', () => {
  it('leaves enough time between card movements to read each card', () => {
    expect(AUTO_STACK_INTERVAL_MS).toBe(4200)
    expect(AUTO_STACK_DEPARTURE_MS).toBe(900)
  })
})
