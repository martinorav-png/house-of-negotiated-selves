import './ConfidenceMeter.css'

type Props = {
  value: number
  label?: string
}

export function ConfidenceMeter({ value, label = 'CONF' }: Props) {
  const clamped = Math.min(99.9, Math.max(0, value))
  const digits = clamped.toFixed(1).split('')

  return (
    <div className="confidence-meter" aria-label={`Confidence ${clamped.toFixed(1)} percent`}>
      <span className="confidence-meter__label">{label}</span>
      <div className="confidence-meter__tubes" aria-hidden>
        {digits.map((d, i) => (
          <span key={`${i}-${d}`} className="confidence-meter__tube">
            <span className="confidence-meter__digit">{d}</span>
          </span>
        ))}
        <span className="confidence-meter__tube confidence-meter__tube--unit">
          <span className="confidence-meter__digit">%</span>
        </span>
      </div>
    </div>
  )
}
