// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { mirrorSettings } from '../dev/mirrorSettingsStore'
import {
  applyStationVibe,
  readStationVibe,
  setStationVibe,
  subscribeStationVibe,
  writeStationVibe,
} from './stationVibe'

describe('station vibe', () => {
  afterEach(() => {
    applyStationVibe('warm')
  })

  it('defaults to warm when no saved preference exists', () => {
    expect(readStationVibe({ getItem: () => null })).toBe('warm')
  })

  it('restores original look from storage', () => {
    expect(readStationVibe({ getItem: () => 'original' })).toBe('original')
  })

  it('rejects invalid saved values', () => {
    expect(readStationVibe({ getItem: () => 'neon' })).toBe('warm')
  })

  it('persists the selected vibe and restores the original palette', () => {
    const setItem = vi.fn()
    writeStationVibe('original', { setItem })
    expect(setItem).toHaveBeenCalledWith('station-vibe', 'original')

    applyStationVibe('original')
    expect(document.documentElement.dataset.stationVibe).toBe('original')
    expect(mirrorSettings.accent.color).toBe('#ffffff')
    expect(mirrorSettings.orb.colorRim).toBe('#3fa8c9')
  })

  it('restores the warm palette when toggled back on', () => {
    applyStationVibe('original')
    setStationVibe('warm')
    expect(document.documentElement.dataset.stationVibe).toBe('warm')
    expect(mirrorSettings.accent.color).toBe('#e8b88c')
    expect(mirrorSettings.orb.colorRim).toBe('#c47848')
  })

  it('unsubscribes without returning a boolean from Set.delete', () => {
    const unsubscribe = subscribeStationVibe(() => {})
    expect(unsubscribe()).toBeUndefined()
  })
})
