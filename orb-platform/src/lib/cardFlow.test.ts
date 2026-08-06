import { describe, expect, it } from 'vitest'
import { getServedCardState } from './cardFlow'

describe('getServedCardState', () => {
  it('starts with the deck at rest before serving begins', () => {
    expect(getServedCardState(0, 7)).toEqual({
      activeIndex: -1,
      phase: 'stacked',
      progress: 0,
    })
  })

  it('serves the first card after the opening pause', () => {
    expect(getServedCardState(1.3, 7)).toMatchObject({
      activeIndex: 0,
      phase: 'serving',
    })
  })

  it('holds the active card long enough to read the question', () => {
    expect(getServedCardState(3.1, 7)).toMatchObject({
      activeIndex: 0,
      phase: 'active',
    })
  })

  it('returns the active card to the deck before the next card starts', () => {
    expect(getServedCardState(5.6, 7)).toMatchObject({
      activeIndex: 0,
      phase: 'returning',
    })
  })

  it('cycles to the next card after the first card returns', () => {
    expect(getServedCardState(6.9, 7)).toMatchObject({
      activeIndex: 1,
      phase: 'serving',
    })
  })
})
