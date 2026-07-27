import { useEffect, useState } from 'react'
import { DebraOrb } from '../components/DebraOrb'
import { TopBar } from '../components/TopBar'
import './GeneratingScreen.css'

const SEGMENTS = 8

type Props = {
  displayName: string
  onComplete: () => void
  onRestart: () => void
}

export function GeneratingScreen({ displayName, onComplete, onRestart }: Props) {
  const [filled, setFilled] = useState(0)

  useEffect(() => {
    if (filled >= SEGMENTS) {
      const t = window.setTimeout(onComplete, 800)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => setFilled((s) => s + 1), 450)
    return () => window.clearTimeout(t)
  }, [filled, onComplete])

  return (
    <section className="screen generating-screen">
      <TopBar onClose={onRestart} progress={75 + (filled / SEGMENTS) * 20} />

      <div className="generating-screen__copy">
        <h1>Forging your match...</h1>
        <p>Almost there. Your presence has been informative{displayName ? `, ${displayName}` : ''}.</p>
      </div>

      <div className="generating-screen__card">
        <div className="generating-screen__card-head">
          <strong>04 Generating</strong>
          <span>Form & Data Synthesis | Intimate Connection</span>
        </div>
        <div className="generating-screen__figure-wrap">
          <img
            src="/stitch/04-generating-asset-6.jpg"
            alt=""
            className="generating-screen__figure"
          />
          <p className="generating-screen__meta left">
            Process status: activating biometric mapping
          </p>
          <p className="generating-screen__meta right">
            Mesh integrity: {70 + filled * 3}% | Datastream: active
          </p>
        </div>
      </div>

      <div className="generating-screen__segments" aria-hidden>
        {Array.from({ length: SEGMENTS }).map((_, i) => (
          <i key={i} className={i < filled ? 'is-filled' : undefined} />
        ))}
      </div>

      <aside className="generating-screen__debra">
        <DebraOrb size="sm" />
        <div>
          <p className="label-sm">Debra</p>
          <p>Your Guide</p>
        </div>
      </aside>
    </section>
  )
}
