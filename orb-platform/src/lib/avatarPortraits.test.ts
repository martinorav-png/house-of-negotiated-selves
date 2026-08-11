import { describe, expect, it } from 'vitest'
import { avatarPortraits } from './avatarPortraits'

describe('avatarPortraits', () => {
  it('wires the five public persona assets into the avatar station', () => {
    expect(avatarPortraits).toHaveLength(5)
    expect(avatarPortraits.map((portrait) => portrait.id)).toEqual([
      'persona-1',
      'persona-2',
      'persona-3',
      'persona-4',
      'persona-5',
    ])
    expect(avatarPortraits.map((portrait) => portrait.image)).toEqual([
      '/assets/personas/persona-1.png',
      '/assets/personas/persona-2.png',
      '/assets/personas/persona-3.png',
      '/assets/personas/persona-4.png',
      '/assets/personas/persona-5.png',
    ])
  })
})
