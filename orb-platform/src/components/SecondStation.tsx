import { lazy, Suspense } from 'react'
import { QuestionCardDeck } from './QuestionCardDeck'
import { CardPointCloudRoom } from './CardPointCloudRoom'
import './SecondStation.css'

// Dynamically imported so `leva` is excluded from the production bundle —
// same reasoning as the Orb station's DevPanel (see App.tsx).
const CardsDevPanel = lazy(() =>
  import('../dev/CardsDevPanel').then((m) => ({ default: m.CardsDevPanel })),
)

export function SecondStation() {
  return (
    <section
      className="second-station"
      aria-label="Second station question cards"
    >
      <CardPointCloudRoom />
      <QuestionCardDeck />
      {import.meta.env.DEV ? (
        <Suspense fallback={null}>
          <CardsDevPanel />
        </Suspense>
      ) : null}
    </section>
  )
}
