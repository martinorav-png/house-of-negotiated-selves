import { useCallback, useEffect, useReducer, useState, type FormEvent } from 'react'
import { useStationVibe } from '../hooks/useStationVibe'
import { createStationOneState, stationOneReducer, type BinaryAnswer } from '../lib/mirrorJourney'
import { DebraVoiceClip, stationOneDebraClipFor } from './DebraVoice'
import { JourneyHeadline } from './JourneyHeadline'
import { MirrorChoice } from './MirrorChoice'
import { MirrorStationShell } from './MirrorStationShell'

const AUTO_PHASES = new Set([
  'analysis-intro',
  'scan-face',
  'scan-eyes',
  'scan-focus',
  'dissolve',
  'calculating',
])

export function StationOne({ phaseDurationMs = 2200 }: { phaseDurationMs?: number }) {
  const [vibe] = useStationVibe()
  const warm = vibe === 'warm'
  const [state, dispatch] = useReducer(stationOneReducer, undefined, createStationOneState)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (!AUTO_PHASES.has(state.phase)) return
    const timer = window.setTimeout(() => dispatch({ type: 'ADVANCE' }), phaseDurationMs)
    return () => window.clearTimeout(timer)
  }, [phaseDurationMs, state.phase])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (state.phase === 'name') dispatch({ type: 'SUBMIT_NAME', value: draft })
    if (state.phase === 'age') dispatch({ type: 'SUBMIT_AGE', value: draft })
    setDraft('')
  }
  const answer = useCallback((value: BinaryAnswer) => dispatch({ type: 'ANSWER', value }), [])
  const cameraMode =
    state.phase === 'scan-eyes'
      ? 'eyes'
      : ['scan-face', 'scan-focus', 'self-check'].includes(state.phase)
        ? 'face'
        : state.phase === 'dissolve'
          ? 'dissolve'
          : 'none'

  return (
    <MirrorStationShell station="I" cameraMode={cameraMode}>
      <DebraVoiceClip src={stationOneDebraClipFor(state.phase)} />

      {state.phase === 'name' || state.phase === 'age' ? (
        <form className="journey-intake" onSubmit={submit}>
          <label htmlFor={`station-one-${state.phase}`}>
            <JourneyHeadline
              as="span"
              lines={
                state.phase === 'name'
                  ? warm
                    ? ['What is your', 'name?']
                    : ['WHAT IS YOUR', 'NAME?']
                  : warm
                    ? ['What is your', 'age?']
                    : ['WHAT IS YOUR', 'AGE?']
              }
            >
              {state.phase === 'name' ? 'What is your name?' : 'What is your age?'}
            </JourneyHeadline>
          </label>
          <input
            id={`station-one-${state.phase}`}
            aria-label={state.phase === 'name' ? 'Your name' : 'Your age'}
            name={state.phase}
            type={state.phase === 'age' ? 'number' : 'text'}
            min={state.phase === 'age' ? 1 : undefined}
            max={state.phase === 'age' ? 120 : undefined}
            autoFocus
            autoComplete="off"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button type="submit">Continue</button>
        </form>
      ) : null}

      {state.phase === 'analysis-intro' ? (
        <JourneyMessage
          lines={warm ? ["Let's have", 'a look at you'] : ['PROCEEDING WITH', 'FACIAL ANALYSIS']}
        >
          {warm ? "Let's have a look at you" : 'Proceeding with facial analysis'}
        </JourneyMessage>
      ) : null}
      {state.phase === 'scan-face' ? (
        <JourneyMessage lines={warm ? ['Hold still,', state.name] : ['HOLD STILL,', state.name.toUpperCase()]}>
          {`Hold still, ${state.name}`}
        </JourneyMessage>
      ) : null}
      {state.phase === 'scan-eyes' ? (
        <JourneyMessage
          lines={warm ? ['Keep your eyes on', 'your reflection'] : ['KEEP YOUR EYES ON', 'YOUR REFLECTION']}
        >
          Keep your eyes on your reflection
        </JourneyMessage>
      ) : null}
      {state.phase === 'scan-focus' ? (
        <JourneyMessage
          lines={warm ? ["I've got", 'a sense of you'] : ['FACIAL PROFILE', 'ASSEMBLED']}
        >
          {warm ? "I've got a sense of you" : 'Facial profile assembled'}
        </JourneyMessage>
      ) : null}
      {state.phase === 'self-check' ? (
        <div className="journey-question">
          <JourneyHeadline lines={warm ? ['Do you like', 'what you see?'] : ['DO YOU LIKE', 'WHAT YOU SEE?']}>
            Do you like what you see?
          </JourneyHeadline>
          <MirrorChoice onAnswer={answer} />
        </div>
      ) : null}
      {state.phase === 'dissolve' ? (
        <JourneyMessage
          lines={warm ? ['Letting the', 'overlay fade'] : ['RELEASING', 'ANALYSIS LAYERS']}
        >
          {warm ? 'Letting the overlay fade' : 'Releasing analysis layers'}
        </JourneyMessage>
      ) : null}
      {state.phase === 'calculating' ? (
        <div className="journey-calculating">
          {warm ? null : <div className="journey-loader" />}
          <JourneyHeadline lines={warm ? ['A moment'] : ['CALCULATING']}>
            {warm ? 'A moment' : 'Calculating'}
          </JourneyHeadline>
          <p>{warm ? 'Just you, for a moment.' : 'Only your reflection remains.'}</p>
        </div>
      ) : null}
      {state.phase === 'complete' ? (
        <div className="journey-complete">
          <JourneyHeadline lines={warm ? ["When you're", 'ready'] : ['PROCEED TO THE', 'NEXT STATION']}>
            {warm ? "When you're ready" : 'Proceed to the next station'}
          </JourneyHeadline>
          <a href="#/station-2">Continue to Station II</a>
        </div>
      ) : null}
    </MirrorStationShell>
  )
}

function JourneyMessage({ children, lines }: { children: string; lines: string[] }) {
  return (
    <div className="journey-message">
      <JourneyHeadline lines={lines}>{children}</JourneyHeadline>
    </div>
  )
}
