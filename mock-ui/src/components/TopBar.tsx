import { ConfidenceMeter } from './ConfidenceMeter'
import './TopBar.css'

type Props = {
  onClose?: () => void
  progress?: number
  stationCode?: string
  visitorId?: string
  confidence?: number
  phaseLabel?: string
}

export function TopBar({
  onClose,
  progress,
  stationCode,
  visitorId,
  confidence,
  phaseLabel,
}: Props) {
  const idLabel = visitorId ? `VISITOR-${visitorId}` : null

  return (
    <header className="topbar">
      <div className="topbar__row">
        <div className="topbar__meta">
          {stationCode && (
            <span className="topbar__station">
              {stationCode}
              {idLabel ? ` // ${idLabel}` : ''}
            </span>
          )}
          {phaseLabel && <span className="topbar__phase">{phaseLabel}</span>}
        </div>
        <div className="topbar__right">
          {typeof confidence === 'number' && (
            <div className="topbar__confidence">
              <span className="topbar__confidence-label">System confidence</span>
              <ConfidenceMeter value={confidence} />
            </div>
          )}
          {onClose && (
            <button
              type="button"
              className="topbar__close"
              aria-label="Reset session"
              onClick={onClose}
            >
              Reset
            </button>
          )}
        </div>
      </div>
      {typeof progress === 'number' && (
        <div
          className="topbar__rail"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${Math.round(progress)} percent complete`}
          aria-label="Station progress"
        >
          <div className="topbar__fill" style={{ transform: `scaleX(${progress / 100})` }} />
        </div>
      )}
    </header>
  )
}
