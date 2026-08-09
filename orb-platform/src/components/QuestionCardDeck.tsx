import type { CSSProperties } from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import CardSwap, { Card } from './CardSwap'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { stationCards, type StationCard } from '../lib/cardStation'
import './QuestionCardDeck.css'

const DECK_VISIBLE_SLOTS = 3
const INITIAL_HOLD_MS = 4200

function useCardSwapReady(reducedMotion: boolean) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (reducedMotion) {
      setReady(false)
      return
    }

    const holdTimer = window.setTimeout(() => setReady(true), INITIAL_HOLD_MS)
    return () => window.clearTimeout(holdTimer)
  }, [reducedMotion])

  return ready
}

function useAnimatedDepthLimit(active: boolean) {
  const deckRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!active) return

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
  }, [active])

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

function StableQuestionDeck({ ariaLabel }: { ariaLabel: string }) {
  return (
    <div
      className="question-deck-viewport question-deck-static"
      role="group"
      aria-label={ariaLabel}
    >
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

export function QuestionCardDeck() {
  const reducedMotion = usePrefersReducedMotion()
  const cardSwapReady = useCardSwapReady(reducedMotion)
  const deckRef = useAnimatedDepthLimit(cardSwapReady && !reducedMotion)

  if (reducedMotion) {
    return <StableQuestionDeck ariaLabel="Question cards" />
  }

  if (!cardSwapReady) {
    return <StableQuestionDeck ariaLabel="Opening question cards" />
  }

  return (
    <div
      className="question-deck-viewport"
      role="group"
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
