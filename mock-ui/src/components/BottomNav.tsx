import './BottomNav.css'

type Props = {
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  hideBack?: boolean
}

export function BottomNav({
  onBack,
  onNext,
  nextLabel = 'Next',
  nextDisabled,
  hideBack,
}: Props) {
  return (
    <nav className="bottom-nav">
      {!hideBack ? (
        <button type="button" className="btn-secondary" onClick={onBack}>
          <span aria-hidden>←</span> Back
        </button>
      ) : (
        <span />
      )}
      {onNext && (
        <button
          type="button"
          className="btn-primary"
          disabled={nextDisabled}
          onClick={onNext}
        >
          {nextLabel} <span aria-hidden>→</span>
        </button>
      )}
    </nav>
  )
}
