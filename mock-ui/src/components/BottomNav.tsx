import './BottomNav.css'

type Props = {
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  hideBack?: boolean
  advisory?: string
}

export function BottomNav({
  onBack,
  onNext,
  nextLabel = 'Continue',
  nextDisabled,
  hideBack,
  advisory,
}: Props) {
  return (
    <nav className="bottom-nav" aria-label="Station navigation">
      {!hideBack ? (
        <button type="button" className="btn-secondary bottom-nav__btn" onClick={onBack}>
          <span aria-hidden>←</span> Back
        </button>
      ) : (
        <span className="bottom-nav__spacer" />
      )}

      {advisory ? (
        <p className="bottom-nav__advisory">
          <span className="bottom-nav__advisory-label">Station note</span>
          <span>{advisory}</span>
        </p>
      ) : (
        <span className="bottom-nav__spacer" />
      )}

      {onNext ? (
        <button
          type="button"
          className="btn-primary bottom-nav__btn"
          disabled={nextDisabled}
          onClick={onNext}
        >
          {nextLabel} <span aria-hidden>→</span>
        </button>
      ) : (
        <span className="bottom-nav__spacer" />
      )}
    </nav>
  )
}
