import { motion } from 'framer-motion'
import { useState } from 'react'
import { HeartKeyButton } from '../components/Buttons'
import { HeartbeatMonitor } from '../components/HeartbeatMonitor'
import { NightTag } from '../components/NightTag'
import { TopOrnament } from '../components/Ornaments'
import { ScreenShell } from '../components/ScreenShell'
import { itemVariants } from '../lib/motion'

type Props = {
  onContinue: () => void
  onBack: () => void
}

export function HowYouLoveScreen({ onContinue, onBack }: Props) {
  const [location, setLocation] = useState('')
  const [activity, setActivity] = useState('')
  const [meal, setMeal] = useState('')
  const [dealbreaker, setDealbreaker] = useState('')
  const [rideOrDie, setRideOrDie] = useState<'yes' | 'no' | null>(null)

  const canContinue = Boolean(location && activity && meal && dealbreaker && rideOrDie)

  return (
    <ScreenShell className="items-center text-center">
      <header className="mb-4 flex w-full items-center justify-between border-b border-outline-variant pb-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 font-label text-xs uppercase tracking-caps text-rose transition-opacity hover:opacity-70"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back
        </button>
        <span className="font-display text-lg tracking-tight text-rose">Datebooth</span>
        <div className="w-12" />
      </header>

      <TopOrnament title="How Do You Love" icon="florist" className="mb-8" />
      <NightTag className="mb-8" />

      <motion.p
        className="mb-10 max-w-sm text-base italic leading-relaxed text-text-muted"
        variants={itemVariants}
      >
        &ldquo;To really understand you, I need to know: what kind of life have you envisioned with your
        future partner?&rdquo;
      </motion.p>

      <motion.div
        className="relative mb-10 flex w-full flex-col gap-8 bureau-border bg-panel-lowest p-6 text-left"
        variants={itemVariants}
      >
        <p className="leading-loose text-text">
          Our perfect morning/date would be us going to{' '}
          <BlankInput value={location} onChange={setLocation} placeholder="location" />
          then doing{' '}
          <BlankInput value={activity} onChange={setActivity} placeholder="activity" />
          and then having{' '}
          <BlankInput value={meal} onChange={setMeal} placeholder="meal/event" />.
        </p>

        <div className="flex flex-col gap-4">
          <label className="font-label text-xs uppercase tracking-caps text-outline">
            Dealbreaker / Nonnegotiable
          </label>
          <p className="text-text">The partner needs to be / have...</p>
          <textarea
            value={dealbreaker}
            onChange={(e) => setDealbreaker(e.target.value)}
            placeholder="Enter criteria..."
            className="h-24 w-full resize-none border border-border bg-transparent p-3 text-rose placeholder:text-border focus:border-rose focus:outline-none"
          />
        </div>

        <div className="mt-4 flex flex-col items-center gap-4 border-t border-border pt-6">
          <p className="mb-2 text-center text-text">Would you want this person to be your ride or die?</p>
          <div className="flex w-full gap-4">
            <YesNoPad
              label="Yes"
              selected={rideOrDie === 'yes'}
              onSelect={() => setRideOrDie('yes')}
            />
            <YesNoPad
              label="No"
              selected={rideOrDie === 'no'}
              onSelect={() => setRideOrDie('no')}
            />
          </div>
        </div>
      </motion.div>

      <HeartbeatMonitor className="mb-12 h-64 w-full" />

      <HeartKeyButton onClick={onContinue} disabled={!canContinue}>
        Continue Viewing
      </HeartKeyButton>
    </ScreenShell>
  )
}

function BlankInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="mx-1 w-28 border-0 border-b border-outline-variant bg-transparent px-2 text-center text-rose transition-colors placeholder:text-border focus:border-rose focus:outline-none"
    />
  )
}

function YesNoPad({
  label,
  selected,
  onSelect,
}: {
  label: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.97 }}
      className={`flex-1 border py-4 font-label text-xs uppercase tracking-caps transition-colors ${
        selected
          ? 'border-rose bg-rose/10 text-rose'
          : 'border-border text-text hover:bg-panel'
      }`}
    >
      {label}
    </motion.button>
  )
}
