import { useMemo, useState } from 'react'
import { BottomNav } from '../components/BottomNav'
import { DebraOrb } from '../components/DebraOrb'
import { PersonaPfp } from '../components/PersonaPfp'
import { ThoughtBubble } from '../components/ThoughtBubble'
import { TopBar } from '../components/TopBar'
import { TraitTicks } from '../components/TraitTicks'
import { MATCH_PERSONAS, pickLockedPersona } from '../data/content'
import type { SessionState, TraitKey } from '../types'
import './MatchesScreen.css'

type Props = {
  session: SessionState
  onRestart: () => void
  onBack: () => void
  onComplete: (payload: {
    matchAnswers: SessionState['matchAnswers']
    traitWeights: SessionState['traitWeights']
    lockedPersonaId: string
    logs: string[]
    confidence: number
  }) => void
}

const EXCHANGES = 4

export function MatchesScreen({ session, onRestart, onBack, onComplete }: Props) {
  const [activeIndex, setActiveIndex] = useState(2)
  const [answers, setAnswers] = useState(session.matchAnswers)
  const [weights, setWeights] = useState(session.traitWeights)
  const [logs, setLogs] = useState(session.systemLogs)
  const [bubbleKey, setBubbleKey] = useState(0)
  const [locking, setLocking] = useState(false)
  const [lockedId, setLockedId] = useState<string | null>(null)

  const persona = MATCH_PERSONAS[activeIndex]
  const answeredIds = useMemo(() => answers.map((a) => a.personaId), [answers])
  const exchange = answers.length
  const progress = 50 + (Math.min(exchange + 1, EXCHANGES) / EXCHANGES) * 25

  function answer(label: string, traits: Partial<Record<TraitKey, number>>) {
    if (locking) return

    const nextWeights = { ...weights }
    for (const [key, value] of Object.entries(traits) as [TraitKey, number][]) {
      nextWeights[key] = (nextWeights[key] ?? 0) + value
    }

    const nextAnswers = [...answers, { personaId: persona.id, label }]
    const nextLogs = [...logs, `preference logged · ${persona.name.toLowerCase()}`]
    setWeights(nextWeights)
    setAnswers(nextAnswers)
    setLogs(nextLogs)

    if (nextAnswers.length >= EXCHANGES) {
      const locked = pickLockedPersona(
        nextWeights,
        nextAnswers.map((a) => a.personaId),
      )
      setLockedId(locked)
      setLocking(true)
      setLogs((l) => [...l, `match seed locked · ${locked}`])
      window.setTimeout(() => {
        onComplete({
          matchAnswers: nextAnswers,
          traitWeights: nextWeights,
          lockedPersonaId: locked,
          logs: [...nextLogs, `match seed locked · ${locked}`],
          confidence:
            68 +
            nextAnswers.length * 5 +
            Math.min(12, Object.values(nextWeights).reduce((a, b) => a + b, 0)),
        })
      }, 1400)
      return
    }

    const nextIndex = (activeIndex + 1) % MATCH_PERSONAS.length
    setActiveIndex(nextIndex)
    setBubbleKey((k) => k + 1)
  }

  function focusPersona(index: number) {
    if (locking) return
    setActiveIndex(index)
    setBubbleKey((k) => k + 1)
  }

  return (
    <section className="screen matches-screen">
      <TopBar onClose={onRestart} progress={progress} />
      <h1 className="matches-screen__title">03 Matches</h1>
      <TraitTicks weights={weights} />

      <div className="matches-screen__row" role="list">
        {MATCH_PERSONAS.map((p, index) => {
          const isActive = !locking && index === activeIndex
          const isLocked = locking && p.id === lockedId
          const answered = answeredIds.includes(p.id)
          return (
            <div key={p.id} className="matches-screen__slot" role="listitem">
              <div className="matches-screen__bubble-anchor">
                {isActive && (
                  <ThoughtBubble
                    key={bubbleKey}
                    visible
                    name={p.name}
                    text={`“${p.question}”`}
                    accent={p.accent}
                  />
                )}
                {isActive && (
                  <div className="matches-screen__choices">
                    {p.choices.map((choice) => (
                      <button
                        key={choice.label}
                        type="button"
                        className="matches-screen__choice"
                        onClick={() => answer(choice.label, choice.traits)}
                      >
                        {choice.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <PersonaPfp
                name={p.name}
                hue={p.hue}
                accent={p.accent}
                image={p.image}
                active={isActive}
                locked={isLocked}
                dimmed={locking ? !isLocked : answered && !isActive}
                idleBubble={!isActive && !locking}
                onClick={() => focusPersona(index)}
              />
            </div>
          )
        })}
      </div>

      {locking && lockedId && (
        <p className="matches-screen__lock">
          Locked seed · {MATCH_PERSONAS.find((x) => x.id === lockedId)?.name}
        </p>
      )}

      <aside className="matches-screen__companion">
        <DebraOrb size="sm" />
        <span>Companion</span>
      </aside>

      <BottomNav onBack={onBack} />
    </section>
  )
}
