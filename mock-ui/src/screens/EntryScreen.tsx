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
  return (
    <section className="screen entry-screen">
      <TopBar onClose={onRestart} />
      <div className="entry-screen__orb">
        <DebraOrb size="lg" />
      </div>
      <div className="entry-screen__copy">
        <h1 className="entry-screen__title">
          {DEBRA_INTRO_LEAD}
          <br />
          <em>{DEBRA_INTRO_ITALIC}</em>
        </h1>
        <p className="entry-screen__sub">{DEBRA_INTRO_SUB}</p>
      </div>
      <button type="button" className="btn-primary entry-screen__cta" onClick={onBegin}>
        Begin intake <span aria-hidden>→</span>
      </button>
    </section>
  )
}
