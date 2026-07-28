import { useEffect, useState } from 'react'
import { BottomNav } from '../components/BottomNav'
import { DebraOrb } from '../components/DebraOrb'
import { TopBar } from '../components/TopBar'
import { DEBRA_STATION } from '../data/content'
import './GeneratingScreen.css'

const STAGES = [
  'Biometric mapping',
  'Trait synthesis',
  'Voice harmonics',
  'Silhouette merge',
  'Companion forge',
]

type Props = {
  displayName: string
  confidence: number
  visitorId?: string
  onComplete: () => void
  onRestart: () => void
}

export function GeneratingScreen({
  displayName,
  confidence,
  visitorId,
  onComplete,
  onRestart,
}: Props) {
  const [stage, setStage] = useState(0)
  const [progress, setProgress] = useState(65)

  useEffect(() => {
    if (stage >= STAGES.length) {
      const t = window.setTimeout(onComplete, 900)
      return () => window.clearTimeout(t)
    }
    const t = window.setTimeout(() => {
      setStage((s) => s + 1)
      setProgress((p) => Math.min(95, p + 6))
    }, 900)
    return () => window.clearTimeout(t)
  }, [stage, onComplete])

  return (
    <section className="screen generating-screen">
      <TopBar
        onClose={onRestart}
        progress={progress}
        stationCode="STN-04"
        visitorId={visitorId}
        confidence={Math.max(confidence, 90 + stage)}
        phaseLabel="Phase: reconstruction"
      />

      <div className="generating-screen__inner">
        <header className="generating-screen__header">
          <h1 className="generating-screen__title">Forging your match</h1>
          <p className="generating-screen__sub">
            Starting archetype synthesis
            {displayName ? ` for ${displayName}` : ''}.
          </p>
        </header>

        <div className="generating-screen__panels">
          <div className="generating-screen__figure">
            <img src="/stitch/04-generating-asset-6.jpg" alt="" />
            <div className="generating-screen__scan" aria-hidden />
            <div className="generating-screen__figure-meta">
              <span>Scan res: 8192px</span>
              <span>Status: in progress</span>
            </div>
          </div>

          <div className="generating-screen__pipeline">
            {STAGES.map((label, i) => (
              <div
                key={label}
                className={[
                  'generating-screen__stage',
                  i < stage && 'is-done',
                  i === stage && 'is-active',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="generating-screen__stage-num">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="generating-screen__stage-label">{label}</span>
                <span className="generating-screen__stage-status">
                  {i < stage ? '[OK]' : i === stage ? '[RUN]' : '[...]'}
                </span>
              </div>
            ))}
            <p className="generating-screen__debra-line" role="status" aria-live="polite">
              <span>Debra OS:</span> {DEBRA_STATION.chamberInvite}
              <span className="generating-screen__cursor" aria-hidden />
            </p>
          </div>
        </div>

        <div className="generating-screen__brand">
          <DebraOrb size="sm" />
          <span>Institutional AI assistant</span>
        </div>
      </div>

      <BottomNav
        onBack={onRestart}
        nextLabel="Continue"
        nextDisabled
        advisory="System stability: nominal"
      />
    </section>
  )
}
