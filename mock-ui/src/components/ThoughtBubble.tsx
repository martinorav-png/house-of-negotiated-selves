import './ThoughtBubble.css'

type Props = {
  text: string
  accent: string
  name: string
  visible: boolean
}

export function ThoughtBubble({ text, accent, name, visible }: Props) {
  return (
    <div
      className={['thought-bubble', visible && 'thought-bubble--visible']
        .filter(Boolean)
        .join(' ')}
      style={{ ['--bubble-accent' as string]: accent }}
      role="status"
    >
      <p className="thought-bubble__from">{name} asks</p>
      <p className="thought-bubble__text">{text}</p>
      <span className="thought-bubble__tail" aria-hidden />
    </div>
  )
}
