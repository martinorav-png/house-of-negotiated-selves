import { useEffect, useState, type ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { DebraOrb } from './DebraOrb'
import { PartnerSilhouette } from './PartnerSilhouette'
import { SystemLog } from './SystemLog'
import { TopBar } from './TopBar'
import './StationShell.css'

type BottomNavProps = {
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  hideBack?: boolean
  advisory?: string
}

type Props = {
  stationCode: string
  stationLabel: string
  confidence: number
  visitorId?: string
  progress?: number
  logs: string[]
  debraLine?: string
  moduleLabel?: string
  glitchLevel?: 0 | 1 | 2 | 3
  showSilhouette?: boolean
  onClose?: () => void
  children: ReactNode
  nav?: BottomNavProps
  layout?: 'split' | 'full'
  logTitle?: string
}

function useNarrowShell(query = '(max-width: 1100px)') {
  const [narrow, setNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    const mq = window.matchMedia(query)
    const sync = () => setNarrow(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [query])

  return narrow
}

export function StationShell({
  stationCode,
  stationLabel,
  confidence,
  visitorId,
  progress,
  logs,
  debraLine,
  moduleLabel,
  glitchLevel = 0,
  showSilhouette = false,
  onClose,
  children,
  nav,
  layout = 'split',
  logTitle,
}: Props) {
  const narrow = useNarrowShell()
  const coachLive = Boolean(debraLine) && (narrow || layout === 'full')
  const railLive = Boolean(debraLine) && !narrow && layout === 'split'

  return (
    <section className="screen station-shell" aria-label={`${stationLabel} station`}>
      <TopBar
        onClose={onClose}
        progress={progress}
        stationCode={stationCode}
        visitorId={visitorId}
        confidence={confidence}
      />

      <div
        className={[
          'station-shell__body',
          layout === 'full' && 'station-shell__body--full',
          narrow && 'is-narrow',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="station-shell__main">
          {debraLine && (
            <p
              className="station-shell__coach"
              role={coachLive ? 'status' : undefined}
              aria-live={coachLive ? 'polite' : undefined}
              aria-atomic={coachLive ? true : undefined}
              aria-hidden={coachLive ? undefined : true}
            >
              <span className="station-shell__coach-label">Debra</span>
              <span className="station-shell__coach-text">{debraLine}</span>
            </p>
          )}
          {(moduleLabel || stationLabel) && (
            <p className="station-shell__module label-sm">
              {moduleLabel ?? `Survey module: ${stationLabel}`}
            </p>
          )}
          {children}
        </div>

        {layout === 'split' && (
          <aside className="station-shell__rail" aria-label="Debra and system status">
            <div className="station-shell__identity">
              <h2 className="station-shell__os">Debra OS</h2>
              <p className="station-shell__version">v.2.0.4-mirror</p>
            </div>

            <div className="station-shell__orb-panel">
              <div className="station-shell__orb-wrap">
                <DebraOrb size="md" />
              </div>
              {debraLine && (
                <p
                  className="debra-line station-shell__quote"
                  role={railLive ? 'status' : undefined}
                  aria-live={railLive ? 'polite' : undefined}
                  aria-atomic={railLive ? true : undefined}
                  aria-hidden={railLive ? undefined : true}
                >
                  {debraLine}
                </p>
              )}
            </div>

            {showSilhouette && (
              <div className="station-shell__silhouette">
                <PartnerSilhouette intensity={glitchLevel} />
              </div>
            )}

            <SystemLog lines={logs} title={logTitle} />

            {onClose && (
              <button type="button" className="station-shell__terminate" onClick={onClose}>
                End session
              </button>
            )}
          </aside>
        )}
      </div>

      {nav && <BottomNav {...nav} />}
    </section>
  )
}
