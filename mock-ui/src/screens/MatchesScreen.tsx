import { useState } from 'react'
import { LieDetector } from '../components/LieDetector'
import { StationShell } from '../components/StationShell'
import { DEBRA_STATION, STATION3_STEPS, seedPersonaFromAnswers } from '../data/content'
import type { SessionState } from '../types'
import './MatchesScreen.css'

type Props = {
  session: SessionState
  visitorId?: string
  onRestart: () => void
  onBack: () => void
  onComplete: (payload: {
    matchAnswers: SessionState['matchAnswers']
    traitWeights: SessionState['traitWeights']
    lockedPersonaId: string
    logs: string[]
    confidence: number
  }) => void
}

export function MatchesScreen({ session, visitorId, onRestart, onBack, onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [logs, setLogs] = useState(session.systemLogs)
  const [confidence, setConfidence] = useState(session.confidence)
  const [blankValues, setBlankValues] = useState<Record<string, string>>({})
  const [text, setText] = useState('')
  const [finishing, setFinishing] = useState(false)
  const [yesNoBusy, setYesNoBusy] = useState(false)

  const current = STATION3_STEPS[step]
  const total = STATION3_STEPS.length
  const progress = 40 + ((step + 1) / total) * 30

  function finish(nextAnswers: string[], nextLogs: string[], nextConfidence: number) {
    setFinishing(true)
    const locked = seedPersonaFromAnswers([...session.selfAnswers, ...session.desireAnswers, ...nextAnswers])
    const finalLogs = [
      ...nextLogs,
      DEBRA_STATION.chamberInvite,
      `match seed locked · ${locked}`,
      'profile complete · chamber ready',
    ]
    setLogs(finalLogs)
    window.setTimeout(() => {
      onComplete({
        matchAnswers: nextAnswers.map((label, i) => ({
          personaId: `s3-${i}`,
          label,
        })),
        traitWeights: session.traitWeights,
        lockedPersonaId: locked,
        logs: finalLogs,
        confidence: Math.min(98.4, nextConfidence + 8),
      })
    }, 1800)
  }

  function advance(value: string) {
    if (finishing) return
    const nextAnswers = [...answers, value]
    const nextLogs = current.log ? [...logs, current.log] : logs
    const nextConfidence = Math.min(98.4, confidence + 5.2)
    if (current.log) setLogs(nextLogs)
    setConfidence(nextConfidence)
    setAnswers(nextAnswers)
    setText('')
    setBlankValues({})
    setYesNoBusy(false)

    if (step >= total - 1) {
      finish(nextAnswers, nextLogs, nextConfidence)
      return
    }
    setStep((s) => s + 1)
  }

  function handleBlanksNext() {
    if (!current.blanks) return
    const filled = current.blanks.every((b) => blankValues[b.key]?.trim())
    if (!filled) return
    const value = current.blanks
      .map((b) => `${b.label} ${blankValues[b.key].trim()}`)
      .join(' · ')
    advance(value)
  }

  function handleTextNext() {
    const value = text.trim()
    if (!value) return
    advance(value)
  }

  function handleYesNo(answer: 'yes' | 'no') {
    setYesNoBusy(true)
    advance(answer)
  }

  const blanksReady =
    current.kind === 'blanks' &&
    Boolean(current.blanks?.every((b) => blankValues[b.key]?.trim()))

  const canNext =
    current.kind === 'blanks'
      ? blanksReady
      : current.kind === 'text'
        ? Boolean(text.trim())
        : false

  return (
    <StationShell
      stationCode="STN-03"
      stationLabel="Matches"
      confidence={confidence}
      visitorId={visitorId}
      progress={progress}
      logs={logs}
      debraLine={
        finishing
          ? DEBRA_STATION.chamberInvite
          : current.debra
      }
      showSilhouette
      glitchLevel={current.kind === 'yesno' ? 3 : 2}
      onClose={onRestart}
      nav={{
        onBack:
          finishing || yesNoBusy
            ? undefined
            : step === 0
              ? onBack
              : () => setStep((s) => Math.max(0, s - 1)),
        onNext:
          finishing || current.kind === 'yesno'
            ? undefined
            : current.kind === 'blanks'
              ? handleBlanksNext
              : handleTextNext,
        nextDisabled: !canNext || finishing,
        hideBack: finishing,
        advisory: current.kind === 'yesno' ? 'Polygraph active' : 'Life vision intake',
      }}
    >
      {current.kind !== 'yesno' && (
        <h2 className={['prompt', current.stranger && 'stranger'].filter(Boolean).join(' ')}>
          {current.prompt}
        </h2>
      )}

      {current.kind === 'blanks' && (
        <div className="matches-screen__blanks">
          {current.blanks?.map((blank) => (
            <label key={blank.key} className="matches-screen__blank">
              <span className="matches-screen__blank-label">{blank.label}</span>
              <input
                className="matches-screen__blank-input"
                value={blankValues[blank.key] ?? ''}
                placeholder={blank.placeholder}
                maxLength={80}
                disabled={finishing}
                aria-label={blank.label}
                onChange={(e) =>
                  setBlankValues((prev) => ({ ...prev, [blank.key]: e.target.value }))
                }
              />
            </label>
          ))}
        </div>
      )}

      {current.kind === 'text' && (
        <label className="matches-screen__field">
          {current.fieldLabel && (
            <span className="matches-screen__field-label">{current.fieldLabel}</span>
          )}
          <input
            className="matches-screen__text-input"
            value={text}
            placeholder={current.placeholder}
            maxLength={200}
            disabled={finishing}
            aria-label={current.fieldLabel ?? current.prompt}
            autoFocus
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && text.trim()) handleTextNext()
            }}
          />
        </label>
      )}

      {current.kind === 'yesno' && (
        <LieDetector
          prompt={current.prompt}
          disabled={finishing || yesNoBusy}
          onAnswer={handleYesNo}
        />
      )}
    </StationShell>
  )
}
