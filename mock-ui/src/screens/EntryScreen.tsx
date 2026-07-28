import { useEffect, useRef } from 'react'
import { DebraOrb } from '../components/DebraOrb'
import { TopBar } from '../components/TopBar'
import {
  DEBRA_INTRO_ITALIC,
  DEBRA_INTRO_LEAD,
  DEBRA_INTRO_SUB,
} from '../data/content'
import './EntryScreen.css'

type Props = {
  onBegin: () => void
  onRestart: () => void
}

export function EntryScreen({ onBegin, onRestart }: Props) {
  const orbRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const orb = orbRef.current
    if (!orb) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return

    function onMove(e: MouseEvent) {
      if (!orb) return
      const x = (window.innerWidth / 2 - e.clientX) / 50
      const y = (window.innerHeight / 2 - e.clientY) / 50
      orb.style.transform = `translate(${x}px, ${y}px)`
    }

    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  return (
    <section className="screen entry-screen">
      <TopBar onClose={onRestart} stationCode="ENTRANCE" />
      <div className="entry-screen__atmosphere" aria-hidden />

      <main className="entry-screen__inner">
        <div className="entry-screen__orb-block">
          <div className="entry-screen__orb" ref={orbRef}>
            <DebraOrb size="lg" />
          </div>
          <div className="entry-screen__entity">
            <span>Entity // Debra OS</span>
          </div>
        </div>

        <div className="entry-screen__copy">
          <h1 className="entry-screen__welcome">{DEBRA_INTRO_LEAD}</h1>
          <p className="entry-screen__title">
            {DEBRA_INTRO_ITALIC}
            <br />
            {DEBRA_INTRO_SUB}
          </p>
        </div>

        <button type="button" className="btn-primary entry-screen__cta" onClick={onBegin}>
          Begin intake <span aria-hidden>→</span>
        </button>
      </main>

      <footer className="entry-screen__footer">
        <div className="entry-screen__footer-bar">
          <span className="entry-screen__footer-id">STN-00 // Waiting</span>
          <span className="entry-screen__footer-rule" aria-hidden />
          <p className="entry-screen__legal">
            Solo experience · One participant · Data processed for this session only
          </p>
        </div>
      </footer>
    </section>
  )
}
