import { AnimatePresence, motion } from 'framer-motion'
import type { PersonaChoice } from '../data/personas'

type Props = {
  question: string
  choices: PersonaChoice[]
  personaName: string
  onAnswer: (choice: PersonaChoice) => void
  busy?: boolean
}

export function ThoughtBubble({ question, choices, personaName, onAnswer, busy }: Props) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question}
        className="relative mb-6 w-full max-w-sm bureau-border bg-panel-lowest p-6 text-center shadow-[0_0_40px_rgba(245,184,196,0.08)]"
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -12, scale: 0.98 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <p className="mb-1 font-label text-[10px] uppercase tracking-wide-caps text-rose">{personaName}</p>
        <p className="mb-6 font-display text-xl leading-snug text-text">&ldquo;{question}&rdquo;</p>
        <div className="flex flex-col gap-3">
          {choices.map((choice) => (
            <motion.button
              key={choice.label}
              type="button"
              disabled={busy}
              whileHover={busy ? undefined : { scale: 1.01 }}
              whileTap={busy ? undefined : { scale: 0.98 }}
              onClick={() => onAnswer(choice)}
              className="w-full border border-border bg-surface py-3 px-4 text-sm text-text transition-colors hover:border-rose hover:text-rose disabled:opacity-50"
            >
              {choice.label}
            </motion.button>
          ))}
        </div>
        <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-border bg-panel-lowest" />
      </motion.div>
    </AnimatePresence>
  )
}
