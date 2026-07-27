import { useMemo, useState } from 'react'
import { createSession, type SessionState, type Stage } from './types'
import { EntryScreen } from './screens/EntryScreen'
import { SelfScreen } from './screens/SelfScreen'
import { DesireScreen } from './screens/DesireScreen'
import { MatchesScreen } from './screens/MatchesScreen'
import { GeneratingScreen } from './screens/GeneratingScreen'
import { RevealScreen } from './screens/RevealScreen'
import './styles/global.css'

const THEME: Record<Stage, 'light' | 'dark'> = {
  entry: 'dark',
  self: 'light',
  desire: 'light',
  matches: 'light',
  generating: 'light',
  reveal: 'dark',
}

function App() {
  const [stage, setStage] = useState<Stage>('entry')
  const [session, setSession] = useState<SessionState>(createSession)

  function restart() {
    setSession(createSession())
    setStage('entry')
  }

  const theme = THEME[stage]
  const shellStyle = useMemo(() => ({ ['--warmth' as string]: '1' }), [])

  return (
    <div className="kiosk" style={shellStyle} data-stage={stage} data-theme={theme}>
      {stage === 'entry' && (
        <EntryScreen onBegin={() => setStage('self')} onRestart={restart} />
      )}

      {stage === 'self' && (
        <SelfScreen
          logs={session.systemLogs}
          onRestart={restart}
          onBack={() => setStage('entry')}
          onComplete={({ displayName, answers, logs }) => {
            setSession((s) => ({
              ...s,
              displayName,
              selfAnswers: answers,
              systemLogs: logs,
            }))
            setStage('desire')
          }}
        />
      )}

      {stage === 'desire' && (
        <DesireScreen
          logs={session.systemLogs}
          onRestart={restart}
          onBack={() => setStage('self')}
          onComplete={({ answers, logs }) => {
            setSession((s) => ({
              ...s,
              desireAnswers: answers,
              systemLogs: logs,
            }))
            setStage('matches')
          }}
        />
      )}

      {stage === 'matches' && (
        <MatchesScreen
          session={session}
          onRestart={restart}
          onBack={() => setStage('desire')}
          onComplete={(payload) => {
            setSession((s) => ({
              ...s,
              matchAnswers: payload.matchAnswers,
              traitWeights: payload.traitWeights,
              lockedPersonaId: payload.lockedPersonaId,
              systemLogs: payload.logs,
              confidence: Math.min(98.4, payload.confidence),
            }))
            setStage('generating')
          }}
        />
      )}

      {stage === 'generating' && (
        <GeneratingScreen
          displayName={session.displayName}
          onRestart={restart}
          onComplete={() => setStage('reveal')}
        />
      )}

      {stage === 'reveal' && (
        <RevealScreen session={session} onRestart={restart} />
      )}
    </div>
  )
}

export default App
