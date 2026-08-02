import { motion } from 'framer-motion'
import { HeartKeyButton } from '../components/Buttons'
import { NightTag } from '../components/NightTag'
import { ScreenShell } from '../components/ScreenShell'
import { MATCH_PERSONAS } from '../data/personas'
import { ASSETS } from '../lib/constants'
import { itemVariants } from '../lib/motion'

type Props = {
  lockedPersonaId: string
  onBack: () => void
}

export function RevealScreen({ lockedPersonaId, onBack }: Props) {
  const locked = MATCH_PERSONAS.find((p) => p.id === lockedPersonaId) ?? MATCH_PERSONAS[2]
  const revealImage = locked.image || ASSETS.companionReveal
  return (
    <ScreenShell className="items-center justify-center pt-20">
      <header className="absolute top-0 z-50 flex w-full max-w-md items-center justify-between border-b border-border bg-surface/80 px-4 py-4 backdrop-blur-sm">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 font-label text-xs uppercase tracking-caps text-rose transition-opacity hover:opacity-70"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          Back
        </button>
        <span className="font-display text-lg tracking-widest text-rose">Datebooth</span>
        <div className="w-16" />
      </header>

      <motion.div className="mb-8 flex w-full max-w-sm flex-col items-center text-center" variants={itemVariants}>
        <span className="material-symbols-outlined filled mb-4 text-3xl text-rose">favorite</span>
        <h1 className="font-display text-5xl uppercase leading-tight tracking-wide text-rose">
          Your
          <br />
          Companion
        </h1>
        <div className="my-6 flex w-full items-center justify-center gap-4 opacity-60">
          <div className="h-px flex-grow bg-border" />
          <div className="h-1.5 w-1.5 rotate-45 bg-border" />
          <div className="h-px flex-grow bg-border" />
        </div>
        <p className="flex items-center justify-center gap-2 font-label text-[10px] uppercase tracking-wide-caps text-outline">
          <span className="material-symbols-outlined filled text-[10px] text-rose">favorite</span>
          House of Negotiated Selves
          <span className="material-symbols-outlined filled text-[10px] text-rose">favorite</span>
        </p>
      </motion.div>

      <NightTag state="matched" className="mb-8" />

      <motion.p
        className="mb-10 max-w-xs text-center text-base italic leading-relaxed text-text-muted"
        variants={itemVariants}
      >
        &ldquo;They are waiting for you, just a few steps away, go through the curtains.&rdquo;
      </motion.p>

      <motion.div
        className="group relative mb-10 aspect-[0.5] w-full max-w-xs border border-border bg-panel-lowest p-2"
        variants={itemVariants}
        whileHover={{ scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        <div className="pointer-events-none absolute inset-0 z-0 bg-rose/5 blur-xl transition-colors duration-700 group-hover:bg-rose/10" />
        <div className="relative z-10 flex h-full w-full flex-col justify-end overflow-hidden border border-border p-4">
          <img
            src={revealImage}
            alt={`${locked.name}, your companion`}
            className="absolute inset-0 h-full w-full object-cover object-[center_15%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-panel-lowest via-transparent to-transparent" />
          <div className="relative z-20 flex w-full flex-col items-center pb-4">
            <div className="mb-2 h-px w-full bg-border/50" />
            <div className="mb-1 h-0.5 w-3/4 bg-rose/40" />
            <div className="h-1 w-1/2 bg-rose/20" />
          </div>
          <div className="absolute right-4 top-4 z-20 flex h-16 w-16 flex-col items-center justify-center rounded-full border border-rose bg-panel-lowest/80 shadow-[0_0_15px_rgba(230,159,181,0.2)] backdrop-blur-sm">
            <span className="text-center font-label text-[8px] uppercase leading-tight tracking-wide-caps text-rose">
              {locked.name}
              <br />
              Match
            </span>
          </div>
        </div>
      </motion.div>

      <HeartKeyButton>Enter Chamber</HeartKeyButton>
    </ScreenShell>
  )
}
