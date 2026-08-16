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

  it('resolves the mirror station hash', () => {
    expect(getStationFromHash('#/mirror')).toBe('mirror')
  })

  it('resolves the first mirror journey hash', () => {
    expect(getStationFromHash('#/station-1')).toBe('station-1')
  })

  it('resolves the second mirror journey hash', () => {
    expect(getStationFromHash('#/station-2')).toBe('station-2')
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
    expect(getStationHref('mirror')).toBe('#/mirror')
    expect(getStationHref('station-1')).toBe('#/station-1')
    expect(getStationHref('station-2')).toBe('#/station-2')
  })
})
