import { describe, expect, it } from 'vitest'
import { getMirrorPromptText } from './mirrorPrompt'

describe('getMirrorPromptText', () => {
  it('reveals the question without glitch artifacts', () => {
    expect(getMirrorPromptText('What do you want remembered?', 0.5, 10, false)).toBe('What ')
  })

  it('adds a quiet cursor only while typing', () => {
    expect(getMirrorPromptText('Stay?', 0.2, 10, true)).toBe('St_')
  })

  it('removes the cursor when the whole question is visible', () => {
    expect(getMirrorPromptText('Stay?', 10, 10, true)).toBe('Stay?')
  })
})
