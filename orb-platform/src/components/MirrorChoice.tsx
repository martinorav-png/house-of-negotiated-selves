import { useEffect } from 'react'
import type { BinaryAnswer } from '../lib/mirrorJourney'

export function MirrorChoice({
  onAnswer,
  hideButtons = false,
}: {
  onAnswer: (answer: BinaryAnswer) => void
  /** Station I answers by keyboard only now — Station II still shows the
   * on-screen Yes/No buttons, so this defaults to keeping them rather
   * than changing both stations' behavior at once. */
  hideButtons?: boolean
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return
      if (event.key.toLowerCase() === 'y') onAnswer('yes')
      if (event.key.toLowerCase() === 'n') onAnswer('no')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onAnswer])

  return (
    <div className="journey-choice" role="group" aria-label="Answer yes or no">
      {hideButtons ? null : (
        <>
          <button type="button" onClick={() => onAnswer('yes')}>
            Yes
          </button>
          <button type="button" onClick={() => onAnswer('no')}>
            No
          </button>
        </>
      )}
      <p>Press Y or N</p>
    </div>
  )
}
