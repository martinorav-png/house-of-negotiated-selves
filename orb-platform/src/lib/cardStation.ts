import { CARD_QUESTIONS } from './questions'

export type StationCard = {
  kicker: string
  title: string
  body: string
}

export const stationCards: StationCard[] = CARD_QUESTIONS.map((question, index) => ({
  kicker: `Question ${String(index + 1).padStart(2, '0')}`,
  title: question,
  body: 'Served from the deck.',
}))
