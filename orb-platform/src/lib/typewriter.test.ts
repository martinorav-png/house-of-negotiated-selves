import { describe, expect, it } from 'vitest'
import { typedSlice } from './typewriter'

describe('typedSlice', () => {
  it('reveals no characters before time has elapsed', () => {
    expect(typedSlice('When do you feel most like yourself?', 0, 18)).toBe('')
  })

  it('reveals characters according to elapsed time and speed', () => {
    expect(typedSlice('Noting what you avoided', 0.5, 10)).toBe('Notin')
  })

  it('clamps to the full text once the question has finished typing', () => {
    expect(typedSlice('Stay?', 10, 12)).toBe('Stay?')
  })
})
