import { useStationVibe } from '../hooks/useStationVibe'
import { MirrorGuideOrb } from './MirrorGuideOrb'

export function DebraGuide({
  position = 'upper',
  showIntroduction = false,
}: {
  position?: 'upper' | 'left' | 'right'
  showIntroduction?: boolean
}) {
  const [vibe] = useStationVibe()

  return (
    <div className={`journey-debra journey-debra-${position}`} aria-label="Debra, companion guide">
      <div className="journey-debra-motion">
        <div className="journey-debra-orb-wrap">
          <MirrorGuideOrb className="journey-debra-orb" />
          <span className="journey-debra-name">{vibe === 'warm' ? 'Debra' : 'DEBRA'}</span>
        </div>
        {showIntroduction ? (
          <p className="journey-debra-introduction">
            I will help you describe the companion you believe you want.
          </p>
        ) : null}
      </div>
    </div>
  )
}
