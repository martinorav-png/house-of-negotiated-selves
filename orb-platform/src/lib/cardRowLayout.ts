import type { CSSProperties } from 'react'

type LayeredCardStyle = CSSProperties & {
  '--card-x': string
  '--card-y': string
  '--card-depth': string
  '--card-opacity': string
  '--card-tilt': string
}

export function getLayeredCardStyle(index: number, total: number): LayeredCardStyle {
  const last = Math.max(1, total - 1)
  const progress = index / last
  const x = Math.round(-260 + progress * 485)
  const y = Math.round(136 - progress * 252)
  const depth = -index * 50
  const opacity = (0.88 - progress * 0.36).toFixed(2)
  const tilt = `${-8 + progress * 4}deg`

  return {
    zIndex: 10 - index,
    '--card-x': `${x}px`,
    '--card-y': `${y}px`,
    '--card-depth': `${depth}px`,
    '--card-opacity': opacity,
    '--card-tilt': tilt,
  }
}
