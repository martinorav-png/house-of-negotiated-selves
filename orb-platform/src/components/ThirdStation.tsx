import { lazy, Suspense, useEffect, useRef, useState, type RefObject } from 'react'
import { mirrorSettings } from '../dev/mirrorSettingsStore'
import { MirrorGuideOrb } from './MirrorGuideOrb'
import { MirrorHeadline } from './MirrorHeadline'
import './ThirdStation.css'

const MirrorDevPanel = lazy(() =>
  import('../dev/MirrorDevPanel').then((m) => ({ default: m.MirrorDevPanel })),
)

type Phase = 'intro' | 'prompt' | 'recording' | 'loading'

const LIVE_POLL_MS = 150

const STATUS_LABEL: Record<Phase, string> = {
  intro: 'STANDBY',
  prompt: 'LISTENING',
  recording: 'RECORDING',
  loading: 'PROCESSING',
}

/**
 * Bridges mirrorSettings.background/accent (plain objects, no leva
 * dependency, safe for production) into CSS custom properties — set on
 * this component's own root element only, never redeclared anywhere else
 * in ThirdStation.css, so there's no risk of the local-declaration-shadows-
 * ancestor bug that broke the Cards station's color controls.
 */
function useLiveMirrorTheme(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    let raf = 0
    let last = 0
    const tick = (now: number) => {
      if (now - last >= LIVE_POLL_MS) {
        last = now
        const root = rootRef.current
        if (root) {
          root.style.setProperty('--mirror-bg-top', mirrorSettings.background.top)
          root.style.setProperty('--mirror-bg-bottom', mirrorSettings.background.bottom)
          root.style.setProperty('--mirror-accent', mirrorSettings.accent.color)
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [rootRef])
}

/** The 3-2-1 countdown reuses the same dot row shown during the reading
 * hold — filling in one dot per step — rather than switching to numerals,
 * so the countdown stays in the orb's point/particle visual language. */
function Dots({ lit }: { lit: number }) {
  return (
    <div className="mirror-dots" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <span key={i} className={i < lit ? 'mirror-dot is-lit' : 'mirror-dot'} />
      ))}
    </div>
  )
}

/** Four static arcs, slowly spun by a CSS animation — the idle companion
 * to the loading screen's progress-driven ring, present whenever the orb
 * is on screen so the ring reads as one continuous motif, not something
 * that only appears once at the end. */
function IdleRing() {
  return (
    <div className="mirror-idle-ring" aria-hidden="true">
      <svg viewBox="0 0 200 200">
        {[0, 1, 2, 3].map((i) => (
          <circle
            key={i}
            cx="100"
            cy="100"
            r="86"
            className="mirror-loading-arc"
            style={{ transform: `rotate(${i * 90}deg)`, transformOrigin: '100px 100px' }}
          />
        ))}
      </svg>
    </div>
  )
}

function LoadingRing({ progress }: { progress: number }) {
  return (
    <div className="mirror-loading-ring" aria-hidden="true">
      <svg viewBox="0 0 200 200">
        {[0, 1, 2, 3].map((i) => (
          <circle
            key={i}
            cx="100"
            cy="100"
            r="86"
            className="mirror-loading-arc"
            style={{
              transform: `rotate(${i * 90 + progress * 360}deg)`,
              transformOrigin: '100px 100px',
            }}
          />
        ))}
      </svg>
    </div>
  )
}

function GuideOrb({ variant, progress }: { variant: 'idle' | 'loading'; progress?: number }) {
  return (
    <div className="mirror-orb-ring-slot">
      <MirrorGuideOrb className="mirror-orb-canvas" />
      {variant === 'idle' ? <IdleRing /> : <LoadingRing progress={progress ?? 0} />}
    </div>
  )
}

function RecordingFrame({ secondsLeft, totalSeconds }: { secondsLeft: number; totalSeconds: number }) {
  const progress = 1 - secondsLeft / totalSeconds
  return (
    <div className="mirror-record-frame">
      <span className="mirror-hud-corner mirror-hud-corner-tl" />
      <span className="mirror-hud-corner mirror-hud-corner-tr" />
      <span className="mirror-hud-corner mirror-hud-corner-bl" />
      <span className="mirror-hud-corner mirror-hud-corner-br" />
      <div className="mirror-rec-indicator">
        <span className="mirror-rec-dot" />
        REC
      </div>
      <div className="mirror-record-timer">
        <svg viewBox="0 0 64 64" className="mirror-record-timer-ring">
          <circle cx="32" cy="32" r="28" className="mirror-record-timer-track" />
          <circle
            cx="32"
            cy="32"
            r="28"
            className="mirror-record-timer-progress"
            style={{ strokeDashoffset: `${(1 - progress) * 2 * Math.PI * 28}px` }}
          />
        </svg>
        <span className="mirror-record-timer-value">{Math.ceil(secondsLeft)}</span>
      </div>
    </div>
  )
}

