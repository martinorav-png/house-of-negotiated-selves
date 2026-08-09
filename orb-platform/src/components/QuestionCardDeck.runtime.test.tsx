// @vitest-environment jsdom

import { act, type HTMLAttributes, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import questionCardDeckStyles from './QuestionCardDeck.css?raw'

type MockCardProps = HTMLAttributes<HTMLDivElement> & {
  customClass?: string
}

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
  usePrefersReducedMotion: () => false,
}))

import { QuestionCardDeck } from './QuestionCardDeck'

describe('QuestionCardDeck animated depth limit', () => {
  let container: HTMLDivElement
  let root: Root
  let style: HTMLStyleElement

  beforeEach(() => {
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
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
    style.remove()
  })

  it('keeps seven animated cards mounted while only three overlap surfaces can show', async () => {
    act(() => root.render(<QuestionCardDeck />))

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
      await new Promise((resolve) => setTimeout(resolve, 0))
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
