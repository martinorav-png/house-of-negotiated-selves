import { describe, expect, it } from 'vitest'
import { getStationFromHash, getStationHref } from './stationRoute'

describe('getStationFromHash', () => {
  it('defaults to the orb station for an empty hash', () => {
    expect(getStationFromHash('')).toBe('orb')
  })

  it('resolves the card station hash', () => {
    expect(getStationFromHash('#/cards')).toBe('cards')
  })

  it('resolves the avatar station hash', () => {
    expect(getStationFromHash('#/avatars')).toBe('avatars')
  })

  it('falls back to orb for unknown hashes', () => {
    expect(getStationFromHash('#/unknown')).toBe('orb')
  })
})

describe('getStationHref', () => {
  it('builds hash links for stations', () => {
    expect(getStationHref('orb')).toBe('#/orb')
    expect(getStationHref('cards')).toBe('#/cards')
    expect(getStationHref('avatars')).toBe('#/avatars')
  })
})
