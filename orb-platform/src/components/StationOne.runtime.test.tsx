// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../hooks/useMirrorCamera', () => ({
  useMirrorCamera: () => ({
    videoRef: { current: null },
    status: 'denied',
    landmarks: [],
    signals: {
      blink: 0, gazeX: 0, gazeY: 0, mouthOpen: 0, smile: 0,
      browLift: 0, headYaw: 0, headPitch: 0, headRoll: 0,
    },
  }),
}))

import { StationOne } from './StationOne'
import { applyStationVibe } from '../lib/stationVibe'

function setInput(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

function submit(form: HTMLFormElement) {
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
}

describe('StationOne', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    vi.useFakeTimers()
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
      .IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => null)
    applyStationVibe('warm')
  })

  afterEach(() => {
    act(() => root.unmount())
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
    container.remove()
  })

  it('moves from identity intake through facial analysis to Station II', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    act(() => root.render(<StationOne phaseDurationMs={20} />))

    expect(container.querySelectorAll('.journey-status > span')).toHaveLength(1)
    expect(container.querySelector('.journey-status')?.textContent).toBe('Station I · Welcome')
    expect(container.querySelector('label .journey-headline-canvas')).not.toBeNull()
    const name = container.querySelector<HTMLInputElement>('input[name="name"]')!
    expect(name.getAttribute('aria-label')).toBe('Your name')
    act(() => {
      setInput(name, 'Ada')
      submit(name.form!)
    })

    const age = container.querySelector<HTMLInputElement>('input[name="age"]')!
    expect(age).not.toBeNull()
    act(() => {
      setInput(age, '34')
      submit(age.form!)
    })
    expect(container.textContent).toContain("Let's have a look at you")
    expect(container.querySelector('.journey-message .journey-headline-canvas')).not.toBeNull()
    expect(container.textContent).not.toContain('FACIAL ANALYSIS')

    for (const eyebrow of ['01 / FACE MAP', '02 / EYE VECTOR', '03 / PROFILE']) {
      await act(async () => {
        vi.advanceTimersByTime(20)
        await Promise.resolve()
      })
      expect(container.textContent).not.toContain(eyebrow)
    }
    await act(async () => {
      vi.advanceTimersByTime(20)
      await Promise.resolve()
    })
    expect(container.textContent).toContain('Do you like what you see?')
    expect(container.querySelector('.journey-question h1 .journey-headline-canvas')).not.toBeNull()
    expect(container.querySelector('audio')?.getAttribute('src')).toBe(
      '/audio/debra/08-do-you-like-what-you-see.mp3',
    )

    act(() => container.querySelector<HTMLButtonElement>('button')!.click())
    expect(container.querySelector('.journey-camera-stage')?.className).toContain('is-dissolving')
    expect(container.querySelector('audio')).toBeNull()

    for (let phase = 0; phase < 2; phase += 1) {
      await act(async () => {
        vi.advanceTimersByTime(20)
        await Promise.resolve()
      })
    }
    expect(container.textContent).toContain("When you're ready")
    expect(container.querySelector('.journey-complete h1 .journey-headline-canvas')).not.toBeNull()
    expect(container.textContent).not.toContain('ANALYSIS COMPLETE')
    expect(container.querySelector('a')?.getAttribute('href')).toBe('#/station-2')
  })

  it('restores the original station chrome when the warm look is off', () => {
    applyStationVibe('original')
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    act(() => root.render(<StationOne phaseDurationMs={20} />))

    expect(container.querySelector('.journey-status')?.textContent).toBe('STATION I')
    expect(container.textContent).toContain('HOUSE OF NEGOTIATED SELVES')
  })
})
