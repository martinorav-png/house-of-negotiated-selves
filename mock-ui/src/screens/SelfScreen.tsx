import { useMemo, useState } from 'react'
import { ReflectiveCard } from '../components/ReflectiveCard'
import { StationShell } from '../components/StationShell'
import { DEBRA_STATION, SELF_STEPS } from '../data/content'
import './SelfScreen.css'

type Props = {
  logs: string[]
  confidence: number
  onRestart: () => void
  onBack: () => void
  onComplete: (payload: {
    displayName: string
    answers: string[]
    logs: string[]
    confidence: number
  }) => void
}

export function SelfScreen({ logs, confidence, onRestart, onBack, onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [text, setText] = useState('')
  const [selectedChip, setSelectedChip] = useState<string | null>(null)
  const [answers, setAnswers] = useState<string[]>([])
  const [localLogs, setLocalLogs] = useState(logs)
  const [localConfidence, setLocalConfidence] = useState(confidence)
  const [photoFlash, setPhotoFlash] = useState(false)
  const [finishing, setFinishing] = useState(false)

  const current = SELF_STEPS[step]
  const total = SELF_STEPS.length
  const progress = ((step + 1) / total) * 20
  const visitorName = useMemo(() => {
    const raw = (answers[0] || text || 'Visitor').split(' · ')[0].trim()
    return raw.toUpperCase() || 'VISITOR'
  }, [answers, text])
  const idNumber = useMemo(() => {
    const seed = visitorName.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    const a = String(8000 + (seed % 1000)).padStart(4, '0')
    const b = String(1000 + ((seed * 7) % 9000)).padStart(4, '0')
    const c = String(1000 + ((seed * 13) % 9000)).padStart(4, '0')
    return `${a}-${b}-${c}`
  }, [visitorName])

  function pushLog(line?: string) {
    if (!line) return localLogs
    const next = [...localLogs, line]
    setLocalLogs(next)
    return next
  }

  function finish(nextAnswers: string[], nextLogs: string[], nextConfidence: number) {
    setFinishing(true)
    const finalLogs = [...nextLogs, DEBRA_STATION.selfDone]
    setLocalLogs(finalLogs)
    window.setTimeout(() => {
      onComplete({
        displayName: nextAnswers[0] || 'Visitor',
        answers: nextAnswers,
        logs: finalLogs,
        confidence: nextConfidence,
      })
    }, 1600)
  }

  function advance(value: string, log?: string) {
    const nextAnswers = [...answers, value]
    const nextLogs = log ? pushLog(log) : localLogs
    const nextConfidence = Math.min(98.4, localConfidence + 4.2)
    setLocalConfidence(nextConfidence)
    setAnswers(nextAnswers)
    setText('')
    setSelectedChip(null)

    if (step >= total - 1) {
      finish(nextAnswers, nextLogs, nextConfidence)
      return
    }
    setStep((s) => s + 1)
  }

  function handleNext() {
    if (finishing) return
    if (current.kind === 'text' || current.kind === 'textarea') {
      const value = [text.trim(), selectedChip].filter(Boolean).join(' · ')
      if (!value) return
      advance(value, current.log)
      return
    }
    if (current.kind === 'chips' && selectedChip) {
      advance(selectedChip, current.log)
    }
  }

  function handlePhoto() {
    if (finishing) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) {
      advance('ID frame', current.log)
      return
    }
    setPhotoFlash(true)
    window.setTimeout(() => {
      setPhotoFlash(false)
      advance('ID frame', current.log)
    }, 420)
  }

  const canNext =
    current.kind === 'text' || current.kind === 'textarea'
      ? Boolean(text.trim() || selectedChip)
      : current.kind === 'chips'
        ? Boolean(selectedChip)
        : false

  return (
    <StationShell
      stationCode="STN-01"
      stationLabel="Self"
      confidence={localConfidence}
      visitorId={idNumber}
      progress={progress}
      logs={localLogs}
      debraLine={finishing ? DEBRA_STATION.selfDone : current.debra}
      onClose={onRestart}
      nav={{
        onBack: step === 0 || finishing ? onBack : () => setStep((s) => Math.max(0, s - 1)),
        onNext: current.kind === 'photo' || finishing ? undefined : handleNext,
        nextDisabled: !canNext || finishing,
        advisory: 'Do not touch the mirror surface',
      }}
    >
      <h2 className="prompt">{current.prompt}</h2>

      {(current.kind === 'text' || current.kind === 'textarea') && (
        <>
          {current.kind === 'text' ? (
            <label className="self-screen__field">
              {current.fieldLabel && (
                <span className="self-screen__field-label">{current.fieldLabel}</span>
              )}
              <div className="self-screen__terminal">
                <span className="self-screen__prompt-mark" aria-hidden>
                  &gt;
                </span>
                <input
                  className="self-screen__input"
                  value={text}
                  placeholder={current.placeholder}
                  maxLength={120}
                  aria-label={current.fieldLabel ?? current.prompt}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && text.trim()) handleNext()
                  }}
                  autoFocus
                />
              </div>
            </label>
          ) : (
            <textarea
              className="field-area"
              value={text}
              placeholder={current.placeholder}
              maxLength={400}
              aria-label={current.fieldLabel ?? current.prompt}
              onChange={(e) => setText(e.target.value)}
              autoFocus
            />
          )}
        </>
      )}

      {current.kind === 'chips' && (
        <div className="chips" role="radiogroup" aria-label={current.prompt}>
          {current.chips?.map((chip) => (
            <button
              key={chip}
              type="button"
              role="radio"
              aria-checked={selectedChip === chip}
              className={['chip', selectedChip === chip && 'is-selected'].filter(Boolean).join(' ')}
              onClick={() => setSelectedChip(chip)}
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {current.kind === 'photo' && (
        <div className="self-screen__capture">
          <div className={['self-screen__card-wrap', photoFlash && 'is-flash'].filter(Boolean).join(' ')}>
            <ReflectiveCard
              overlayColor="color-mix(in srgb, var(--void) 55%, transparent)"
              blurStrength={8}
              glassDistortion={12}
              metalness={0.9}
              roughness={0.4}
              displacementStrength={20}
              noiseScale={1.2}
              specularConstant={1.8}
              grayscale={0.6}
              color="var(--phosphor)"
              visitorName={visitorName}
              visitorRole="INTAKE SUBJECT"
              idNumber={idNumber}
            />
          </div>
          <button type="button" className="btn-primary" disabled={finishing} onClick={handlePhoto}>
            Capture ID
          </button>
        </div>
      )}
    </StationShell>
  )
}
