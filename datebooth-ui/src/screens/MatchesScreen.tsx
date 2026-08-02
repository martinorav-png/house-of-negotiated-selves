import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { HeartKeyButton } from '../components/Buttons'
import { NightTag } from '../components/NightTag'
import { PersonaTrack } from '../components/PersonaTrack'
import { TopOrnament } from '../components/Ornaments'
import { ScreenShell } from '../components/ScreenShell'
import { ThoughtBubble } from '../components/ThoughtBubble'
import {
  MATCH_PERSONAS,
  applyTraits,
  emptyTraitWeights,
  pickLockedPersona,
  type PersonaChoice,
} from '../data/personas'
import { itemVariants } from '../lib/motion'

type Props = {
  onContinue: (lockedPersonaId: string) => void
  onBack: () => void
}

export function MatchesScreen({ onContinue, onBack }: Props) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [traitWeights, setTraitWeights] = useState(emptyTraitWeights)
  const [busy, setBusy] = useState(false)

  const active = MATCH_PERSONAS[activeIndex]
  const answeredIds = useMemo(() => new Set(Object.keys(answers)), [answers])
  const allAnswered = answeredIds.size === MATCH_PERSONAS.length

  const lockedPersonaId = useMemo(
    () => pickLockedPersona(traitWeights, [...answeredIds]),
    [traitWeights, answeredIds],
  )

  function handleAnswer(choice: PersonaChoice) {
    if (!active || busy || answers[active.id]) return
    setBusy(true)

    const nextAnswers = { ...answers, [active.id]: choice.label }
    setAnswers(nextAnswers)
    setTraitWeights((prev) => applyTraits(prev, choice.traits))

    window.setTimeout(() => {
      setBusy(false)
      const nextUnanswered = MATCH_PERSONAS.findIndex((p) => !nextAnswers[p.id])
      if (nextUnanswered >= 0) {
        setActiveIndex(nextUnanswered)
      }
    }, 520)
  }

  return (
    <ScreenShell className="items-center pt-4">
      <header className="mb-4 flex w-full items-center justify-between border-b border-outline-variant pb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 font-label text-xs uppercase tracking-caps text-rose transition-opacity hover:opacity-70"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back
        </button>
        <span className="font-label text-[10px] uppercase tracking-wide-caps text-outline">03 Matches</span>
        <div className="w-12" />
      </header>

      <TopOrnament title="Your Matches" icon="heart" className="mb-6" />
      <NightTag className="mb-6" />

      <motion.p
        className="mb-8 max-w-sm text-center text-base italic leading-relaxed text-text-muted"
        variants={itemVariants}
      >
        To really understand you, I need to know: what kind of life have you envisioned with your future
        partner? Let each candidate ask you something.
      </motion.p>

      <motion.div className="mb-4 flex gap-2" variants={itemVariants}>
        {MATCH_PERSONAS.map((persona, index) => (
          <div
            key={persona.id}
            className={`h-1 flex-1 transition-colors ${
              answers[persona.id]
                ? 'bg-rose'
                : index === activeIndex
                  ? 'bg-rose/40'
                  : 'bg-border'
            }`}
          />
        ))}
      </motion.div>

      {active && !allAnswered && (
        <ThoughtBubble
          question={active.question}
          choices={active.choices}
          personaName={active.name}
          onAnswer={handleAnswer}
          busy={busy || Boolean(answers[active.id])}
        />
      )}

      <PersonaTrack
        personas={MATCH_PERSONAS}
        activeIndex={activeIndex}
        answeredIds={answeredIds}
        onSelect={setActiveIndex}
      />

      {allAnswered && (
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="mb-6 text-center text-sm italic text-text-muted">
            Okay. We are done here, I think I found your one. Are you ready to meet them?
          </p>
          <p className="mb-4 text-center font-label text-[10px] uppercase tracking-wide-caps text-rose">
            Match signal · {MATCH_PERSONAS.find((p) => p.id === lockedPersonaId)?.name}
          </p>
          <HeartKeyButton onClick={() => onContinue(lockedPersonaId)}>Continue Viewing</HeartKeyButton>
        </motion.div>
      )}
    </ScreenShell>
  )
}