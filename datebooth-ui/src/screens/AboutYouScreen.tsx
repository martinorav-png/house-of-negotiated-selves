import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { HeartKeyButton } from '../components/Buttons'
import { IdRinglightCard } from '../components/IdRinglightCard'
import { NightTag } from '../components/NightTag'
import { HairlineHeartOrnament } from '../components/Ornaments'
import { ScreenShell } from '../components/ScreenShell'
import { itemVariants } from '../lib/motion'

type Props = {
  onContinue: () => void
}

function makeIdNumber(name: string): string {
  const seed = name
    .toUpperCase()
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const a = String(8000 + (seed % 1000)).padStart(4, '0')
  const b = String(1000 + ((seed * 7) % 9000)).padStart(4, '0')
  const c = String(1000 + ((seed * 13) % 9000)).padStart(4, '0')
  return `${a}-${b}-${c}`
}

export function AboutYouScreen({ onContinue }: Props) {
  const [name, setName] = useState('')
  const visitorName = useMemo(() => {
    const raw = name.trim().toUpperCase()
    return raw || 'VISITOR'
  }, [name])
  const idNumber = useMemo(() => makeIdNumber(visitorName), [visitorName])

  return (
    <ScreenShell className="items-center justify-center">
      <HairlineHeartOrnament />

      <motion.div className="mb-10 flex flex-col items-center text-center" variants={itemVariants}>
        <h1 className="font-display text-4xl uppercase tracking-wide-caps text-rose">About You</h1>
        <div className="diamond my-6 opacity-80" />
        <div className="mb-8 flex items-center gap-2">
          <span className="material-symbols-outlined filled text-[10px] text-rose">favorite</span>
          <span className="font-label text-[10px] uppercase tracking-wide-caps text-outline">
            House of Negotiated Selves
          </span>
          <span className="material-symbols-outlined filled text-[10px] text-rose">favorite</span>
        </div>
        <NightTag />
      </motion.div>

      <motion.div
        className="mb-8 w-full bureau-border bg-panel-lowest p-6 text-center"
        variants={itemVariants}
      >
        <p className="text-base leading-relaxed text-text">
          <span className="font-medium text-rose">Debra:</span> Now, just answer what comes up on the
          mirror. You can type it out on the keyboard in front of you.
        </p>
      </motion.div>

      <motion.div
        className="relative mb-12 w-full bureau-border bg-surface p-8"
        variants={itemVariants}
      >
        <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-rose to-transparent opacity-20" />
        <label
          htmlFor="government-name"
          className="mb-6 block w-full text-center font-label text-xs uppercase tracking-wide-caps text-text-muted"
        >
          What is your full government name.
        </label>
        <div className="group relative w-full">
          <input
            id="government-name"
            name="government-name"
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && name.trim()) onContinue()
            }}
            placeholder="Type your full government name..."
            className="w-full border-0 border-b border-border bg-transparent pb-3 pt-2 text-center font-label text-[10px] uppercase tracking-wide-caps text-rose placeholder:text-outline-variant/50 focus:border-rose focus:outline-none focus:ring-0"
          />
          <motion.div
            className="absolute bottom-0 left-0 h-px w-full origin-center bg-rose"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: name ? 1 : 0 }}
            whileFocus={{ scaleX: 1 }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.div>

      <motion.div className="mb-12 w-full" variants={itemVariants}>
        <IdRinglightCard
          visitorName={visitorName}
          visitorRole="Intake subject"
          idNumber={idNumber}
        />
      </motion.div>

      <HeartKeyButton onClick={onContinue} disabled={!name.trim()}>
        Continue Viewing
      </HeartKeyButton>
    </ScreenShell>
  )
}
