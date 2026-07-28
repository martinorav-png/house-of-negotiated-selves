import { useState } from 'react'
import { StationShell } from '../components/StationShell'
import { DESIRE_STEPS } from '../data/content'
import './DesireScreen.css'

type Props = {
  logs: string[]
  confidence: number
  visitorId?: string
  onRestart: () => void
  onBack: () => void
  onComplete: (payload: { answers: string[]; logs: string[]; confidence: number }) => void
}

export function DesireScreen({
  logs,
  confidence,
  visitorId,
  onRestart,
  onBack,
  onComplete,
}: Props) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [localLogs, setLocalLogs] = useState(logs)
  const [localConfidence, setLocalConfidence] = useState(confidence)
  const [selected, setSelected] = useState<string | null>(null)
  const [sliderValue, setSliderValue] = useState(
    DESIRE_STEPS.find((s) => s.kind === 'slider')?.slider?.defaultValue ?? 170,
  )

  const current = DESIRE_STEPS[step]
  const total = DESIRE_STEPS.length
  const progress = 20 + ((step + 1) / total) * 20

  function handleNext() {
    let value = selected
    if (current.kind === 'slider') {
      value = `${sliderValue}${current.slider?.unit ?? ''}`
    }
    if (!value) return

    const nextAnswers = [...answers, value]
    const nextLogs = current.log ? [...localLogs, current.log] : localLogs
    const nextConfidence = Math.min(98.4, localConfidence + 5.5)
    if (current.log) setLocalLogs(nextLogs)
    setLocalConfidence(nextConfidence)
    setAnswers(nextAnswers)
    setSelected(null)

    if (step >= total - 1) {
      onComplete({ answers: nextAnswers, logs: nextLogs, confidence: nextConfidence })
      return
    }
    setStep((s) => s + 1)
  }

  const canNext = current.kind === 'slider' ? true : Boolean(selected)

  return (
    <StationShell
      stationCode="STN-02"
      stationLabel="Desire"
      confidence={localConfidence}
      visitorId={visitorId}
      progress={progress}
      logs={localLogs}
      debraLine={current.debra}
      showSilhouette
      glitchLevel={1}
      onClose={onRestart}
      nav={{
        onBack: step === 0 ? onBack : () => setStep((s) => Math.max(0, s - 1)),
        onNext: handleNext,
        nextDisabled: !canNext,
      }}
    >
      <h2 className={['prompt', current.stranger && 'stranger'].filter(Boolean).join(' ')}>
        {current.prompt}
      </h2>

      {current.kind === 'chips' && (
        <div className="desire-screen__choices" role="radiogroup" aria-label={current.prompt}>
          {current.chips?.map((chip) => (
            <button
              key={chip}
              type="button"
              role="radio"
              aria-checked={selected === chip}
              className={['desire-screen__choice', selected === chip && 'is-selected']
                .filter(Boolean)
                .join(' ')}
              onClick={() => setSelected(chip)}
            >
              <span>{chip}</span>
              <span className="desire-screen__choice-mark" aria-hidden>
                {selected === chip ? 'SEL' : 'OPT'}
              </span>
            </button>
          ))}
        </div>
      )}

      {current.kind === 'slider' && current.slider && (
        <div className="desire-screen__slider">
          <label className="desire-screen__slider-label" htmlFor="height-slider">
            Height
            <strong>
              {sliderValue}
              {current.slider.unit}
            </strong>
          </label>
          <input
            id="height-slider"
            type="range"
            min={current.slider.min}
            max={current.slider.max}
            value={sliderValue}
            aria-valuemin={current.slider.min}
            aria-valuemax={current.slider.max}
            aria-valuenow={sliderValue}
            aria-valuetext={`${sliderValue}${current.slider.unit}`}
            onChange={(e) => setSliderValue(Number(e.target.value))}
          />
          <div className="desire-screen__slider-ends">
            <span>
              {current.slider.min}
              {current.slider.unit}
            </span>
            <span>
              {current.slider.max}
              {current.slider.unit}
            </span>
          </div>
        </div>
      )}
    </StationShell>
  )
}
