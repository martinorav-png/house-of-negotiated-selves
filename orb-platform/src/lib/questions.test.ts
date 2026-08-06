import { describe, expect, it } from 'vitest'
import { CARD_QUESTIONS, QUESTIONS } from './questions'

describe('station question script', () => {
  it('keeps the orb prompts in the order of the first station script', () => {
    expect(QUESTIONS).toEqual([
      'What is your full government name?',
      'What is your date of birth?',
      'What is your orientation?',
      'What are your hobbies?',
      'What do you fight for?',
      'What is your religion?',
      'What is your nationality?',
      'Can I take your picture?',
    ])
  })

  it('keeps the card prompts in the order of the second station script', () => {
    expect(CARD_QUESTIONS).toHaveLength(7)
    expect(CARD_QUESTIONS[0]).toBe(
      'Are you introverted or extroverted, or somewhere in between?',
    )
    expect(CARD_QUESTIONS.at(-1)).toBe(
      'Which hair colour would you love to wake up next to?',
    )
  })
})
