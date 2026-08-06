import { typedSlice } from './typewriter'

export function getMirrorPromptText(
  question: string,
  elapsedSeconds: number,
  charsPerSecond: number,
  cursorVisible: boolean,
) {
  const visible = typedSlice(question, elapsedSeconds, charsPerSecond)
  if (visible.length >= question.length) return visible
  return `${visible}${cursorVisible ? '_' : ''}`
}
