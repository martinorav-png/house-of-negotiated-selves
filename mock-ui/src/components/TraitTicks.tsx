import { TRAIT_LABELS } from '../data/content'
import type { TraitKey } from '../types'
import './TraitTicks.css'

type Props = {
  weights: Record<TraitKey, number>
}

export function TraitTicks({ weights }: Props) {
  const entries = (Object.keys(TRAIT_LABELS) as TraitKey[]).filter(
    (k) => weights[k] > 0,
  )
  if (entries.length === 0) return null

  return (
    <ul className="trait-ticks" aria-label="Preference signals">
      {entries.map((key) => (
        <li key={key}>
          <span>{TRAIT_LABELS[key]}</span>
          <span className="trait-ticks__dots">
            {Array.from({ length: Math.min(weights[key], 5) }).map((_, i) => (
              <i key={i} />
            ))}
          </span>
        </li>
      ))}
    </ul>
  )
}
