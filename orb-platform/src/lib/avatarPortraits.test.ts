import { describe, expect, it } from 'vitest'
import { avatarPortraits } from './avatarPortraits'

describe('avatarPortraits', () => {
  it('points the avatar station at the five portrait assets', () => {
    expect(avatarPortraits).toHaveLength(5)
    expect(avatarPortraits.map((portrait) => portrait.image)).toEqual([
      '/assets/personas/persona-1.png',
      '/assets/personas/persona-2.png',
      '/assets/personas/persona-3.png',
      '/assets/personas/persona-4.png',
      '/assets/personas/persona-5.png',
    ])
  })
})
