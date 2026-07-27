import { DebraOrb } from '../components/DebraOrb'
import { TopBar } from '../components/TopBar'
import { MATCH_PERSONAS } from '../data/content'
import type { SessionState } from '../types'
import './RevealScreen.css'

type Props = {
  session: SessionState
  onRestart: () => void
}

export function RevealScreen({ session, onRestart }: Props) {
  const locked = MATCH_PERSONAS.find((p) => p.id === session.lockedPersonaId)

  return (
    <section className="screen reveal-screen">
      <TopBar onClose={onRestart} progress={100} />

      <div className="reveal-screen__banner">
        <h1>Your Companion</h1>
      </div>
      <p className="reveal-screen__sub">
        A reflection of your intent, shaped by soft geometry and warm light.
      </p>

      <div className="reveal-screen__frame">
        <span className="reveal-screen__tag">05 Reveal</span>
        <img src="/stitch/05-reveal-asset-7.jpg" alt="" className="reveal-screen__image" />
        <div className="reveal-screen__stats">
          <span>Confidence: {session.confidence.toFixed(1)}%</span>
          <span>Seed accent: coral red</span>
        </div>
      </div>

      <p className="reveal-screen__quote">“They are waiting for you.”</p>

      <aside className="reveal-screen__side">
        <div className="reveal-screen__side-item">
          <DebraOrb size="sm" />
          <div>
            <strong>Debra</strong>
            <span>Your Guide</span>
          </div>
        </div>
        <div className="reveal-screen__side-item">
          <div
            className="reveal-screen__seed"
            style={{ backgroundImage: locked?.image ? `url(${locked.image})` : undefined }}
          />
          <span>Companion</span>
        </div>
        <button type="button" className="reveal-screen__exit" onClick={onRestart}>
          Exit Experience
        </button>
      </aside>

      <button type="button" className="btn-primary reveal-screen__cta" onClick={onRestart}>
        Step into the installation <span aria-hidden>→</span>
      </button>
    </section>
  )
}
