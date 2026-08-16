// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DebraVoice,
  debraVoiceClipFor,
  stationOneDebraClipFor,
  thirdStationDebraClipFor,
} from './DebraVoice'

describe('stationOneDebraClipFor', () => {
  it.each([
    ['analysis-intro', null],
    ['scan-face', null],
    ['scan-eyes', null],
    ['scan-focus', null],
    ['self-check', '/audio/debra/08-do-you-like-what-you-see.mp3'],
    ['dissolve', null],
  ] as const)('maps %s to the clip spoken with that visible phase', (phase, expected) => {
    expect(stationOneDebraClipFor(phase)).toBe(expected)
  })
})

describe('debraVoiceClipFor', () => {
  it.each([
    ['percentile', 0, null],
    [
      'companion-intro',
      0,
      '/audio/debra/09-i-will-help-you-describe-the-companion-you-believe-you-want.mp3',
    ],
    [
      'debra-brief',
      0,
      '/audio/debra/09-i-will-help-you-describe-the-companion-you-believe-you-want.mp3',
    ],
    ['question', 0, '/audio/debra/01-is-attractiveness-important-to-you.mp3'],
    ['question', 1, '/audio/debra/02-should-your-companion-challenge-you.mp3'],
    ['question', 2, '/audio/debra/03-would-you-choose-companionship-over-independence.mp3'],
    ['height', 3, '/audio/debra/04-how-tall-is-your-ideal-partner.mp3'],
    ['complete', 3, '/audio/debra/05-youre-good-to-go-now.mp3'],
  ] as const)('maps %s question %i to its spoken clip', (phase, questionIndex, expected) => {
    expect(debraVoiceClipFor(phase, questionIndex)).toBe(expected)
  })
})

describe('thirdStationDebraClipFor', () => {
  it.each([
    ['intro', '/audio/debra/06-now-is-your-chance.mp3'],
    ['prompt', '/audio/debra/07-introduce-yourself-to-your-future-partner.mp3'],
    ['recording', null],
    ['loading', null],
  ] as const)('maps %s to its spoken clip', (phase, expected) => {
    expect(thirdStationDebraClipFor(phase)).toBe(expected)
  })
})

describe('DebraVoice', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
      .IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    vi.restoreAllMocks()
    container.remove()
  })

  it('starts the visible text clip and stops the previous clip on transition', async () => {
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    await act(async () => root.render(<DebraVoice phase="question" questionIndex={0} />))

    const audio = container.querySelector('audio')!
    expect(audio.getAttribute('src')).toBe('/audio/debra/01-is-attractiveness-important-to-you.mp3')
    expect(play).toHaveBeenCalledTimes(1)

    audio.currentTime = 1.4
    await act(async () => root.render(<DebraVoice phase="question" questionIndex={1} />))

    expect(audio.getAttribute('src')).toBe('/audio/debra/02-should-your-companion-challenge-you.mp3')
    expect(pause).toHaveBeenCalledTimes(1)
    expect(audio.currentTime).toBe(0)
    expect(play).toHaveBeenCalledTimes(2)
  })

  it('renders no audio before Debra and her introduction appear', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    await act(async () => root.render(<DebraVoice phase="percentile" questionIndex={0} />))

    expect(container.querySelector('audio')).toBeNull()
  })

  it('retries blocked autoplay from the visitor click gesture', async () => {
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockRejectedValueOnce(new DOMException('Autoplay blocked', 'NotAllowedError'))
      .mockResolvedValue()
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})

    await act(async () => {
      root.render(<DebraVoice phase="question" questionIndex={0} />)
      await Promise.resolve()
    })
    await act(async () => {
      window.dispatchEvent(new MouseEvent('click'))
      await Promise.resolve()
    })

    expect(play).toHaveBeenCalledTimes(2)
  })
})
