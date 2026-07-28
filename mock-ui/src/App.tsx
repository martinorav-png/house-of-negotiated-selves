import { useMemo, useState } from 'react'
import { createSession, type SessionState, type Stage } from './types'
import { GalleryScreen } from './screens/GalleryScreen'
import { EntryScreen } from './screens/EntryScreen'
import { SelfScreen } from './screens/SelfScreen'
import { DesireScreen } from './screens/DesireScreen'
import { MatchesScreen } from './screens/MatchesScreen'
import { GeneratingScreen } from './screens/GeneratingScreen'
import { RevealScreen } from './screens/RevealScreen'
import { BUILTIN_DIRECTIONS, getDirection } from './data/designDirections'
import './styles/global.css'

const DEFAULT_DIRECTION = 'institutional'

function readDirectionFromUrl(): string | null {
  return new URLSearchParams(window.location.search).get('direction')
}

function makeVisitorId(name: string): string {
  const seed = name
    .toUpperCase()
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const a = String(8000 + (seed % 1000)).padStart(4, '0')
  const b = String(1000 + ((seed * 7) % 9000)).padStart(4, '0')
  return `${a}-${b}`
}

function App() {
  const urlDirection = readDirectionFromUrl()
  const initialDirection =
    urlDirection && getDirection(urlDirection) ? urlDirection : DEFAULT_DIRECTION
  const [directionId, setDirectionId] = useState(initialDirection)
  const [stage, setStage] = useState<Stage>(urlDirection && getDirection(urlDirection) ? 'entry' : 'gallery')
  const [session, setSession] = useState<SessionState>(createSession)

  const visitorId = useMemo(
    () => (session.displayName ? makeVisitorId(session.displayName) : undefined),
    [session.displayName],
  )

  const resolvedDirection = getDirection(directionId)?.id ?? DEFAULT_DIRECTION

  const builtinIds = useMemo(() => new Set(BUILTIN_DIRECTIONS.map((d) => d.id)), [])

  const customThemeStyle = useMemo(() => {
    if (builtinIds.has(resolvedDirection)) return undefined
    const dir = getDirection(resolvedDirection)
    if (!dir) return undefined
    const [a, b, c, d] = dir.swatches
    return {
      '--void': a,
      '--surface': a,
      '--panel': d,
      '--phosphor': b,
      '--phosphor-dim': `color-mix(in srgb, ${b} 35%, ${a})`,
      '--amber': c,
      '--accent': b,
      '--field-bg': a,
      '--field-fg': '#f4f2ed',
    } as React.CSSProperties
  }, [resolvedDirection, builtinIds])

  function syncUrlForFlow(inFlow: boolean, id?: string) {
    const url = new URL(window.location.href)
    url.searchParams.delete('enter')
    url.searchParams.delete('direction')
    if (inFlow && id) {
      url.searchParams.set('direction', id)
    }
    window.history.replaceState({}, '', url.pathname + url.search)
  }

  function selectDirection(id: string) {
    setDirectionId(id)
    setSession(createSession())
    setStage('entry')
    syncUrlForFlow(true, id)
  }

  function returnToGallery() {
    setSession(createSession())
    setStage('gallery')
    syncUrlForFlow(false)
  }

  if (stage === 'gallery') {
    return <GalleryScreen onSelect={selectDirection} />
  }

  return (
    <div
      className="kiosk"
      data-stage={stage}
      data-direction={builtinIds.has(resolvedDirection) ? resolvedDirection : 'custom'}
      style={customThemeStyle}
    >
      {stage === 'entry' && (
        <EntryScreen onBegin={() => setStage('self')} onRestart={returnToGallery} />
      )}

      {stage === 'self' && (
        <SelfScreen
          logs={session.systemLogs}
          confidence={session.confidence}
          onRestart={returnToGallery}
          onBack={() => setStage('entry')}
          onComplete={({ displayName, answers, logs, confidence }) => {
            setSession((s) => ({
              ...s,
              displayName,
              selfAnswers: answers,
              systemLogs: logs,
              confidence,
            }))
            setStage('desire')
          }}
        />
      )}

      {stage === 'desire' && (
        <DesireScreen
          logs={session.systemLogs}
          confidence={session.confidence}
          visitorId={visitorId}
          onRestart={returnToGallery}
          onBack={() => setStage('self')}
          onComplete={({ answers, logs, confidence }) => {
            setSession((s) => ({
              ...s,
              desireAnswers: answers,
              systemLogs: logs,
              confidence,
            }))
            setStage('matches')
          }}
        />
      )}

      {stage === 'matches' && (
        <MatchesScreen
          session={session}
          visitorId={visitorId}
          onRestart={returnToGallery}
          onBack={() => setStage('desire')}
          onComplete={(payload) => {
            setSession((s) => ({
              ...s,
              matchAnswers: payload.matchAnswers,
              traitWeights: payload.traitWeights,
              lockedPersonaId: payload.lockedPersonaId,
              systemLogs: payload.logs,
              confidence: payload.confidence,
            }))
            setStage('generating')
          }}
        />
      )}

      {stage === 'generating' && (
        <GeneratingScreen
          displayName={session.displayName}
          confidence={session.confidence}
          visitorId={visitorId}
          onRestart={returnToGallery}
          onComplete={() => setStage('reveal')}
        />
      )}

      {stage === 'reveal' && (
        <RevealScreen session={session} visitorId={visitorId} onRestart={returnToGallery} />
      )}
    </div>
  )
}

export default App
