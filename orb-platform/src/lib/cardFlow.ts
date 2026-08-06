export type ServedCardPhase = 'stacked' | 'serving' | 'active' | 'returning'

export type ServedCardState = {
  activeIndex: number
  phase: ServedCardPhase
  progress: number
}

const OPENING_PAUSE = 0.9
const SERVE_DURATION = 1.25
const ACTIVE_DURATION = 3.15
const RETURN_DURATION = 1.25
const CYCLE_DURATION = SERVE_DURATION + ACTIVE_DURATION + RETURN_DURATION

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

export function getServedCardState(elapsedSeconds: number, cardCount: number): ServedCardState {
  if (elapsedSeconds < OPENING_PAUSE || cardCount < 1) {
    return {
      activeIndex: -1,
      phase: 'stacked',
      progress: 0,
    }
  }

  const cycleTime = elapsedSeconds - OPENING_PAUSE
  const activeIndex = Math.floor(cycleTime / CYCLE_DURATION) % cardCount
  const localTime = cycleTime % CYCLE_DURATION

  if (localTime < SERVE_DURATION) {
    return {
      activeIndex,
      phase: 'serving',
      progress: clamp01(localTime / SERVE_DURATION),
    }
  }

  if (localTime < SERVE_DURATION + ACTIVE_DURATION) {
    return {
      activeIndex,
      phase: 'active',
      progress: clamp01((localTime - SERVE_DURATION) / ACTIVE_DURATION),
    }
  }

  return {
    activeIndex,
    phase: 'returning',
    progress: clamp01((localTime - SERVE_DURATION - ACTIVE_DURATION) / RETURN_DURATION),
  }
}
