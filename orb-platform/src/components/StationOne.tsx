import { useCallback, useEffect, useReducer, useState, type FormEvent } from 'react'
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
              lines={state.phase === 'name' ? ['WHAT IS YOUR', 'NAME?'] : ['WHAT IS YOUR', 'AGE?']}
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
        <JourneyMessage lines={['PROCEEDING WITH', 'FACIAL ANALYSIS']}>
          Proceeding with facial analysis
        </JourneyMessage>
      ) : null}
      {state.phase === 'scan-face' ? (
        <JourneyMessage lines={['HOLD STILL,', state.name.toUpperCase()]}>
          {`Hold still, ${state.name}`}
        </JourneyMessage>
      ) : null}
      {state.phase === 'scan-eyes' ? (
        <JourneyMessage lines={['KEEP YOUR EYES ON', 'YOUR REFLECTION']}>
          Keep your eyes on your reflection
        </JourneyMessage>
      ) : null}
      {state.phase === 'scan-focus' ? (
        <JourneyMessage lines={['FACIAL PROFILE', 'ASSEMBLED']}>
          Facial profile assembled
        </JourneyMessage>
      ) : null}
      {state.phase === 'self-check' ? (
        <div className="journey-question">
          <JourneyHeadline lines={['DO YOU LIKE', 'WHAT YOU SEE?']}>
            Do you like what you see?
          </JourneyHeadline>
          <MirrorChoice onAnswer={answer} hideButtons />
        </div>
      ) : null}
      {state.phase === 'dissolve' ? (
        <JourneyMessage lines={['RELEASING', 'ANALYSIS LAYERS']}>
          Releasing analysis layers
        </JourneyMessage>
      ) : null}
      {state.phase === 'calculating' ? (
        <div className="journey-calculating">
          <div className="journey-loader" />
          <JourneyHeadline lines={['CALCULATING']}>Calculating</JourneyHeadline>
          <p>Only your reflection remains.</p>
        </div>
      ) : null}
      {state.phase === 'complete' ? (
        <div className="journey-complete">
          <JourneyHeadline lines={['ANALYSIS', 'COMPLETE']}>Analysis complete</JourneyHeadline>
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
