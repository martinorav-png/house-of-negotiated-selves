import { useCallback, useEffect, useMemo, useReducer } from 'react'
import {
  STATION_TWO_QUESTIONS,
  createStationTwoState,
  sessionPercentile,
  stationTwoReducer,
  type BinaryAnswer,
  type StationTwoPhase,
} from '../lib/mirrorJourney'
import { CompanionOutline } from './CompanionOutline'
import { DebraGuide } from './DebraGuide'
import { DebraVoice } from './DebraVoice'
import { JourneyHeadline } from './JourneyHeadline'
import { MirrorChoice } from './MirrorChoice'
import { MirrorStationShell } from './MirrorStationShell'
import { useStationVibe } from '../hooks/useStationVibe'

const AUTO_PHASE_DURATIONS_MS: Partial<Record<StationTwoPhase, number>> = {
  percentile: 3000,
  'companion-intro': 3000,
  'debra-brief': 3000,
}
const QUESTION_LINES_WARM = [
  ['Is attractiveness', 'important to you?'],
  ['Should your companion', 'challenge you?'],
  ['Would you choose', 'companionship over', 'independence?'],
]
const QUESTION_LINES_ORIGINAL = [
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
  const [vibe] = useStationVibe()
  const warm = vibe === 'warm'
  const [state, dispatch] = useReducer(stationTwoReducer, undefined, createStationTwoState)
  const seed = useMemo(
    () => visitorSeed ?? `visitor-${Math.round(performance.timeOrigin)}`,
    [visitorSeed],
  )
  const percentile = sessionPercentile(seed)

  useEffect(() => {
    const automaticDurationMs = AUTO_PHASE_DURATIONS_MS[state.phase]
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
    <MirrorStationShell
      station="II"
      cameraMode="none"
      statusLeft={
        <span className="journey-recording">
          <i /> {warm ? 'Listening' : 'RECORDING IN PROGRESS'}
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
            lines={
              warm
                ? ['You landed in the', `${percentile}th percentile.`, "That's quite something."]
                : ['OUR SYSTEMS HAVE', 'FOUND YOU TO BE A', `${percentile}TH PERCENTILE SPECIMEN.`]
            }
          >
            {warm
              ? `You landed in the ${percentile}th percentile. That's quite something.`
              : `Our systems have found you to be a ${percentile}th percentile specimen.`}
          </JourneyHeadline>
        </div>
      ) : null}

      {state.phase === 'companion-intro' ? (
        <div className="journey-message journey-message-bottom">
          <JourneyHeadline
            lines={
              warm
                ? ["You'll be matched", 'with an AI', 'companion now.']
                : ['YOU WILL NOW BE', 'MATCHED WITH AN', 'AI COMPANION.']
            }
          >
            {warm
              ? "You'll be matched with an AI companion now."
              : 'You will now be matched with an AI companion.'}
          </JourneyHeadline>
        </div>
      ) : null}

      {state.phase === 'debra-brief' ? (
        <div className="journey-debra-copy">
          <JourneyHeadline lines={warm ? ["Let's get", 'started.'] : ["LET'S GET", 'STARTED.']}>
            Let&apos;s get started.
          </JourneyHeadline>
        </div>
      ) : null}

      {state.phase === 'question' ? (
        <div className="journey-question">
          <JourneyHeadline lines={(warm ? QUESTION_LINES_WARM : QUESTION_LINES_ORIGINAL)[state.questionIndex]}>
            {STATION_TWO_QUESTIONS[state.questionIndex].prompt}
          </JourneyHeadline>
          <MirrorChoice onAnswer={answer} />
        </div>
      ) : null}

      {state.phase === 'height' ? (
        <div className="journey-height-phase">
          <CompanionOutline height={state.height} />
          <div className="journey-height-control">
            <JourneyHeadline
              lines={warm ? ['How tall is your', 'ideal partner?'] : ['HOW TALL IS YOUR', 'IDEAL PARTNER?']}
            >
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
              {warm ? 'That feels right' : 'Confirm height'}
            </button>
          </div>
        </div>
      ) : null}

      {state.phase === 'complete' ? (
        <div className="journey-complete">
          <JourneyHeadline lines={warm ? ["When you're", 'ready'] : ['PROCEED TO THE', 'NEXT STATION']}>
            {warm ? "When you're ready" : 'Proceed to the next station'}
          </JourneyHeadline>
          <a href="#/mirror">Continue to Station III</a>
        </div>
      ) : null}
    </MirrorStationShell>
  )
}
