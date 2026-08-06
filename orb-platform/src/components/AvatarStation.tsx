import { avatarPortraits } from '../lib/avatarPortraits'
import { MorphSlider } from './MorphSlider'
import './AvatarStation.css'

export function AvatarStation() {
  return (
    <section className="avatar-station" aria-label="Avatar portrait station">
      <div className="avatar-station-shell">
        <MorphSlider
          items={avatarPortraits}
          transition="melt"
          duration={1.18}
          intensity={0.42}
          scale={2.1}
          drift={0.18}
          aberration={0}
          overlayColor="#0b100d"
          autoplay
          autoplayDelay={5}
          radius={18}
        />
      </div>
    </section>
  )
}
