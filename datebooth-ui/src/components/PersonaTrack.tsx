import { motion } from 'framer-motion'
import type { MatchPersona } from '../data/personas'

type Props = {
  personas: MatchPersona[]
  activeIndex: number
  answeredIds: Set<string>
  onSelect: (index: number) => void
}

type ChipProps = {
  persona: MatchPersona
  index: number
  active: boolean
  answered: boolean
  onSelect: (index: number) => void
}

function PersonaChip({ persona, index, active, answered, onSelect }: ChipProps) {
  return (
    <motion.button
      type="button"
      onClick={() => onSelect(index)}
      className="relative flex flex-col items-center gap-1.5 p-1.5"
      animate={{ opacity: active ? 1 : 0.5 }}
      transition={{ duration: 0.25 }}
      whileTap={{ scale: 0.96 }}
    >
      <motion.div
        className={`relative shrink-0 rounded-full ${
          active
            ? 'border border-rose shadow-[0_0_0_2px_rgba(245,184,196,0.35),0_0_18px_rgba(245,184,196,0.14)]'
            : 'border border-border'
        }`}
        animate={{
          width: active ? 90 : 68,
          height: active ? 90 : 68,
        }}
        transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      >
        <div className="relative h-full w-full overflow-hidden rounded-full">
          <img
            src={persona.image}
            alt={persona.name}
            className="h-full w-full object-cover object-[center_18%]"
            loading="lazy"
          />
          {active && (
            <motion.div
              className="absolute inset-0 bg-rose/10 mix-blend-overlay"
              animate={{ opacity: [0.2, 0.45, 0.2] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          {answered && (
            <div className="absolute bottom-0.5 right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose text-ink-on-rose">
              <span className="material-symbols-outlined filled text-[10px]">check</span>
            </div>
          )}
        </div>
      </motion.div>
      <span className="font-label text-[10px] uppercase tracking-caps text-outline">
        {persona.name}
      </span>
    </motion.button>
  )
}

export function PersonaTrack({ personas, activeIndex, answeredIds, onSelect }: Props) {
  const topRow = personas.slice(0, 3)
  const bottomRow = personas.slice(3, 5)

  return (
    <div className="mb-8 w-full py-2">
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-end justify-center gap-2 sm:gap-3">
          {topRow.map((persona, rowIndex) => {
            const index = rowIndex
            return (
              <PersonaChip
                key={persona.id}
                persona={persona}
                index={index}
                active={index === activeIndex}
                answered={answeredIds.has(persona.id)}
                onSelect={onSelect}
              />
            )
          })}
        </div>
        <div className="flex items-end justify-center gap-4 sm:gap-6">
          {bottomRow.map((persona, rowIndex) => {
            const index = rowIndex + 3
            return (
              <PersonaChip
                key={persona.id}
                persona={persona}
                index={index}
                active={index === activeIndex}
                answered={answeredIds.has(persona.id)}
                onSelect={onSelect}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
