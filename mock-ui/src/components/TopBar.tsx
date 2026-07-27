import './TopBar.css'

type Props = {
  onClose?: () => void
  progress?: number
}

export function TopBar({ onClose, progress }: Props) {
  return (
    <header className="topbar">
      <div className="topbar__row">
        <p className="label-sm">Art Installation</p>
        <button
          type="button"
          className="topbar__close"
          aria-label="Close"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      {typeof progress === 'number' && (
        <div className="topbar__rail" aria-hidden>
          <div className="topbar__fill" style={{ width: `${progress}%` }} />
        </div>
      )}
    </header>
  )
}
