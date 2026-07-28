import './PartnerSilhouette.css'

type Props = {
  intensity?: 0 | 1 | 2 | 3
}

export function PartnerSilhouette({ intensity = 1 }: Props) {
  return (
    <div
      className={['partner-silhouette', `partner-silhouette--glitch-${intensity}`]
        .filter(Boolean)
        .join(' ')}
      aria-hidden
    >
      <svg viewBox="0 0 120 200" className="partner-silhouette__svg">
        <ellipse cx="60" cy="28" rx="22" ry="26" className="partner-silhouette__head" />
        <path
          d="M30 58 Q60 48 90 58 L82 120 Q60 115 38 120 Z"
          className="partner-silhouette__torso"
        />
        <path d="M38 120 L28 185 M82 120 L92 185" className="partner-silhouette__legs" />
        <path d="M30 70 L12 110 M90 70 L108 110" className="partner-silhouette__arms" />
      </svg>
      <p className="partner-silhouette__label">CANDIDATE.SILHOUETTE</p>
    </div>
  )
}
