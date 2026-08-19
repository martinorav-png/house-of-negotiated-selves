import type { ReactNode } from 'react'
import { useStationVibe } from '../hooks/useStationVibe'
import { MirrorCameraLayer, type MirrorOverlayMode } from './MirrorCameraLayer'
import './MirrorJourney.css'

export function MirrorStationShell({
  station,
  cameraMode,
  statusLeft,
  children,
}: {
  station: 'I' | 'II'
  cameraMode: MirrorOverlayMode
  statusLeft?: ReactNode
  children: ReactNode
}) {
  const [vibe] = useStationVibe()
  const warm = vibe === 'warm'

  return (
    <section className="journey-station" aria-label={`Station ${station}`}>
      <div className="journey-portrait">
        <MirrorCameraLayer mode={cameraMode} />
        <header className="journey-status">
          <span>{statusLeft ?? (warm ? `Welcome to Station ${station}` : `STATION ${station}`)}</span>
        </header>
        <div className="journey-content">{children}</div>
        <footer className="journey-folio">
          <span>{station}</span>
          <span>{warm ? 'House of Negotiated Selves' : 'HOUSE OF NEGOTIATED SELVES'}</span>
        </footer>
      </div>
    </section>
  )
}
