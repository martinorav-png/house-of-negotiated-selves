import type { CSSProperties } from 'react'
import CardSwap, { Card } from './CardSwap'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { stationCards, type StationCard } from '../lib/cardStation'
import './QuestionCardDeck.css'

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
    <div className="question-deck-viewport" aria-label="Cycling question cards">
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
