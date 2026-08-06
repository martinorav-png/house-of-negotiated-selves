import { describe, expect, it } from 'vitest'
import { stationCards } from './cardStation'

describe('stationCards', () => {
  it('provides question cards for the second station', () => {
    expect(stationCards).toHaveLength(7)
    expect(stationCards[0]).toMatchObject({
      kicker: 'Question 01',
      title: 'Are you introverted or extroverted, or somewhere in between?',
    })
  })
})
