function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

/**
 * Single smooth pulse — 0…1. Quick smooth rise, then a slow, fully
 * monotonic decay back to 0 (no secondary bump, no overshoot/rebound).
 * A prior twin-peak "lub-dub" version snapped up and down fast enough to
 * read as a bouncy, springy effect; this is a plainer, calmer breathing
 * curve — rise and fall never reverse direction mid-motion.
 */
export function heartbeat(timeSec: number, bpm: number, amp = 1): number {
  const cycle = 60 / Math.max(bpm, 1)
  const p = (timeSec % cycle) / cycle
  const rise = smoothstep(0, 0.06, p)
  const fall = 1 - smoothstep(0.06, 1, p)
  return rise * fall * amp
}
