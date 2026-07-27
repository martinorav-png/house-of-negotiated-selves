type Props = {
  lines: string[]
}

export function SystemLog({ lines }: Props) {
  if (lines.length === 0) return null
  const recent = lines.slice(-3)
  return (
    <div className="system-log" aria-live="polite">
      {recent.map((line) => (
        <span key={line}>{line}</span>
      ))}
    </div>
  )
}
