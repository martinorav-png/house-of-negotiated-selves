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

vi.mock('./MirrorGuideOrb', () => ({
  MirrorGuideOrb: ({ className }: { className?: string }) => <div className={className} />,
}))

import { StationTwo } from './StationTwo'
import { applyStationVibe } from '../lib/stationVibe'

describe('StationTwo', () => {
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
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
    applyStationVibe('warm')
  })

  afterEach(() => {
    act(() => root.unmount())
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
    container.remove()
  })

  it('moves from percentile result through questions and live height choice', async () => {
    act(() => root.render(<StationTwo phaseDurationMs={20} visitorSeed="Ada:34" />))

    expect(container.textContent).toMatch(/percentile/i)
    expect(container.querySelector('.journey-message .journey-headline-canvas')).not.toBeNull()
    expect(container.textContent).not.toContain('ASSESSMENT COMPLETE')
    expect(container.textContent).toContain('Listening')
    expect(container.querySelectorAll('.journey-status > span')).toHaveLength(1)
    expect(container.textContent).not.toMatch(/\b\d{2}:\d{2}\b/)
    expect(container.querySelector('.journey-debra-introduction')).toBeNull()
    expect(container.querySelector('audio')).toBeNull()

    await act(async () => {
      vi.advanceTimersByTime(20)
      await Promise.resolve()
    })
    expect(container.textContent).not.toContain('MATCHING PROTOCOL')
    expect(container.querySelector('[aria-label="Debra, companion guide"]')).not.toBeNull()
    expect(container.textContent).toContain('Debra')
    expect(container.querySelector('audio')?.getAttribute('src')).toBe(
      '/audio/debra/09-i-will-help-you-describe-the-companion-you-believe-you-want.mp3',
    )
    const introduction = container.querySelector('.journey-debra-introduction')
    expect(introduction?.textContent).toBe(
      'I will help you describe the companion you believe you want.',
    )
    expect(introduction?.closest('.journey-debra')).not.toBeNull()
    await act(async () => {
      vi.advanceTimersByTime(20)
      await Promise.resolve()
    })
    expect(container.textContent).toContain("Let's get started")
    expect(container.querySelector('.journey-debra-introduction')).not.toBeNull()
    expect(container.querySelector('audio')?.getAttribute('src')).toBe(
      '/audio/debra/09-i-will-help-you-describe-the-companion-you-believe-you-want.mp3',
    )

    await act(async () => {
      vi.advanceTimersByTime(20)
      await Promise.resolve()
    })
    expect(container.textContent).toContain('Is attractiveness important to you?')
    expect(container.querySelector('.journey-debra-introduction')).toBeNull()
    expect(container.querySelector('.journey-question h1 .journey-headline-canvas')).not.toBeNull()
    expect(container.querySelector('.journey-question-index')).toBeNull()
    expect(container.querySelector('audio')?.getAttribute('src')).toBe(
      '/audio/debra/01-is-attractiveness-important-to-you.mp3',
    )

    for (const [prompt, clip] of [
      [
        'Should your companion challenge you?',
        '/audio/debra/02-should-your-companion-challenge-you.mp3',
      ],
      [
        'Would you choose companionship over independence?',
        '/audio/debra/03-would-you-choose-companionship-over-independence.mp3',
      ],
    ]) {
      act(() => container.querySelector<HTMLButtonElement>('.journey-choice button')!.click())
      expect(container.textContent).toContain(prompt)
      expect(container.querySelector('audio')?.getAttribute('src')).toBe(clip)
    }
    act(() => container.querySelector<HTMLButtonElement>('.journey-choice button')!.click())

    const slider = container.querySelector<HTMLInputElement>('input[type="range"]')!
    expect(slider).not.toBeNull()
    expect(container.textContent).toContain('How tall is your ideal partner?')
    expect(container.querySelector('.journey-height-control h1 .journey-headline-canvas')).not.toBeNull()
    expect(container.textContent).not.toContain('FINAL MEASURE')
    expect(container.querySelector('[aria-label="Companion silhouette"]')).not.toBeNull()
    expect(container.querySelector('audio')?.getAttribute('src')).toBe(
      '/audio/debra/04-how-tall-is-your-ideal-partner.mp3',
    )

    act(() => container.querySelector<HTMLButtonElement>('.journey-height-confirm')!.click())
    expect(container.textContent).toContain("When you're ready")
    expect(container.querySelector('.journey-complete h1 .journey-headline-canvas')).not.toBeNull()
    expect(container.textContent).not.toContain('COMPANION PROFILE COMPLETE')
    expect(container.querySelector('a')?.getAttribute('href')).toBe('#/mirror')
    expect(container.querySelector('audio')?.getAttribute('src')).toBe(
      '/audio/debra/05-youre-good-to-go-now.mp3',
    )
  })

  it('keeps the opening text states on the original three-second cadence', async () => {
    act(() => root.render(<StationTwo visitorSeed="Ada:34" />))

    await act(async () => {
      vi.advanceTimersByTime(2999)
      await Promise.resolve()
    })
    expect(container.textContent).toMatch(/percentile/i)

    await act(async () => {
      vi.advanceTimersByTime(1)
      await Promise.resolve()
    })
    expect(container.textContent).toContain('matched with an AI companion')

    await act(async () => {
      vi.advanceTimersByTime(3000)
      await Promise.resolve()
    })
    expect(container.textContent).toContain("Let's get started")

    await act(async () => {
      vi.advanceTimersByTime(2999)
      await Promise.resolve()
    })
    expect(container.textContent).toContain("Let's get started")

    await act(async () => {
      vi.advanceTimersByTime(1)
      await Promise.resolve()
    })
    expect(container.textContent).toContain('Is attractiveness important to you?')
  })
})
