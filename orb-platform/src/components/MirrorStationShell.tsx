import type { ReactNode } from 'react'
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
  return (
    <section className="journey-station" aria-label={`Station ${station}`}>
      <div className="journey-portrait">
        <MirrorCameraLayer mode={cameraMode} />
        <header className="journey-status">
          <span>{statusLeft ?? `STATION ${station}`}</span>
        </header>
        <div className="journey-content">{children}</div>
        <footer className="journey-folio">
          <span>{station}</span>
        </footer>
      </div>
    </section>
  )
}
