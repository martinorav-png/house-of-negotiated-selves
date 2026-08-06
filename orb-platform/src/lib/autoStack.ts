export type AutoCardMotionPhase = 'departing' | 'settled'
export const AUTO_STACK_INTERVAL_MS = 4200
export const AUTO_STACK_DEPARTURE_MS = 900

export function shouldAdvanceAutoStack(isPaused: boolean) {
  return !isPaused
}

export function getAutoCardMotion(phase: AutoCardMotionPhase) {
  if (phase === 'departing') {
    return { x: -112, rotateY: -10, rotateZ: -6 }
  }

  return { x: 0, rotateY: 0, rotateZ: 0 }
}

export function sendTopCardToBack<T>(stack: T[]) {
  if (stack.length < 2) return stack
  const next = [...stack]
  const top = next.pop()
  if (top === undefined) return stack
  next.unshift(top)
  return next
}
