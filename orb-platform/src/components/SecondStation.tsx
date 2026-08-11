import { QuestionCardDeck } from './QuestionCardDeck'
import { CardPointCloudRoom } from './CardPointCloudRoom'
import './SecondStation.css'

export function SecondStation() {
  return (
    <section
      className="second-station"
      aria-label="Second station question cards"
    >
      <CardPointCloudRoom />
      <QuestionCardDeck />
    </section>
  )
}
