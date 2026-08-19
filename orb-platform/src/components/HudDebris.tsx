import type { CSSProperties } from 'react'
import './HudDebris.css'

/** Real (if meaningless) filler content — hex/coordinate/status noise —
 * rather than abstract bars, since actual illegible-at-a-glance text is
 * what the Detroit-style reference is doing too; a couple of key/value
 * header lines sit above a scrolling body pulled from this pool. */
export const CODE_HEADERS: [string, string][] = [
  ['NODE  0x7F2C', 'SIG  92.4%'],
  ['SEQ  884219', 'CH  14/16'],
  ['REF  A3.09', 'SYNC  0x4F'],
  ['CTRL  0x9F1', 'BUS  2/4'],
]

export const CODE_BODY_POOL = [
  'buffer.flush(node=12) ok',
  'req 200 · 14.2ms',
  'vector[7] = 0.8341',
  'thermal Δ -0.02C',
  'auth token refreshed',
  'queue depth 128/512',
  'checksum 9f3a..c21',
  'sample #442 captured',
  'latency p99 8.7ms',
  'compiling match.bin',
  '0x22F1 :: nominal',
  'gyro 0.004 0.991 -0.02',
  'hash 7b2c4e91',
  'frame 0441/0512',
  'resolving vector map',
  'sig-to-noise 41.2dB',
  'cache miss rate 2.1%',
  'node cluster synced',
  'delta 0.0031s',
  'biometric variance low',
  'encoding stream b',
  '42.771, -8.220',
  'retry(3) succeeded',
  'handshake complete',
  'voice print matched',
  'align pass 3/5',
  'temp core 36.6C',
  'packet loss 0.0%',
  'index rebuilt ok',
]

export const CODE_ALERTS = [
  'ERR 0x22 checksum_fail',
  'WARN drift +0.4%',
  'retry limit reached',
  'signal degraded',
]

export const LINES_PER_BLOCK = 10
export const CODE_LINE_PX = 9.6
/** Line height for the `big` variant (Mirror station only, see
 * ThirdStation.tsx's HudDebrisField) — matches .mirror-code-panel.is-big's
 * font-size/line-height in HudDebris.css. */
export const CODE_LINE_PX_BIG = 13.5

/** A small, mostly-illegible "log panel" — a fixed key/value header over a
 * body that jump-cuts a whole block of lines at a time (steps() timing, no
 * interpolation in between) rather than scrolling smoothly. Body content
 * is doubled so the loop is seamless. One row can render as a dim red
 * "alert" line. Large panels show more blocks at once (a dense wall of
 * text) while ghost/secondary ones stay compact; `big` scales the type
 * itself up (independent of `large`, which only widens the panel). */
export function CodePanel({
  seed,
  blockCount = 3,
  visibleRows = 5,
  large = false,
  big = false,
  style,
  ghost = false,
  duration = 5,
  hasAlert = false,
}: {
  seed: number
  blockCount?: number
  visibleRows?: number
  large?: boolean
  big?: boolean
  style?: CSSProperties
  ghost?: boolean
  duration?: number
  hasAlert?: boolean
}) {
  const [h1, h2] = CODE_HEADERS[seed % CODE_HEADERS.length]
  const rowCount = blockCount * LINES_PER_BLOCK
  const rows = Array.from(
    { length: rowCount },
    (_, i) => CODE_BODY_POOL[(seed * 5 + i * 3) % CODE_BODY_POOL.length],
  )
  const alertIndex = hasAlert ? seed % rowCount : -1
  if (alertIndex >= 0) rows[alertIndex] = CODE_ALERTS[seed % CODE_ALERTS.length]

  const blocks = Array.from({ length: blockCount }, (_, b) =>
    rows.slice(b * LINES_PER_BLOCK, b * LINES_PER_BLOCK + LINES_PER_BLOCK),
  )

  const className = [
    'mirror-code-panel',
    ghost ? 'is-ghost' : null,
    large ? 'is-lg' : null,
    big ? 'is-big' : null,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className} style={style} aria-hidden="true">
      <div className="mirror-code-header">
        <span>{h1}</span>
        <span>{h2}</span>
      </div>
      <div
        className="mirror-code-scroll"
        style={
          {
            '--dur': `${duration}s`,
            '--steps': blockCount,
            '--h': `${visibleRows * (big ? CODE_LINE_PX_BIG : CODE_LINE_PX)}px`,
          } as CSSProperties
        }
      >
        <div className="mirror-code-track">
          {[0, 1].map((copy) =>
            blocks.map((block, b) => (
              <div className="mirror-code-block" key={`${copy}-${b}`}>
                {block.map((text, i) => {
                  const rowIndex = b * LINES_PER_BLOCK + i
                  return (
                    <div
                      key={i}
                      className={rowIndex === alertIndex ? 'mirror-code-row is-alert' : 'mirror-code-row'}
                    >
                      {text}
                    </div>
                  )
                })}
              </div>
            )),
          )}
        </div>
      </div>
    </div>
  )
}

/** A tiny fake progress sliver — fixed base fill that idly ticks up and
 * back down, standing in for a background diagnostic process. */
export function MiniBar({ style, fill }: { style?: CSSProperties; fill: number }) {
  return (
    <span
      className="mirror-mini-bar"
      aria-hidden="true"
      style={{ ...style, '--fill': `${fill}%` } as CSSProperties}
    />
  )
}
