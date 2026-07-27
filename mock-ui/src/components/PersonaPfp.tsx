import './PersonaPfp.css'

type Props = {
  name: string
  hue: number
  accent: string
  image?: string
  active?: boolean
  locked?: boolean
  dimmed?: boolean
  idleBubble?: boolean
  onClick?: () => void
}

export function PersonaPfp({
  name,
  hue,
  accent,
  image,
  active,
  locked,
  dimmed,
  idleBubble,
  onClick,
}: Props) {
  const initial = name.slice(0, 1)

  return (
    <button
      type="button"
      className={[
        'persona-pfp',
        active && 'persona-pfp--active',
        locked && 'persona-pfp--locked',
        dimmed && 'persona-pfp--dimmed',
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={onClick}
      aria-label={name}
      aria-pressed={active}
    >
      {idleBubble && !active && (
        <span className="persona-pfp__idle" aria-hidden>
          …
        </span>
      )}
      <span
        className="persona-pfp__face"
        style={{
          background: image
            ? undefined
            : `linear-gradient(145deg, hsl(${hue} 40% 55%), hsl(${hue} 30% 30%))`,
          boxShadow: active
            ? `0 0 0 3px ${accent}, 0 0 24px color-mix(in srgb, ${accent} 40%, transparent)`
            : undefined,
        }}
      >
        {image ? (
          <img src={image} alt="" className="persona-pfp__img" />
        ) : (
          <span className="persona-pfp__initial">{initial}</span>
        )}
      </span>
      <span className="persona-pfp__name">{name}</span>
    </button>
  )
}
