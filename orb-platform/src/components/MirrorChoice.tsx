import { useEffect } from 'react'
import { useStationVibe } from '../hooks/useStationVibe'
import type { BinaryAnswer } from '../lib/mirrorJourney'

export function MirrorChoice({
  onAnswer,
}: {
  onAnswer: (answer: BinaryAnswer) => void
}) {
  const [vibe] = useStationVibe()
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
      <button type="button" onClick={() => onAnswer('yes')}>
        Yes
      </button>
      <button type="button" onClick={() => onAnswer('no')}>
        No
      </button>
      <p>{vibe === 'warm' ? 'or press Y / N' : 'Press Y or N'}</p>
    </div>
  )
}
