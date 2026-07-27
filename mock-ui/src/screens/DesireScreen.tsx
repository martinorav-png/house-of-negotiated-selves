import { useState } from 'react'
import { BottomNav } from '../components/BottomNav'
import { DebraOrb } from '../components/DebraOrb'
import { TopBar } from '../components/TopBar'
import { DESIRE_STEPS } from '../data/content'
import './DesireScreen.css'

type Props = {
  logs: string[]
  onRestart: () => void
  onBack: () => void
  onComplete: (payload: { answers: string[]; logs: string[] }) => void
}

export function DesireScreen({ logs, onRestart, onBack, onComplete }: Props) {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<string[]>([])
  const [localLogs, setLocalLogs] = useState(logs)
  const [selected, setSelected] = useState<string | null>(null)

  const current = DESIRE_STEPS[step]
  const total = DESIRE_STEPS.length
  const progress = 25 + ((step + 1) / total) * 25

  function choose(chip: string) {
    setSelected(chip)
  }

  function handleNext() {
    if (!selected) return
    const nextAnswers = [...answers, selected]
    const nextLogs = current.log ? [...localLogs, current.log] : localLogs
    if (current.log) setLocalLogs(nextLogs)
    setAnswers(nextAnswers)
    setSelected(null)

    if (step >= total - 1) {
      onComplete({ answers: nextAnswers, logs: nextLogs })
      return
    }
    setStep((s) => s + 1)
  }

  return (
    <section className="screen desire-screen">
      <TopBar onClose={onRestart} progress={progress} />
      <p className="desire-screen__station label-sm">02 · Desire</p>

      <h2 className={['prompt', 'desire-screen__prompt', current.stranger && 'stranger'].filter(Boolean).join(' ')}>
        {current.prompt}
      </h2>

      <div className="desire-screen__choices">
        {current.chips.map((chip) => (
          <button
            key={chip}
            type="button"
            className={['desire-screen__choice', selected === chip && 'is-selected']
              .filter(Boolean)
              .join(' ')}
            onClick={() => choose(chip)}
          >
            {chip}
          </button>
        ))}
      </div>

      <div className="desire-screen__debra">
        <DebraOrb size="sm" />
        <div>
          <p className="label-sm">Debra</p>
          <p className="desire-screen__status">
            {current.debra || 'Assembling a candidate... analyzing patterns.'}
          </p>
        </div>
      </div>

      <BottomNav
        onBack={step === 0 ? onBack : () => setStep((s) => Math.max(0, s - 1))}
        onNext={handleNext}
        nextDisabled={!selected}
      />
    </section>
  )
}
