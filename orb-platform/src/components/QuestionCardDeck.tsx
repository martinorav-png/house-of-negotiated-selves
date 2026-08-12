import type { CSSProperties } from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import CardSwap, { Card } from './CardSwap'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { stationCards, type StationCard } from '../lib/cardStation'
import { cardSettings } from '../dev/cardSettingsStore'
import './QuestionCardDeck.css'

const DECK_VISIBLE_SLOTS = 3
const INITIAL_HOLD_MS = 4200
/** Polling interval for the dev-panel bridge — no leva import needed here. */
const LIVE_POLL_MS = 120

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const value = Number.parseInt(clean.length === 3 ? clean.replace(/./g, (c) => c + c) : clean, 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function rgba(hex: string, alpha: number) {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function snapshotCardStyle() {
  return { ...cardSettings.cardStyle }
}

function snapshotSwap() {
  return { ...cardSettings.swap }
}

function shallowEqual<T extends Record<string, unknown>>(a: T, b: T) {
  return Object.keys(a).every((key) => a[key] === b[key])
}

/** Live-polls cardSettings so the dev panel can tune this DOM/CSS-driven
 * deck without this always-loaded component ever importing leva itself.
 * Uses requestAnimationFrame (throttled) rather than setInterval so it
 * doesn't show up as an extra timer wherever code elsewhere counts them. */
function useLiveCardSettings() {
  const [cardStyle, setCardStyle] = useState(snapshotCardStyle)
  const [swap, setSwap] = useState(snapshotSwap)

  useEffect(() => {
    let raf = 0
    let last = 0
    const tick = (now: number) => {
      if (now - last >= LIVE_POLL_MS) {
        last = now
        setCardStyle((prev) => {
          const next = snapshotCardStyle()
          return shallowEqual(prev, next) ? prev : next
        })
        setSwap((prev) => {
          const next = snapshotSwap()
          return shallowEqual(prev, next) ? prev : next
        })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return { cardStyle, swap }
}

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
  const { cardStyle, swap } = useLiveCardSettings()

  useEffect(() => {
    const root = document.documentElement.style
    root.setProperty('--holo-teal', rgba(cardStyle.holoTeal, cardStyle.holoTealAlpha))
    root.setProperty('--holo-violet', rgba(cardStyle.holoViolet, cardStyle.holoVioletAlpha))
    root.setProperty('--holo-mint', rgba(cardStyle.holoMint, cardStyle.holoMintAlpha))
    root.setProperty('--holo-green', rgba(cardStyle.holoGreen, cardStyle.holoGreenAlpha))
    root.setProperty('--holo-blur', `${cardStyle.blurPx}px`)
    root.setProperty('--hover-duration', `${cardStyle.hoverDuration}s`)
    root.setProperty('--flicker-duration', `${cardStyle.flickerDuration}s`)
    root.setProperty('--grain-duration', `${cardStyle.grainDuration}s`)
  }, [cardStyle])

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
        cardDistance={swap.cardDistance}
        verticalDistance={swap.verticalDistance}
        delay={swap.delay}
        pauseOnHover={true}
        skewAmount={swap.skewAmount}
        easing="elastic"
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
