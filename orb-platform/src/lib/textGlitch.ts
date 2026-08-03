/**
 * Canvas text glitch — RGB split, slice tears, brief jitter.
 * Pass `amount` 0–1; keep mostly low so it stays readable.
 */

export type GlitchState = {
  /** 0–1 intensity this frame */
  amount: number
  /** horizontal tear offset in px */
  tear: number
  /** which horizontal band tears (0–1 of height) */
  tearY: number
  tearH: number
}

/** Advance intermittent glitch envelopes — call once per frame. */
export function tickGlitch(
  state: { nextAt: number; holdUntil: number; seed: number },
  time: number,
  audioBoost = 0,
): GlitchState {
  // Schedule sparse bursts
  if (time >= state.nextAt) {
    state.holdUntil = time + 0.06 + Math.random() * 0.14
    state.seed = Math.random()
    state.nextAt = time + 1.8 + Math.random() * 3.5
  }

  const inBurst = time < state.holdUntil
  const burstAge = inBurst ? 1 - (state.holdUntil - time) / 0.2 : 0
  let amount = inBurst ? 0.35 + burstAge * 0.55 + state.seed * 0.25 : 0
  amount = Math.min(1, amount + audioBoost * 0.35)

  // Tiny idle noise so it never feels perfectly clean
  amount = Math.max(amount, Math.random() < 0.02 ? 0.2 : 0)

  const tear = inBurst ? (state.seed - 0.5) * 28 * amount : 0
  const tearY = 0.35 + state.seed * 0.3
  const tearH = 0.08 + state.seed * 0.12

  return { amount, tear, tearY, tearH }
}

/**
 * Draw centered text with chromatic split + optional slice displacement.
 */
export function drawGlitchedText(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  text: string,
  opts: {
    opacity: number
    color: string
    font: string
    glitch: GlitchState
    clear?: string | null
  },
) {
  const w = canvas.width
  const h = canvas.height
  const { opacity, color, font, glitch } = opts

  if (opts.clear !== undefined) {
    if (opts.clear) {
      ctx.fillStyle = opts.clear
      ctx.fillRect(0, 0, w, h)
    } else {
      ctx.clearRect(0, 0, w, h)
    }
  }

  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  const cx = w / 2 + (Math.random() - 0.5) * glitch.amount * 6
  const cy = h / 2 + (Math.random() - 0.5) * glitch.amount * 3
  const split = glitch.amount * (6 + Math.random() * 10)

  // RGB channel ghosts (additive feel via separate passes)
  if (glitch.amount > 0.08) {
    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = `rgba(255, 60, 80, ${opacity * 0.45 * glitch.amount})`
    ctx.fillText(text, cx - split, cy)
    ctx.fillStyle = `rgba(60, 220, 255, ${opacity * 0.45 * glitch.amount})`
    ctx.fillText(text, cx + split, cy)
    ctx.globalCompositeOperation = 'source-over'
  }

  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)'
  ctx.shadowBlur = 12
  ctx.shadowOffsetY = 2
  ctx.fillStyle = color
  ctx.fillText(text, cx, cy)
  ctx.shadowBlur = 0

  // Horizontal slice tear — copy a band and shift it
  if (glitch.amount > 0.2 && Math.abs(glitch.tear) > 0.5) {
    const sy = Math.floor(h * glitch.tearY)
    const sh = Math.max(2, Math.floor(h * glitch.tearH))
    try {
      const slice = ctx.getImageData(0, sy, w, sh)
      ctx.putImageData(slice, Math.round(glitch.tear), sy)
      // occasional duplicate ghost
      if (glitch.amount > 0.55) {
        ctx.globalAlpha = 0.35
        ctx.putImageData(slice, Math.round(-glitch.tear * 0.6), sy + 2)
        ctx.globalAlpha = 1
      }
    } catch {
      // ignore security / size edge cases
    }
  }

  // Block corruption bars
  if (glitch.amount > 0.45 && Math.random() > 0.4) {
    const bars = 1 + Math.floor(Math.random() * 3)
    for (let i = 0; i < bars; i++) {
      const by = Math.random() * h
      const bh = 2 + Math.random() * 6
      ctx.fillStyle = `rgba(180, 230, 255, ${0.08 + glitch.amount * 0.15})`
      ctx.fillRect(0, by, w, bh)
    }
  }
}
