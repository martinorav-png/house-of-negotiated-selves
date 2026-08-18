// @vitest-environment jsdom

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { StationVibeToggle } from './StationVibeToggle'
import { applyStationVibe } from '../lib/stationVibe'

describe('StationVibeToggle', () => {
  afterEach(() => {
    applyStationVibe('warm')
  })

  it('switches the warm look back to the original chrome', () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    const values = new Map<string, string>()
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    })

    act(() => root.render(<StationVibeToggle />))

    const button = container.querySelector('button')!
    expect(button.textContent).toContain('Original look')
    act(() => button.click())
    expect(values.get('station-vibe')).toBe('original')
    expect(document.documentElement.dataset.stationVibe).toBe('original')
    expect(button.textContent).toContain('Warm look')

    act(() => root.unmount())
  })
})
