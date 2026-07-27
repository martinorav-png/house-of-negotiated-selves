import './StationHeader.css'

type Props = {
  code: string
  title: string
  step: number
  total: number
  onRestart?: () => void
}

export function StationHeader({ code, title, step, total, onRestart }: Props) {
  const progress = total > 0 ? (step / total) * 100 : 0

  return (
    <header className="station-header">
      <div className="station-header__row">
        <div>
          <p className="brand-mark">House of Negotiated Selves</p>
          <h1 className="station-header__title">
            <span className="station-header__code">{code}</span>
            <span className="station-header__name">{title}</span>
          </h1>
        </div>
        {onRestart && (
          <button type="button" className="btn-ghost" onClick={onRestart}>
            Restart
          </button>
        )}
      </div>
      <div className="station-header__rail" aria-hidden>
        <div className="station-header__fill" style={{ width: `${progress}%` }} />
      </div>
      <p className="station-header__meta">
        {String(step).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </p>
    </header>
  )
}
