import { useEffect, useRef } from 'react'
import './SystemLog.css'

type Props = {
  lines: string[]
  maxVisible?: number
  title?: string
}

export function SystemLog({ lines, maxVisible = 8, title = 'System log' }: Props) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    endRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })
  }, [lines.length])

  return (
    <div className="system-log" aria-live="polite" aria-label="System activity log">
      <p className="system-log__header">{title}</p>
      <div className="system-log__feed">
        {lines.length === 0 ? (
          <p className="system-log__line system-log__line--idle">&gt; waiting for input</p>
        ) : (
          lines.slice(-maxVisible).map((line, i) => (
            <p key={`${i}-${line}`} className="system-log__line">
              <span className="system-log__prefix">&gt;</span> {line}
            </p>
          ))
        )}
        <div ref={endRef} />
      </div>
    </div>
  )
}
