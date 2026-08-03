/** Plain-language lines for the back-wall CRT — human, not telemetry. */

export type LogLine = {
  id: number
  text: string
  kind: 'info' | 'data' | 'warn' | 'ok'
}

const LINES: { kind: LogLine['kind']; text: string }[] = [
  { kind: 'info', text: 'Someone is in the room' },
  { kind: 'info', text: 'Listening' },
  { kind: 'info', text: 'Waiting for an answer' },
  { kind: 'info', text: 'Still here' },
  { kind: 'data', text: 'You sound unsure' },
  { kind: 'data', text: 'That felt honest' },
  { kind: 'data', text: 'Holding onto that' },
  { kind: 'data', text: 'Noting what you avoided' },
  { kind: 'data', text: 'Softening the edges' },
  { kind: 'data', text: 'Matching your pace' },
  { kind: 'ok', text: 'Got it' },
  { kind: 'ok', text: 'Saved for later' },
  { kind: 'ok', text: 'Ready when you are' },
  { kind: 'ok', text: 'That lands' },
  { kind: 'warn', text: 'You hesitated' },
  { kind: 'warn', text: 'Something pulled back' },
  { kind: 'warn', text: 'Try that again, slower' },
  { kind: 'info', text: 'Breathing with you' },
  { kind: 'data', text: 'Looking for a fit' },
  { kind: 'data', text: 'Close, but not quite' },
  { kind: 'ok', text: 'Almost there' },
  { kind: 'info', text: 'Nothing leaves this room' },
  { kind: 'data', text: 'Remembering the quiet parts' },
  { kind: 'info', text: 'Debra is nearby' },
]

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

let lineId = 0

export function createLogLine(): LogLine {
  const line = pick(LINES)
  return {
    id: lineId++,
    kind: line.kind,
    text: line.text,
  }
}

export function createBootLines(): LogLine[] {
  return [
    {
      id: lineId++,
      kind: 'info',
      text: 'Waiting for you',
    },
  ]
}
