import { motion, useReducedMotion } from 'framer-motion'
import { useEffect, useState } from 'react'

type Props = {
  className?: string
}

const ECG_PATH =
  'M0 40 H24 L30 40 L34 14 L38 52 L42 40 H66 L70 40 L74 18 L78 48 L82 40 H106 L110 40 L114 12 L118 54 L122 40 H146 L150 40 L154 20 L158 46 L162 40 H186 L190 40 L194 16 L198 50 L202 40 H226 L230 40 L234 22 L238 44 L242 40 H266 L270 40 L274 10 L278 56 L282 40 H306 L310 40 L314 24 L318 42 L322 40 H346 L350 40 L354 18 L358 48 L362 40 H400'

export function HeartbeatMonitor({ className = '' }: Props) {
  const reduce = useReducedMotion()
  const [bpm, setBpm] = useState(72)

  useEffect(() => {
    if (reduce) return
    const id = window.setInterval(() => {
      setBpm(68 + Math.floor(Math.random() * 9))
    }, 2200)
    return () => window.clearInterval(id)
  }, [reduce])

  return (
    <motion.div
      className={`relative overflow-hidden bureau-border bg-panel-lowest ${className}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      aria-hidden
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(245,184,196,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(245,184,196,0.04)_1px,transparent_1px)] bg-size-[24px_24px]" />

      <div className="relative z-10 flex h-full flex-col justify-between p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="text-left">
            <p className="font-label text-[10px] uppercase tracking-wide-caps text-outline">
              Compatibility signal
            </p>
            <p className="mt-1 font-label text-[10px] uppercase tracking-wide-caps text-rose">
              Monitoring
            </p>
          </div>
          <div className="text-right">
            <p className="font-label text-[10px] uppercase tracking-wide-caps text-outline">BPM</p>
            <motion.p
              key={bpm}
              className="font-display text-3xl leading-none text-rose"
              initial={{ opacity: 0.4, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              {bpm}
            </motion.p>
          </div>
        </div>

        <div className="relative mt-4 flex-1 overflow-hidden border border-border/70 bg-void/60">
          <div className="absolute inset-0 flex items-center">
            <motion.div
              className="flex w-[200%]"
              animate={reduce ? undefined : { x: ['0%', '-50%'] }}
              transition={{
                duration: 4.8,
                ease: 'linear',
                repeat: Infinity,
              }}
            >
              {[0, 1].map((key) => (
                <svg
                  key={key}
                  viewBox="0 0 400 80"
                  preserveAspectRatio="none"
                  className="h-full min-h-24 w-1/2 shrink-0"
                >
                  <path
                    d={ECG_PATH}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-rose"
                  />
                </svg>
              ))}
            </motion.div>
          </div>

          <motion.div
            className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-rose/50"
            animate={reduce ? undefined : { opacity: [0.25, 0.7, 0.25] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="absolute left-3 top-3 flex items-center gap-2">
            <motion.span
              className="h-2 w-2 rounded-full bg-rose"
              animate={reduce ? undefined : { scale: [1, 1.35, 1], opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
            />
            <span className="font-label text-[9px] uppercase tracking-wide-caps text-text-muted">
              Live
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between font-label text-[9px] uppercase tracking-wide-caps text-outline">
          <span>Rhythm stable</span>
          <span>Desire channel</span>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-void/30 via-transparent to-transparent" />
    </motion.div>
  )
}
