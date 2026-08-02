import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'
import { NightTag } from '../components/NightTag'
import { ScreenShell } from '../components/ScreenShell'
import { ASSETS } from '../lib/constants'
import { itemVariants } from '../lib/motion'

type Props = {
  onComplete: () => void
}

export function ForgingScreen({ onComplete }: Props) {
  const progress = useMotionValue(0)
  const width = useTransform(progress, (v) => `${v}%`)
  const [percent, setPercent] = useState(0)

  useEffect(() => {
    const controls = animate(progress, 72, {
      duration: 2.4,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setPercent(Math.round(v)),
    })

    const timer = window.setTimeout(() => onComplete(), 4200)
    return () => {
      controls.stop()
      window.clearTimeout(timer)
    }
  }, [onComplete, progress])

  return (
    <ScreenShell className="items-center justify-center pt-24">
      <motion.header className="pointer-events-none fixed top-0 z-20 flex w-full max-w-md flex-col items-center pt-10" variants={itemVariants}>
        <span className="material-symbols-outlined mb-4 text-[32px] text-rose">diamond</span>
        <h1 className="text-center font-display text-2xl font-semibold uppercase tracking-wide-caps text-rose md:text-3xl">
          Forging Your Companion
        </h1>
        <div className="mt-6 flex items-center gap-4">
          <span className="material-symbols-outlined text-[12px] text-outline-variant">favorite</span>
          <div className="h-px w-12 bg-outline-variant" />
          <span className="font-label text-[10px] uppercase tracking-wide-caps text-outline">
            House of Negotiated Selves
          </span>
          <div className="h-px w-12 bg-outline-variant" />
          <span className="material-symbols-outlined text-[12px] text-outline-variant">favorite</span>
        </div>
        <NightTag state="reserved" className="mt-8" />
      </motion.header>

      <motion.p
        className="mb-12 max-w-md text-center text-base italic text-text-muted"
        variants={itemVariants}
      >
        Okay. We are done here, I think I found your one. Are you ready to meet them?
      </motion.p>

      <motion.div
        className="relative mb-16 flex aspect-[0.5] w-full max-w-sm flex-col items-center justify-end rounded-lg border border-border bg-panel-lowest/50 p-4 shadow-[0_0_40px_rgba(230,159,181,0.15)]"
        variants={itemVariants}
        animate={{ boxShadow: ['0 0 40px rgba(230,159,181,0.1)', '0 0 60px rgba(230,159,181,0.2)', '0 0 40px rgba(230,159,181,0.1)'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="pointer-events-none absolute inset-0 p-8">
          <img
            src={ASSETS.companionForging}
            alt=""
            className="h-full w-full object-contain opacity-80 mix-blend-luminosity"
          />
        </div>

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 border border-border/30" />
          <div className="absolute top-1/4 h-px w-full bg-border/30" />
          <div className="absolute top-2/4 h-px w-full bg-border/30" />
          <div className="absolute top-3/4 h-px w-full bg-border/30" />
          <div className="absolute left-1/2 h-full w-px bg-border/30" />
        </div>

        <div className="relative z-20 mt-auto w-4/5">
          <div className="relative h-0.5 w-full bg-border">
            <div className="absolute inset-0 bg-rose/20 blur-sm" />
          </div>
          <div className="relative mt-4 h-px w-full bg-border">
            <motion.div className="absolute left-0 top-0 h-full bg-rose" style={{ width }} />
          </div>
          <div className="mt-2 flex w-full justify-between">
            <span className="font-label text-[10px] uppercase tracking-wide-caps text-outline">
              Assembly_Progress
            </span>
            <motion.span className="font-label text-[10px] text-rose">{percent}%</motion.span>
          </div>
        </div>
      </motion.div>

      <motion.button
        type="button"
        disabled
        className="border border-border bg-panel px-8 py-4 font-label text-xs uppercase tracking-wide-caps text-outline opacity-50"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        Preparing Your Match
      </motion.button>

      <div className="pointer-events-none fixed inset-0 z-50 shadow-[inset_0_0_150px_rgba(10,15,20,1)]" />
    </ScreenShell>
  )
}