export function ThirdStation() {
  const rootRef = useRef<HTMLElement>(null)
  useLiveMirrorTheme(rootRef)

  const [phase, setPhase] = useState<Phase>('intro')
  const [countdown, setCountdown] = useState<number | null>(null)
  const [recordSecondsLeft, setRecordSecondsLeft] = useState(mirrorSettings.timing.recordingSeconds)
  const [loadingProgress, setLoadingProgress] = useState(0)

  // Phase advance chain — reads current durations at the moment each timer
  // is scheduled, so tuning the panel mid-loop takes effect next cycle
  // rather than needing a remount.
  useEffect(() => {
    const timers: number[] = []
    const t = mirrorSettings.timing

    if (phase === 'intro') {
      timers.push(window.setTimeout(() => setPhase('prompt'), t.introSeconds * 1000))
    } else if (phase === 'prompt') {
      setCountdown(null)
      timers.push(
        window.setTimeout(() => {
          setCountdown(3)
          timers.push(
            window.setTimeout(() => {
              setCountdown(2)
              timers.push(
                window.setTimeout(() => {
                  setCountdown(1)
                  timers.push(
                    window.setTimeout(() => {
                      setCountdown(null)
                      setPhase('recording')
                    }, t.countdownStepSeconds * 1000),
                  )
                }, t.countdownStepSeconds * 1000),
              )
            }, t.countdownStepSeconds * 1000),
          )
        }, t.promptSeconds * 1000),
      )
    } else if (phase === 'recording') {
      setRecordSecondsLeft(t.recordingSeconds)
      timers.push(window.setTimeout(() => setPhase('loading'), t.recordingSeconds * 1000))
    } else if (phase === 'loading') {
      setLoadingProgress(0)
      timers.push(window.setTimeout(() => setPhase('intro'), t.loadingSeconds * 1000))
    }

    return () => timers.forEach((id) => window.clearTimeout(id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Second-by-second recording countdown display + smooth loading progress —
  // both derived from elapsed time against the same durations used above.
  useEffect(() => {
    if (phase !== 'recording') return
    const start = performance.now()
    const total = mirrorSettings.timing.recordingSeconds * 1000
    let raf = 0
    const tick = () => {
      const elapsed = performance.now() - start
      setRecordSecondsLeft(Math.max(0, (total - elapsed) / 1000))
      if (elapsed < total) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  useEffect(() => {
    if (phase !== 'loading') return
    const start = performance.now()
    const total = mirrorSettings.timing.loadingSeconds * 1000
    let raf = 0
    const tick = () => {
      const elapsed = performance.now() - start
      setLoadingProgress(Math.min(1, elapsed / total))
      if (elapsed < total) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  return (
    <section className="third-station" aria-label="Mirror station" ref={rootRef}>
      <div className="mirror-frame">
        <span className="mirror-frame-corner mirror-frame-corner-tl" aria-hidden="true" />
        <span className="mirror-frame-corner mirror-frame-corner-tr" aria-hidden="true" />
        <span className="mirror-frame-corner mirror-frame-corner-bl" aria-hidden="true" />
        <span className="mirror-frame-corner mirror-frame-corner-br" aria-hidden="true" />
        <div className="mirror-status-label" aria-hidden="true">
          <span className="mirror-status-marker" />
          {STATUS_LABEL[phase]}
        </div>

        {phase === 'intro' ? (
          <div className="mirror-screen mirror-screen-intro">
            <GuideOrb variant="idle" />
            <MirrorHeadline lines={['Now is your chance']} className="mirror-headline" />
          </div>
        ) : null}

        {phase === 'prompt' ? (
          <div className="mirror-screen mirror-screen-prompt">
            <GuideOrb variant="idle" />
            <MirrorHeadline
              lines={['Introduce yourself to', 'your future partner']}
              className="mirror-headline"
            />
            <Dots lit={countdown === null ? 0 : 4 - countdown} />
          </div>
        ) : null}

        {phase === 'recording' ? (
          <div className="mirror-screen mirror-screen-recording">
            <RecordingFrame
              secondsLeft={recordSecondsLeft}
              totalSeconds={mirrorSettings.timing.recordingSeconds}
            />
          </div>
        ) : null}

        {phase === 'loading' ? (
          <div className="mirror-screen mirror-screen-loading">
            <MirrorHeadline lines={['Creating', 'match']} className="mirror-headline" />
            <GuideOrb variant="loading" progress={loadingProgress} />
            <div className="mirror-loading-readout">
              COMPILING MATCH DATA — {Math.round(loadingProgress * 100)}%
            </div>
          </div>
        ) : null}

        <span className="mirror-horizon" aria-hidden="true" />
      </div>

      {import.meta.env.DEV ? (
        <Suspense fallback={null}>
          <MirrorDevPanel />
        </Suspense>
      ) : null}
    </section>
  )
}
