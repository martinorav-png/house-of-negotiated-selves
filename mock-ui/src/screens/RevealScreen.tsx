import { BottomNav } from '../components/BottomNav'
import { ConfidenceMeter } from '../components/ConfidenceMeter'
import { DebraOrb } from '../components/DebraOrb'
import { SystemLog } from '../components/SystemLog'
import { TopBar } from '../components/TopBar'
import { DEBRA_STATION, MATCH_PERSONAS } from '../data/content'
import type { SessionState } from '../types'
import './RevealScreen.css'

type Props = {
  session: SessionState
  visitorId?: string
  onRestart: () => void
}

export function RevealScreen({ session, visitorId, onRestart }: Props) {
  const locked = MATCH_PERSONAS.find((p) => p.id === session.lockedPersonaId)

  return (
    <section className="screen reveal-screen">
      <TopBar
        onClose={onRestart}
        progress={100}
        stationCode="CHAMBER"
        visitorId={visitorId}
        confidence={session.confidence}
      />

      <div className="reveal-screen__body">
        <main className="reveal-screen__main">
          <header className="reveal-screen__intro">
            <h1 className="reveal-screen__title">Your companion</h1>
            <p className="reveal-screen__sub">
              Session reveal. Chamber entrance authorized.
            </p>
          </header>

          <div className="reveal-screen__card">
            <div className="reveal-screen__image-wrap">
              <img
                src="/stitch/05-reveal-asset-7.jpg"
                alt=""
                className="reveal-screen__image"
              />
              <span className="reveal-screen__live">Live rendering</span>
            </div>
            <div className="reveal-screen__meta">
              <div>
                <p className="reveal-screen__name">{locked?.name ?? 'Unknown'}</p>
                <p className="reveal-screen__tag">Synthetic companion</p>
              </div>
              <div className="reveal-screen__prob">
                <span>Probability</span>
                <ConfidenceMeter value={session.confidence} label="Match" />
              </div>
              <p className="reveal-screen__blurb">
                Built to mirror what you shared freely. Tuned for long negotiation,
                not a quick match.
              </p>
              <blockquote className="reveal-screen__quote">
                {DEBRA_STATION.chamberInvite}
              </blockquote>
            </div>
          </div>

          <div className="reveal-screen__debra-panel">
            <DebraOrb size="md" />
            <div>
              <p className="reveal-screen__debra-label">Debra AI interface</p>
              <p className="reveal-screen__debra-line" role="status" aria-live="polite">
                {DEBRA_STATION.chamberInvite}
              </p>
            </div>
          </div>
        </main>

        <aside className="reveal-screen__rail">
          <div className="reveal-screen__identity">
            <h2>Debra OS</h2>
            <p>v.2.0.4-mirror</p>
          </div>
          <SystemLog lines={session.systemLogs} maxVisible={8} title="Session log" />
          <button type="button" className="reveal-screen__terminate" onClick={onRestart}>
            End session
          </button>
        </aside>
      </div>

      <BottomNav
        onBack={onRestart}
        onNext={onRestart}
        nextLabel="Continue session"
        advisory="Chamber ready"
      />
    </section>
  )
}
