/**
 * Dual-peak “lub-dub” envelope — returns 0…1.
 * Phase is driven by wall-clock time and BPM.
 */
export function heartbeat(
  timeSec: number,
  bpm: number,
  lubAmp = 1,
  dubAmp = 0.55,
): number {
  const cycle = 60 / Math.max(bpm, 1)
  const p = (timeSec % cycle) / cycle

  // Narrow gaussian bumps — lub then softer dub, then rest
  const lubX = (p - 0.08) / 0.055
  const dubX = (p - 0.27) / 0.068
  const lub = Math.exp(-(lubX * lubX)) * lubAmp
  const dub = Math.exp(-(dubX * dubX)) * dubAmp
  return Math.min(1, lub + dub)
}
