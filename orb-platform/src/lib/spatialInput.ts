export type SpatialInputKey = {
  key: string
}

export type SpatialInputResult = {
  value: string
  submitted: boolean
}

export function applySpatialInput(
  current: string,
  event: SpatialInputKey,
  maxLength: number,
): SpatialInputResult {
  if (event.key === 'Backspace') {
    return { value: current.slice(0, -1), submitted: false }
  }

  if (event.key === 'Enter') {
    return current.trim().length > 0
      ? { value: '', submitted: true }
      : { value: current, submitted: false }
  }

  if (event.key.length !== 1 || current.length >= maxLength) {
    return { value: current, submitted: false }
  }

  return { value: current + event.key, submitted: false }
}
