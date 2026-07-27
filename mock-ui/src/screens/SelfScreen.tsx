import { useMemo, useState } from 'react'
import { BottomNav } from '../components/BottomNav'
import { DebraOrb } from '../components/DebraOrb'
import { ReflectiveCard } from '../components/ReflectiveCard'
import { TopBar } from '../components/TopBar'
import { SELF_STEPS } from '../data/content'
import './SelfScreen.css'

type Props = {
  logs: string[]
  onRestart: () => void
  onBack: () => void
  onComplete: (payload: {
    displayName: string
    answers: string[]
    logs: string[]
  }) => void
}

export function SelfScreen({ logs, onRestart, onBack, onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [text, setText] = useState('')
  const [selectedChip, setSelectedChip] = useState<string | null>(null)
  const [answers, setAnswers] = useState<string[]>([])
  const [localLogs, setLocalLogs] = useState(logs)
  const [photoFlash, setPhotoFlash] = useState(false)
  const [recording, setRecording] = useState(false)

  const current = SELF_STEPS[step]
  const total = SELF_STEPS.length
  const progress = ((step + 1) / total) * 100
  const visitorName = useMemo(() => {
    const raw = (answers[0] || text || 'Visitor').split(' · ')[0].trim()
    return raw.toUpperCase() || 'VISITOR'
  }, [answers, text])
  const idNumber = useMemo(() => {
    const seed = visitorName
      .split('')
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
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

  function advance(value: string, log?: string) {
    const nextAnswers = [...answers, value]
    const nextLogs = pushLog(log)
    setAnswers(nextAnswers)
    setText('')
    setSelectedChip(null)

    if (step >= total - 1) {
      onComplete({
        displayName: nextAnswers[0] || 'Visitor',
        answers: nextAnswers,
        logs: nextLogs,
      })
      return
    }
    setStep((s) => s + 1)
  }

  function handleNext() {
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
    setPhotoFlash(true)
    window.setTimeout(() => {
      setPhotoFlash(false)
      advance('ID frame', current.log)
    }, 650)
  }

  function handleVoice() {
    setRecording(true)
    window.setTimeout(() => {
      setRecording(false)
      advance('voice sample', current.log)
    }, 1800)
  }

  const canNext =
    current.kind === 'text' || current.kind === 'textarea'
      ? Boolean(text.trim() || selectedChip)
      : current.kind === 'chips'
        ? Boolean(selectedChip)
        : false

  return (
    <section className="screen self-screen">
      <TopBar onClose={onRestart} progress={progress} />
      <p className="self-screen__station label-sm">01 Self</p>

      <div className="self-screen__body">
        <div className="self-screen__main">
          <h2 className="prompt">{current.prompt}</h2>

          {(current.kind === 'text' || current.kind === 'textarea') && (
            <>
              {current.kind === 'textarea' ? (
                <textarea
                  className="field-area"
                  value={text}
                  placeholder={current.placeholder}
                  onChange={(e) => setText(e.target.value)}
                  autoFocus
                />
              ) : (
                <input
                  className="field"
                  value={text}
                  placeholder={current.placeholder}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && text.trim()) handleNext()
                  }}
                  autoFocus
                />
              )}
              {current.chips && (
                <div className="chips">
                  {current.chips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      className={['chip', selectedChip === chip && 'is-selected']
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => setSelectedChip(chip)}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {current.kind === 'chips' && (
            <div className="chips">
              {current.chips?.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  className={['chip', selectedChip === chip && 'is-selected']
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setSelectedChip(chip)}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {current.kind === 'photo' && (
            <div className="capture-panel">
              <button type="button" className="btn-primary" onClick={handlePhoto}>
                Capture ID
              </button>
            </div>
          )}

          {current.kind === 'voice' && (
            <div className="capture-panel">
              <div
                className={['voice-meter', recording && 'voice-meter--live']
                  .filter(Boolean)
                  .join(' ')}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <i key={i} style={{ animationDelay: `${i * 0.06}s` }} />
                ))}
              </div>
              <button
                type="button"
                className="btn-primary"
                disabled={recording}
                onClick={handleVoice}
              >
                {recording ? 'Sampling…' : 'Record sample'}
              </button>
            </div>
          )}
        </div>

        <aside className="self-screen__ring">
          <div
            className={['self-screen__card-wrap', photoFlash && 'is-flash']
              .filter(Boolean)
              .join(' ')}
          >
            <ReflectiveCard
              overlayColor="rgba(0, 0, 0, 0.2)"
              blurStrength={10}
              glassDistortion={15}
              metalness={0.8}
              roughness={0.5}
              displacementStrength={25}
              noiseScale={1.5}
              specularConstant={2.0}
              grayscale={0.5}
              color="#ffffff"
              visitorName={visitorName}
              visitorRole="INTAKE SUBJECT"
              idNumber={idNumber}
            />
          </div>
          <p className="self-screen__ring-label">ID Ringlight Status: Active</p>
        </aside>
      </div>

      <div className="self-screen__debra">
        <DebraOrb size="sm" />
        <div className="system-log">
          &gt; {localLogs.at(-1) || current.log || current.debra || 'listening…'}
        </div>
      </div>

      <BottomNav
        onBack={step === 0 ? onBack : () => setStep((s) => Math.max(0, s - 1))}
        onNext={
          current.kind === 'photo' || current.kind === 'voice' ? undefined : handleNext
        }
        nextDisabled={!canNext}
      />
    </section>
  )
}
