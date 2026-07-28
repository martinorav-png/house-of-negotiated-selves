import { useState } from 'react'
import './LieDetector.css'

type Props = {
  prompt: string
  onAnswer: (answer: 'yes' | 'no') => void
  disabled?: boolean
}

export function LieDetector({ prompt, onAnswer, disabled }: Props) {
  const [pulse, setPulse] = useState<'yes' | 'no' | null>(null)

  function choose(answer: 'yes' | 'no') {
    if (disabled || pulse !== null) return
    setPulse(answer)
    window.setTimeout(() => onAnswer(answer), 600)
  }

  const busy = disabled || pulse !== null

  return (
    <div className="lie-detector" aria-busy={busy || undefined}>
      <p className="lie-detector__badge" id="lie-detector-status">
        POLYGRAPH · ACTIVE
      </p>
      <h2 className="prompt lie-detector__prompt" id="lie-detector-prompt">
        {prompt}
      </h2>
      <div className="lie-detector__trace" aria-hidden>
        <svg viewBox="0 0 400 60" preserveAspectRatio="none">
          <polyline
            className={['lie-detector__line', pulse && `lie-detector__line--${pulse}`]
              .filter(Boolean)
              .join(' ')}
            points="0,30 40,28 80,32 120,25 160,35 200,20 240,38 280,22 320,34 360,28 400,30"
          />
        </svg>
      </div>
      <div
        className="lie-detector__actions"
        role="radiogroup"
        aria-labelledby="lie-detector-prompt"
        aria-describedby="lie-detector-status"
      >
        <button
          type="button"
          role="radio"
          aria-checked={pulse === 'no'}
          className={['lie-detector__btn', pulse === 'no' && 'is-active'].filter(Boolean).join(' ')}
          disabled={busy}
          onClick={() => choose('no')}
        >
          No
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={pulse === 'yes'}
          className={['lie-detector__btn', pulse === 'yes' && 'is-active'].filter(Boolean).join(' ')}
          disabled={busy}
          onClick={() => choose('yes')}
        >
          Yes
        </button>
      </div>
    </div>
  )
}
