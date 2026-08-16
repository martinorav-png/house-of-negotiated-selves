// @vitest-environment jsdom

import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it, vi } from 'vitest'
import { MirrorPreviewFrame, MirrorPreviewToggle } from './MirrorPreviewToggle'

describe('MirrorPreviewToggle', () => {
  it('switches a portrait preview to fill mode', () => {
    const container = document.createElement('div')
    const root = createRoot(container)
    const onChange = vi.fn()

    act(() => root.render(<MirrorPreviewToggle mode="portrait" onChange={onChange} />))

    const button = container.querySelector('button')!
    expect(button.textContent).toContain('Fill screen')
    act(() => button.click())
    expect(onChange).toHaveBeenCalledWith('fill')

    act(() => root.unmount())
  })

  it('applies and persists preview mode around the station content', () => {
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

    act(() => root.render(<MirrorPreviewFrame><span>Station content</span></MirrorPreviewFrame>))

    expect(container.firstElementChild?.className).toContain('experience-mirror-preview-portrait')
    act(() => container.querySelector('button')!.click())
    expect(container.firstElementChild?.className).toContain('experience-mirror-preview-fill')
    expect(values.get('mirror-preview-mode')).toBe('fill')

    act(() => root.unmount())
  })
})
