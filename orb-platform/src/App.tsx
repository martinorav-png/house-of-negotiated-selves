import { lazy, Suspense, useEffect, useState } from 'react'
import { StationVibeToggle } from './components/StationVibeToggle'
import { MirrorPreviewFrame } from './components/MirrorPreviewToggle'
import { applyDeviceQuality } from './lib/deviceQuality'
import { getStationFromHash, getStationHref, type StationRoute } from './lib/stationRoute'
import './index.css'

const DevPanel = lazy(() => import('./dev/DevPanel').then((m) => ({ default: m.DevPanel })))
const LevaRoot = lazy(() => import('./dev/LevaRoot').then((m) => ({ default: m.LevaRoot })))
const StationOne = lazy(() =>
  import('./components/StationOne').then((m) => ({ default: m.StationOne })),
)
const StationTwo = lazy(() =>
  import('./components/StationTwo').then((m) => ({ default: m.StationTwo })),
)
const ThirdStation = lazy(() =>
  import('./components/ThirdStation').then((m) => ({ default: m.ThirdStation })),
)
const SecondStation = lazy(() =>
  import('./components/SecondStation').then((m) => ({ default: m.SecondStation })),
)
const AvatarStation = lazy(() =>
  import('./components/AvatarStation').then((m) => ({ default: m.AvatarStation })),
)
const OrbStation = lazy(() =>
  import('./components/OrbStation').then((m) => ({ default: m.OrbStation })),
)

export default function App() {
  const [station, setStation] = useState<StationRoute>(() =>
    getStationFromHash(window.location.hash),
  )

  useEffect(() => {
    applyDeviceQuality()
  }, [])

  useEffect(() => {
    const onHashChange = () => setStation(getStationFromHash(window.location.hash))
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState(null, '', getStationHref('orb'))
    }
  }, [])

  return (
    <main className="experience">
      {import.meta.env.DEV ? (
        <Suspense fallback={null}>
          <LevaRoot />
          {station === 'orb' ? <DevPanel /> : null}
        </Suspense>
      ) : null}
      <nav className={`station-switcher station-switcher-${station}`} aria-label="Station switcher">
        <a
          aria-current={station === 'station-1' ? 'page' : undefined}
          href={getStationHref('station-1')}
        >
          Station I
        </a>
        <a
          aria-current={station === 'station-2' ? 'page' : undefined}
          href={getStationHref('station-2')}
        >
          Station II
        </a>
        <a
          aria-current={station === 'mirror' ? 'page' : undefined}
          href={getStationHref('mirror')}
        >
          Station III
        </a>
        <a aria-current={station === 'orb' ? 'page' : undefined} href={getStationHref('orb')}>
          Orb
        </a>
        <a
          aria-current={station === 'cards' ? 'page' : undefined}
          href={getStationHref('cards')}
        >
          Cards
        </a>
        <a
          aria-current={station === 'avatars' ? 'page' : undefined}
          href={getStationHref('avatars')}
        >
          Avatars
        </a>
      </nav>
      {station === 'station-1' || station === 'station-2' || station === 'mirror' ? (
        <StationVibeToggle />
      ) : null}

      <Suspense fallback={null}>
        {station === 'station-1' ? (
          <MirrorPreviewFrame showToggle={import.meta.env.DEV}>
            <StationOne />
          </MirrorPreviewFrame>
        ) : station === 'station-2' ? (
          <MirrorPreviewFrame showToggle={import.meta.env.DEV}>
            <StationTwo />
          </MirrorPreviewFrame>
        ) : station === 'orb' ? (
          <OrbStation />
        ) : station === 'cards' ? (
          <SecondStation />
        ) : station === 'mirror' ? (
          <ThirdStation />
        ) : (
          <AvatarStation />
        )}
      </Suspense>
    </main>
  )
}
