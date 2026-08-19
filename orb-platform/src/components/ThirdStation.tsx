import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react'
import { mirrorSettings } from '../dev/mirrorSettingsStore'
import { getDeviceQuality } from '../lib/deviceQuality'
import { useStationVibe } from '../hooks/useStationVibe'
import { MirrorGuideOrb } from './MirrorGuideOrb'
import { MirrorHeadline } from './MirrorHeadline'
import {
  DebraVoiceClip,
  thirdStationDebraClipFor,
  type ThirdStationVoicePhase,
} from './DebraVoice'
import './ThirdStation.css'

const MirrorDevPanel = lazy(() =>
  import('../dev/MirrorDevPanel').then((m) => ({ default: m.MirrorDevPanel })),
)

type Phase = ThirdStationVoicePhase

const LIVE_POLL_MS = 150

const STATUS_LABEL_WARM: Record<Phase, string> = {
  intro: 'Ready',
  prompt: 'Listening',
  recording: 'Recording',
  loading: 'Working',
}

const STATUS_LABEL_ORIGINAL: Record<Phase, string> = {
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
    const apply = () => {
      const root = rootRef.current
      if (!root) return
      root.style.setProperty('--mirror-bg-top', mirrorSettings.background.top)
      root.style.setProperty('--mirror-bg-bottom', mirrorSettings.background.bottom)
      root.style.setProperty('--mirror-accent', mirrorSettings.accent.color)
    }
    apply()
    if (!import.meta.env.DEV) return

    let raf = 0
    let last = 0
    const tick = (now: number) => {
      if (now - last >= LIVE_POLL_MS) {
        last = now
        apply()
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

/** Each ring segment is drawn twice — a wider, blurred "glow" arc behind a
 * thinner crisp one — matching the reference's soft double-layered ring
 * rather than a single flat stroke. */
function RingSegments({ rotation }: { rotation: number }) {
  return (
    <>
      {[0, 1, 2, 3].map((i) => (
        <circle
          key={`glow-${i}`}
          cx="100"
          cy="100"
          r="86"
          className="mirror-loading-arc mirror-loading-arc-glow"
          style={{ transform: `rotate(${i * 90 + rotation}deg)`, transformOrigin: '100px 100px' }}
        />
      ))}
      {[0, 1, 2, 3].map((i) => (
        <circle
          key={`crisp-${i}`}
          cx="100"
          cy="100"
          r="86"
          className="mirror-loading-arc"
          style={{ transform: `rotate(${i * 90 + rotation}deg)`, transformOrigin: '100px 100px' }}
        />
      ))}
    </>
  )
}

/** Slowly spun by a CSS animation — the idle companion to the loading
 * screen's progress-driven ring, present whenever the orb is on screen so
 * the ring reads as one continuous motif, not something that only appears
 * once at the end. */
function IdleRing() {
  return (
    <div className="mirror-idle-ring" aria-hidden="true">
      <svg viewBox="0 0 200 200">
        <RingSegments rotation={0} />
      </svg>
    </div>
  )
}

function LoadingRing({ progress }: { progress: number }) {
  return (
    <div className="mirror-loading-ring" aria-hidden="true">
      <svg viewBox="0 0 200 200">
        <RingSegments rotation={progress * 360} />
      </svg>
    </div>
  )
}

/** Real (if meaningless) filler content — hex/coordinate/status noise —
 * rather than abstract bars, since actual illegible-at-a-glance text is
 * what the reference is doing too; a couple of key/value header lines sit
 * above a scrolling body pulled from this pool. */
const CODE_HEADERS: [string, string][] = [
  ['NODE  0x7F2C', 'SIG  92.4%'],
  ['SEQ  884219', 'CH  14/16'],
  ['REF  A3.09', 'SYNC  0x4F'],
  ['CTRL  0x9F1', 'BUS  2/4'],
]

const CODE_BODY_POOL = [
  'buffer.flush(node=12) ok',
  'req 200 · 14.2ms',
  'vector[7] = 0.8341',
  'thermal Δ -0.02C',
  'auth token refreshed',
  'queue depth 128/512',
  'checksum 9f3a..c21',
  'sample #442 captured',
  'latency p99 8.7ms',
  'compiling match.bin',
  '0x22F1 :: nominal',
  'gyro 0.004 0.991 -0.02',
  'hash 7b2c4e91',
  'frame 0441/0512',
  'resolving vector map',
  'sig-to-noise 41.2dB',
  'cache miss rate 2.1%',
  'node cluster synced',
  'delta 0.0031s',
  'biometric variance low',
  'encoding stream b',
  '42.771, -8.220',
  'retry(3) succeeded',
  'handshake complete',
  'voice print matched',
  'align pass 3/5',
  'temp core 36.6C',
  'packet loss 0.0%',
  'index rebuilt ok',
]

const CODE_ALERTS = [
  'ERR 0x22 checksum_fail',
  'WARN drift +0.4%',
  'retry limit reached',
  'signal degraded',
]

const LINES_PER_BLOCK = 10
const CODE_LINE_PX = 9.6

/** A small, mostly-illegible "log panel" — a fixed key/value header over a
 * body that jump-cuts a whole block of lines at a time (steps() timing, no
 * interpolation in between) rather than scrolling smoothly, closer to how
 * the reference's panels actually move. Body content is doubled so the
 * loop is seamless. One row can render as a dim red "alert" line. Large
 * panels show more blocks at once (a dense wall of text, matching the
 * reference's dominant block) while ghost/secondary ones stay compact. */
function CodePanel({
  seed,
  blockCount = 3,
  visibleRows = 5,
  large = false,
  style,
  ghost = false,
  duration = 5,
  hasAlert = false,
}: {
  seed: number
  blockCount?: number
  visibleRows?: number
  large?: boolean
  style?: CSSProperties
  ghost?: boolean
  duration?: number
  hasAlert?: boolean
}) {
  const [h1, h2] = CODE_HEADERS[seed % CODE_HEADERS.length]
  const rowCount = blockCount * LINES_PER_BLOCK
  const rows = Array.from(
    { length: rowCount },
    (_, i) => CODE_BODY_POOL[(seed * 5 + i * 3) % CODE_BODY_POOL.length],
  )
  const alertIndex = hasAlert ? seed % rowCount : -1
  if (alertIndex >= 0) rows[alertIndex] = CODE_ALERTS[seed % CODE_ALERTS.length]

  const blocks = Array.from({ length: blockCount }, (_, b) =>
    rows.slice(b * LINES_PER_BLOCK, b * LINES_PER_BLOCK + LINES_PER_BLOCK),
  )

  return (
    <div
      className={ghost ? 'mirror-code-panel is-ghost' : large ? 'mirror-code-panel is-lg' : 'mirror-code-panel'}
      style={style}
      aria-hidden="true"
    >
      <div className="mirror-code-header">
        <span>{h1}</span>
        <span>{h2}</span>
      </div>
      <div
        className="mirror-code-scroll"
        style={
          {
            '--dur': `${duration}s`,
            '--steps': blockCount,
            '--h': `${visibleRows * CODE_LINE_PX}px`,
          } as CSSProperties
        }
      >
        <div className="mirror-code-track">
          {[0, 1].map((copy) =>
            blocks.map((block, b) => (
              <div className="mirror-code-block" key={`${copy}-${b}`}>
                {block.map((text, i) => {
                  const rowIndex = b * LINES_PER_BLOCK + i
                  return (
                    <div
                      key={i}
                      className={rowIndex === alertIndex ? 'mirror-code-row is-alert' : 'mirror-code-row'}
                    >
                      {text}
                    </div>
                  )
                })}
              </div>
            )),
          )}
        </div>
      </div>
    </div>
  )
}

/** A tiny fake progress sliver — fixed base fill that idly ticks up and
 * back down, standing in for a background diagnostic process. */
function MiniBar({ style, fill }: { style?: CSSProperties; fill: number }) {
  return (
    <span
      className="mirror-mini-bar"
      aria-hidden="true"
      style={{ ...style, '--fill': `${fill}%` } as CSSProperties}
    />
  )
}

type DebrisPanel = {
  seed: number
  blockCount?: number
  visibleRows?: number
  large?: boolean
  duration?: number
  hasAlert?: boolean
  ghost?: boolean
  style: CSSProperties
}
type DebrisBar = { style: CSSProperties; fill: number }

/** A different arrangement — different corners, different seeds (so the
 * content itself differs, not just position) — per phase, so the debris
 * visibly relocates and rewrites itself each time the scene changes
 * instead of sitting frozen in one spot for the whole loop. */
const DEBRIS_LAYOUTS: Record<Phase, { panels: DebrisPanel[]; bars: DebrisBar[] }> = {
  intro: {
    panels: [
      {
        seed: 1,
        blockCount: 3,
        visibleRows: 10,
        large: true,
        hasAlert: true,
        duration: 10,
        style: { top: '68px', left: '37px', opacity: 0.4 },
      },
      {
        seed: 2,
        blockCount: 2,
        visibleRows: 6,
        ghost: true,
        duration: 13,
        style: { top: '154px', left: '58px', opacity: 0.16 },
      },
      {
        seed: 3,
        blockCount: 2,
        visibleRows: 6,
        duration: 11,
        style: { top: '96px', right: '-16px', opacity: 0.24 },
      },
    ],
    bars: [
      { style: { top: '58px', right: '46%', opacity: 0.2 }, fill: 35 },
      { style: { top: '216px', left: '-6px', opacity: 0.16 }, fill: 62 },
    ],
  },
  prompt: {
    panels: [
      {
        seed: 5,
        blockCount: 3,
        visibleRows: 10,
        large: true,
        hasAlert: true,
        duration: 9,
        style: { bottom: '15%', left: '-14px', opacity: 0.32 },
      },
      {
        seed: 6,
        blockCount: 2,
        visibleRows: 6,
        ghost: true,
        duration: 12,
        style: { bottom: 'calc(15% - 30px)', left: '40px', opacity: 0.15 },
      },
      {
        seed: 7,
        blockCount: 2,
        visibleRows: 6,
        duration: 10,
        style: { top: '70px', right: '30px', opacity: 0.22 },
      },
    ],
    bars: [
      { style: { top: '60px', left: '40px', opacity: 0.18 }, fill: 48 },
      { style: { bottom: '9%', right: '-6px', opacity: 0.2 }, fill: 28 },
    ],
  },
  recording: {
    panels: [
      {
        seed: 8,
        blockCount: 3,
        visibleRows: 10,
        large: true,
        hasAlert: true,
        duration: 8,
        style: { top: '64px', right: '-16px', opacity: 0.3 },
      },
      {
        seed: 9,
        blockCount: 2,
        visibleRows: 6,
        ghost: true,
        duration: 11,
        style: { top: '150px', right: '10px', opacity: 0.14 },
      },
      {
        seed: 10,
        blockCount: 2,
        visibleRows: 6,
        duration: 10,
        style: { bottom: '16%', left: '-14px', opacity: 0.22 },
      },
    ],
    bars: [
      { style: { top: '210px', left: '20px', opacity: 0.18 }, fill: 55 },
      { style: { bottom: '8%', right: '30px', opacity: 0.2 }, fill: 40 },
    ],
  },
  loading: {
    panels: [
      {
        seed: 11,
        blockCount: 3,
        visibleRows: 10,
        large: true,
        hasAlert: true,
        duration: 10,
        style: { bottom: '15%', right: '-16px', opacity: 0.34 },
      },
      {
        seed: 12,
        blockCount: 2,
        visibleRows: 6,
        ghost: true,
        duration: 13,
        style: { bottom: 'calc(15% - 28px)', right: '38px', opacity: 0.15 },
      },
      {
        seed: 0,
        blockCount: 2,
        visibleRows: 6,
        duration: 11,
        style: { top: '70px', left: '-12px', opacity: 0.22 },
      },
    ],
    bars: [
      { style: { top: '150px', right: '40px', opacity: 0.18 }, fill: 44 },
      { style: { top: '58px', left: '46%', opacity: 0.2 }, fill: 30 },
    ],
  },
}

/** Persistent scattered technical debris — small scrolling log panels, one
 * deliberately overlapping a second "ghost" panel behind it, and a couple
 * mini progress bars — living around the main content. The arrangement
 * (position AND content) switches per DEBRIS_LAYOUTS above whenever the
 * phase changes, rather than one fixed set of panels sitting there for
 * the whole loop. Positions stay off-grid/asymmetric (odd offsets, a
 * couple clipped right at the frame edge) and flat/unrotated. */
function HudDebrisField({ phase }: { phase: Phase }) {
  const layout = DEBRIS_LAYOUTS[phase]
  return (
    <div className="mirror-hud-debris" aria-hidden="true">
      {layout.panels.map((p, i) => (
        <CodePanel key={i} {...p} />
      ))}
      {layout.bars.map((b, i) => (
        <MiniBar key={i} style={b.style} fill={b.fill} />
      ))}
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
  const [vibe] = useStationVibe()
  const warm = vibe === 'warm'
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
      <DebraVoiceClip src={thirdStationDebraClipFor(phase)} />
      <div className="mirror-frame">
        <span className="mirror-frame-corner mirror-frame-corner-tl" aria-hidden="true" />
        <span className="mirror-frame-corner mirror-frame-corner-tr" aria-hidden="true" />
        <span className="mirror-frame-corner mirror-frame-corner-bl" aria-hidden="true" />
        <span className="mirror-frame-corner mirror-frame-corner-br" aria-hidden="true" />
        <div className="mirror-status-label" aria-hidden="true">
          <span className="mirror-status-marker" />
          {(warm ? STATUS_LABEL_WARM : STATUS_LABEL_ORIGINAL)[phase]}
        </div>
        {getDeviceQuality() === 'kiosk' ? null : <HudDebrisField phase={phase} key={phase} />}

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
            <MirrorHeadline
              lines={warm ? ['Finding', 'your match'] : ['Creating', 'match']}
              className="mirror-headline"
            />
            <GuideOrb variant="loading" progress={loadingProgress} />
            <div className="mirror-loading-readout">
              {warm
                ? `Putting it together, ${Math.round(loadingProgress * 100)}%`
                : `COMPILING MATCH DATA — ${Math.round(loadingProgress * 100)}%`}
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
