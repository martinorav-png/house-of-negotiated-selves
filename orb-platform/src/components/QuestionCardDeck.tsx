import type { CSSProperties } from 'react'
import { useLayoutEffect, useRef } from 'react'
import CardSwap, { Card } from './CardSwap'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { stationCards, type StationCard } from '../lib/cardStation'
import './QuestionCardDeck.css'

const DECK_VISIBLE_SLOTS = 3

function useAnimatedDepthLimit(reducedMotion: boolean) {
  const deckRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (reducedMotion) return

    const deck = deckRef.current
    if (!deck) return

    const cards = Array.from(
      deck.querySelectorAll<HTMLElement>('.question-swap-card'),
    )

    const syncVisibleCards = () => {
      const visibleCards = cards
        .map((card, index) => ({
          card,
          index,
          zIndex: Number.parseInt(card.style.zIndex || '0', 10),
        }))
        .sort((a, b) => b.zIndex - a.zIndex || a.index - b.index)
        .slice(0, DECK_VISIBLE_SLOTS)
      const visibleSet = new Set(visibleCards.map(({ card }) => card))

      cards.forEach((card) => {
        card.toggleAttribute('data-deck-visible', visibleSet.has(card))
      })
    }

    const observer = new MutationObserver(syncVisibleCards)
    cards.forEach((card) => {
      observer.observe(card, { attributes: true, attributeFilter: ['style'] })
    })
    syncVisibleCards()

    return () => {
      observer.disconnect()
      cards.forEach((card) => card.removeAttribute('data-deck-visible'))
    }
  }, [reducedMotion])

  return deckRef
}

function QuestionCardContent({ card }: { card: StationCard }) {
  return (
    <>
      <span className="question-swap-kicker">{card.kicker}</span>
      <h2 className="question-swap-title">{card.title}</h2>
    </>
  )
}

export function QuestionCardDeck() {
  const reducedMotion = usePrefersReducedMotion()
  const deckRef = useAnimatedDepthLimit(reducedMotion)

  if (reducedMotion) {
    return (
      <div className="question-deck-viewport question-deck-static" aria-label="Question cards">
        {stationCards.slice(0, 3).map((card, index) => (
          <article
            className={`question-swap-card station-card-${index + 1}`}
            key={card.kicker}
            style={{ '--static-slot': index } as CSSProperties}
          >
            <QuestionCardContent card={card} />
          </article>
        ))}
      </div>
    )
  }

  return (
    <div
      className="question-deck-viewport"
      aria-label="Cycling question cards"
      ref={deckRef}
    >
      <CardSwap
        width="var(--deck-card-width)"
        height="var(--deck-card-height)"
        cardDistance={28}
        verticalDistance={44}
        delay={4200}
        pauseOnHover={true}
        skewAmount={4}
        easing="linear"
      >
        {stationCards.map((card, index) => (
          <Card
            customClass={`question-swap-card station-card-${index + 1}`}
            key={card.kicker}
            aria-label={card.title}
          >
            <QuestionCardContent card={card} />
          </Card>
        ))}
      </CardSwap>
    </div>
  )
}
