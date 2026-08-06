export function typedSlice(text: string, elapsedSeconds: number, charsPerSecond: number) {
  if (elapsedSeconds <= 0 || charsPerSecond <= 0) return ''

  const visibleChars = Math.min(text.length, Math.floor(elapsedSeconds * charsPerSecond))
  return text.slice(0, visibleChars)
}
