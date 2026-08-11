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
          duration={1.05}
          intensity={0.28}
          scale={1.8}
          drift={0.08}
          aberration={0}
          overlayColor="#0b100d"
          autoplay={false}
          radius={18}
        />
      </div>
    </section>
  )
}
