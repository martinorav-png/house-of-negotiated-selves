// @vitest-environment jsdom

import { act, type HTMLAttributes, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import questionCardDeckStyles from './QuestionCardDeck.css?raw'

type MockCardProps = HTMLAttributes<HTMLDivElement> & {
  customClass?: string
}

const motionState = vi.hoisted(() => ({ reduced: false }))

vi.mock('./CardSwap', async () => {
  const React = await import('react')

  const Card = React.forwardRef<HTMLDivElement, MockCardProps>(
    ({ customClass, className, ...props }, ref) => (
      <div
        ref={ref}
        {...props}
        className={`card ${customClass ?? ''} ${className ?? ''}`.trim()}
      />
    ),
  )

  function CardSwap({ children }: { children?: ReactNode }) {
    return <div className="card-swap-container">{children}</div>
  }

  return { Card, default: CardSwap }
})

vi.mock('../hooks/usePrefersReducedMotion', () => ({
  usePrefersReducedMotion: () => motionState.reduced,
}))

import { QuestionCardDeck } from './QuestionCardDeck'

describe('QuestionCardDeck animated depth limit', () => {
  let container: HTMLDivElement
  let root: Root
  let style: HTMLStyleElement
  let rootMounted: boolean

  beforeEach(() => {
    vi.useFakeTimers()
    motionState.reduced = false
    ;(
      globalThis as typeof globalThis & {
        IS_REACT_ACT_ENVIRONMENT: boolean
      }
    ).IS_REACT_ACT_ENVIRONMENT = true

    style = document.createElement('style')
    style.textContent = questionCardDeckStyles
    document.head.append(style)

    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
    rootMounted = true
  })

  afterEach(() => {
    if (rootMounted) act(() => root.unmount())
    vi.clearAllTimers()
    vi.useRealTimers()
    container.remove()
    style.remove()
  })

  async function finishInitialHold() {
    await act(async () => {
      vi.advanceTimersByTime(4200)
      await Promise.resolve()
    })
  }

  it('holds an accessible stable opening deck for 4200ms before mounting CardSwap', async () => {
    act(() => root.render(<QuestionCardDeck />))

    const openingDeck = container.querySelector<HTMLElement>('[role="group"]')
    expect(openingDeck?.getAttribute('aria-label')).toBe('Opening question cards')
    expect(openingDeck?.classList.contains('question-deck-static')).toBe(true)
    expect(container.querySelectorAll('.question-swap-card')).toHaveLength(3)
    expect(container.querySelector('.card-swap-container')).toBeNull()

    await act(async () => {
      vi.advanceTimersByTime(4199)
      await Promise.resolve()
    })
    expect(container.querySelector('.card-swap-container')).toBeNull()

    await act(async () => {
      vi.advanceTimersByTime(1)
      await Promise.resolve()
    })
    const animatedDeck = container.querySelector<HTMLElement>('[role="group"]')
    expect(animatedDeck?.getAttribute('aria-label')).toBe('Cycling question cards')
    expect(container.querySelector('.card-swap-container')).not.toBeNull()
    expect(container.querySelectorAll('.question-swap-card')).toHaveLength(7)
  })

  it('keeps reduced motion stable and never mounts CardSwap', async () => {
    motionState.reduced = true
    act(() => root.render(<QuestionCardDeck />))

    const stableDeck = container.querySelector<HTMLElement>('[role="group"]')
    expect(stableDeck?.getAttribute('aria-label')).toBe('Question cards')
    expect(container.querySelectorAll('.question-swap-card')).toHaveLength(3)
    expect(container.querySelector('.card-swap-container')).toBeNull()

    await act(async () => {
      vi.advanceTimersByTime(8400)
      await Promise.resolve()
    })
    expect(container.querySelector('.card-swap-container')).toBeNull()
  })

  it('cleans up the initial hold timer on unmount', () => {
    act(() => root.render(<QuestionCardDeck />))
    // 1 = the initial-hold timeout; 1 = the dev-panel live-settings poll
    // (a throttled requestAnimationFrame loop, which fake timers count
    // alongside setTimeout/setInterval). Both must be cleaned up on unmount.
    expect(vi.getTimerCount()).toBe(2)

    act(() => root.unmount())
    rootMounted = false
    expect(vi.getTimerCount()).toBe(0)
  })

  it('keeps seven animated cards mounted while only three overlap surfaces can show', async () => {
    act(() => root.render(<QuestionCardDeck />))
    await finishInitialHold()

    const viewport = container.querySelector<HTMLElement>('.question-deck-viewport')
    const cards = Array.from(
      container.querySelectorAll<HTMLElement>('.question-swap-card'),
    )

    expect(viewport).not.toBeNull()
    expect(cards).toHaveLength(7)

    await act(async () => {
      ;[7, 7, 6, 6, 5, 4, 3].forEach((zIndex, index) => {
        cards[index].style.zIndex = String(zIndex)
      })
      await Promise.resolve()
    })

    const visibleCards = cards.filter((card) =>
      card.hasAttribute('data-deck-visible'),
    )
    const hiddenCards = cards.filter(
      (card) => !card.hasAttribute('data-deck-visible'),
    )

    expect(visibleCards).toHaveLength(3)
    expect(hiddenCards).toHaveLength(4)
    expect(cards[3].hasAttribute('data-deck-visible')).toBe(false)
    hiddenCards.forEach((card) => {
      expect(getComputedStyle(card).visibility).toBe('hidden')
      expect(getComputedStyle(card).pointerEvents).toBe('none')
    })
    expect(getComputedStyle(viewport!).overflow).toBe('visible')
  })
})
