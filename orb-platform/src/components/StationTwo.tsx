import { lazy, Suspense, useCallback, useEffect, useMemo, useReducer } from 'react'
import {
  STATION_TWO_QUESTIONS,
  createStationTwoState,
  sessionPercentile,
  stationTwoReducer,
  type BinaryAnswer,
  type StationTwoPhase,
} from '../lib/mirrorJourney'
import { journeySettings } from '../dev/journeySettingsStore'
import { CompanionOutline } from './CompanionOutline'
import { DebraGuide } from './DebraGuide'
import { DebraVoice } from './DebraVoice'
import { JourneyHeadline } from './JourneyHeadline'
import { MirrorChoice } from './MirrorChoice'
import { MirrorStationShell } from './MirrorStationShell'

const JourneyDevPanel = lazy(() =>
  import('../dev/JourneyDevPanel').then((m) => ({ default: m.JourneyDevPanel })),
)

const LIVE_POLL_MS = 150

/** Reads live so tuning the panel mid-phase takes effect next cycle
 * rather than needing a remount, same pattern as ThirdStation's timing. */
function getAutoPhaseDurationMs(phase: StationTwoPhase): number | undefined {
  if (phase === 'percentile') return journeySettings.timing.percentileMs
  if (phase === 'companion-intro') return journeySettings.timing.companionIntroMs
  if (phase === 'debra-brief') return journeySettings.timing.debraBriefMs
  return undefined
}

/** Bridges journeySettings.colors (plain object, no leva dependency, safe
 * for production) into the :root custom properties MirrorJourney.css
 * reads — set directly on documentElement (the actual :root), not
 * redeclared on any descendant, so there's no risk of the local-
 * declaration-shadows-ancestor bug that broke the Cards station once. */
function useLiveJourneyTheme() {
  useEffect(() => {
    let raf = 0
    let last = 0
    const tick = (now: number) => {
      if (now - last >= LIVE_POLL_MS) {
        last = now
        const root = document.documentElement.style
        root.setProperty('--mirror-ice', journeySettings.colors.ice)
        root.setProperty('--mirror-ink', journeySettings.colors.ink)
        root.setProperty('--mirror-quiet', journeySettings.colors.quiet)
        root.setProperty('--mirror-frost', journeySettings.colors.frost)
        root.setProperty('--journey-orb-size', `${journeySettings.orbSizePx}px`)
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
}

const QUESTION_LINES = [
  ['IS ATTRACTIVENESS', 'IMPORTANT TO YOU?'],
  ['SHOULD YOUR COMPANION', 'CHALLENGE YOU?'],
  ['WOULD YOU CHOOSE', 'COMPANIONSHIP OVER', 'INDEPENDENCE?'],
]

export function StationTwo({
  phaseDurationMs,
  visitorSeed,
}: {
  phaseDurationMs?: number
  visitorSeed?: string
}) {
  const [state, dispatch] = useReducer(stationTwoReducer, undefined, createStationTwoState)
  const seed = useMemo(
    () => visitorSeed ?? `visitor-${Math.round(performance.timeOrigin)}`,
    [visitorSeed],
  )
  const percentile = sessionPercentile(seed)
  useLiveJourneyTheme()

  useEffect(() => {
    const automaticDurationMs = getAutoPhaseDurationMs(state.phase)
    if (automaticDurationMs === undefined) return
    const timer = window.setTimeout(
      () => dispatch({ type: 'ADVANCE' }),
      phaseDurationMs ?? automaticDurationMs,
    )
    return () => window.clearTimeout(timer)
  }, [phaseDurationMs, state.phase])

  const answer = useCallback((value: BinaryAnswer) => dispatch({ type: 'ANSWER', value }), [])
  const debraPosition =
    state.phase === 'debra-brief' ? 'left' : state.phase === 'question' ? 'right' : 'upper'

  return (
    <>
    {/* Also excluded in Vitest (MODE === 'test'): leva's stitches-based
        styling tries to insert a custom-property-only rule that jsdom's
        CSS parser can't handle, which would otherwise crash any test that
        fully mounts <StationTwo/>. Cards/Mirror have the same lazy-panel
        shape but happen to never be runtime-tested at their station-root
        level, so they've never hit this. */}
    {import.meta.env.DEV && import.meta.env.MODE !== 'test' ? (
      <Suspense fallback={null}>
        <JourneyDevPanel />
      </Suspense>
    ) : null}
    <MirrorStationShell
      station="II"
      cameraMode="none"
      statusLeft={
        <span className="journey-recording">
          <i /> RECORDING IN PROGRESS
        </span>
      }
    >
      <DebraVoice phase={state.phase} questionIndex={state.questionIndex} />

      {state.phase !== 'percentile' && state.phase !== 'complete' ? (
        <DebraGuide
          position={debraPosition}
          showIntroduction={state.phase === 'companion-intro' || state.phase === 'debra-brief'}
        />
      ) : null}

      {state.phase === 'percentile' ? (
        <div className="journey-message journey-message-bottom">
          <JourneyHeadline
            lines={['OUR SYSTEMS HAVE', 'FOUND YOU TO BE A', `${percentile}TH PERCENTILE SPECIMEN.`]}
          >
            {`Our systems have found you to be a ${percentile}th percentile specimen.`}
          </JourneyHeadline>
        </div>
      ) : null}

      {state.phase === 'companion-intro' ? (
        <div className="journey-message journey-message-bottom">
          <JourneyHeadline lines={['YOU WILL NOW BE', 'MATCHED WITH AN', 'AI COMPANION.']}>
            You will now be matched with an AI companion.
          </JourneyHeadline>
        </div>
      ) : null}

      {state.phase === 'debra-brief' ? (
        <div className="journey-debra-copy">
          <JourneyHeadline lines={["LET'S GET", 'STARTED.']}>
            Let&apos;s get started.
          </JourneyHeadline>
        </div>
      ) : null}

      {state.phase === 'question' ? (
        <div className="journey-question">
          <JourneyHeadline lines={QUESTION_LINES[state.questionIndex]}>
            {STATION_TWO_QUESTIONS[state.questionIndex].prompt}
          </JourneyHeadline>
          <MirrorChoice onAnswer={answer} />
        </div>
      ) : null}

      {state.phase === 'height' ? (
        <div className="journey-height-phase">
          <CompanionOutline height={state.height} />
          <div className="journey-height-control">
            <JourneyHeadline lines={['HOW TALL IS YOUR', 'IDEAL PARTNER?']}>
              How tall is your ideal partner?
            </JourneyHeadline>
            <label>
              <span>Shorter</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={state.height}
                onChange={(event) =>
                  dispatch({ type: 'SET_HEIGHT', value: Number(event.target.value) })
                }
                aria-label="Ideal partner height"
              />
              <span>Taller</span>
            </label>
            <button
              className="journey-height-confirm"
              type="button"
              onClick={() => dispatch({ type: 'ADVANCE' })}
            >
              Confirm height
            </button>
          </div>
        </div>
      ) : null}

      {state.phase === 'complete' ? (
        <div className="journey-complete">
          <JourneyHeadline lines={['PROCEED TO THE', 'NEXT STATION']}>
            Proceed to the next station
          </JourneyHeadline>
          <a href="#/mirror">Continue to Station III</a>
        </div>
      ) : null}
    </MirrorStationShell>
    </>
  )
}
