/**
 * Renders text as two layers, not one uniformly-degraded one:
 *  1. A crisp, fully legible base pass.
 *  2. A separate translucent "smudge" layer — the same glyphs, blurred,
 *     masked by soft organic blobs so it covers some parts of the letters
 *     more than others (like a webbed/wet film), rather than an even haze
 *     over the whole thing.
 * Fine per-pixel grain sits on top of both. Monochrome — `shade`/`tint`
 * control how bright/warm the grey reads.
 */
export type GrainyTextOptions = {
  fontPx: number
  weight?: number
  fontFamily?: string
  /** Shrinks fontPx to fit if the text would exceed this width. */
  maxWidthPx?: number

  /** Opacity of the crisp, clearly-legible base layer. */
  crispAlpha?: number
  /** How strongly the smudge layer reads where its mask is strongest. */
  smudgeAlpha?: number
  /** Blur radius for the smudge layer — the "wet" softness. */
  smudgeBlurPx?: number
  /**
   * Font weight used to build the smudge's own source text — independent
   * of `weight`. Blur dilutes ink; a thin source over-blurs into near
   * nothing, so the smudge needs its own heavy/bold source to survive a
   * big blur radius and still read as dense. Defaults heavier than `weight`.
   */
  smudgeWeight?: number
  /**
   * Additive draw passes that re-stack the blurred smudge's alpha back up
   * (blur redistributes ink, it doesn't add more) — the practical way to
   * keep the smudge dense/opaque even at a large blur radius.
   */
  smudgeBoost?: number
  /** Blob size of the smudge mask, in grid cells across the canvas width. */
  smudgeCellsX?: number
  smudgeCellsY?: number
  /** Punches the smudge mask's contrast — higher = more on/off patches. */
  smudgeContrast?: number
  /**
   * Minimum smudge coverage 0–1 — keeps the smudge dominant everywhere
   * (a permanent thick bleed around every letter) with the blob mask only
   * adding extra intensity on top, rather than being the sole on/off gate.
   */
  smudgeFloor?: number

  /** Fine per-pixel speckle over the combined result. */
  grain?: number

  /** Base grey level 0–255 before per-pixel jitter. */
  shade?: number
  shadeVariance?: number
  /** Per-channel multiplier on the shade — dial toward warm/cool or dimmer. */
  tint?: [number, number, number]

  /**
   * Gradient overlay that fades the text's own edges toward transparent —
   * 0 = no fade (flat), 1 = fully transparent at the L/R edges. Reads as
   * the text emerging from / dissolving back into the wall.
   */
  edgeFade?: number
  /** Vertical companion to edgeFade — fades the top and bottom edges. */
  verticalFade?: number
}

let scratchBase: HTMLCanvasElement | null = null
let scratchSmudgeSource: HTMLCanvasElement | null = null
let scratchSmudge: HTMLCanvasElement | null = null
let scratchMask: HTMLCanvasElement | null = null
let scratchMaskSmall: HTMLCanvasElement | null = null
let scratchBlurA: HTMLCanvasElement | null = null
let scratchBlurB: HTMLCanvasElement | null = null

function sized(ref: HTMLCanvasElement | null, w: number, h: number): HTMLCanvasElement {
  const c = ref ?? document.createElement('canvas')
  if (c.width !== w) c.width = w
  if (c.height !== h) c.height = h
  return c
}

/**
 * Separable box blur built only from drawImage + globalAlpha/composite —
 * deliberately avoids `ctx.filter = 'blur()'`, whose Canvas2D support is
 * inconsistent across browsers (notably unreliable in Safari, where it can
 * silently no-op and leave text looking like a flat, unblurred overlay).
 */
function boxBlurAxis(
  destCtx: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  w: number,
  h: number,
  radius: number,
  axis: 'x' | 'y',
  taps = 7,
) {
  destCtx.clearRect(0, 0, w, h)
  destCtx.globalCompositeOperation = 'source-over'
  for (let i = 0; i < taps; i++) {
    const t = taps === 1 ? 0 : (i / (taps - 1)) * 2 - 1
    const offset = t * radius
    destCtx.globalAlpha = 1 / taps
    destCtx.drawImage(source, axis === 'x' ? offset : 0, axis === 'y' ? offset : 0)
    destCtx.globalCompositeOperation = 'lighter'
  }
  destCtx.globalCompositeOperation = 'source-over'
  destCtx.globalAlpha = 1
}

function blurTo(source: HTMLCanvasElement, w: number, h: number, radius: number) {
  if (radius <= 0) return source
  scratchBlurA = sized(scratchBlurA, w, h)
  scratchBlurB = sized(scratchBlurB, w, h)
  boxBlurAxis(scratchBlurA.getContext('2d')!, source, w, h, radius, 'x')
  boxBlurAxis(scratchBlurB.getContext('2d')!, scratchBlurA, w, h, radius, 'y')
  return scratchBlurB
}

/**
 * Cheap organic blob mask — random low-res noise, smoothed by GPU upscale.
 * `destination-in` (used to apply this mask) only reads the ALPHA channel,
 * so the noise is written into alpha, not RGB — an earlier version wrote it
 * into RGB with alpha pinned at 255, which made the mask a total no-op.
 */
function buildSmudgeMask(
  w: number,
  h: number,
  cellsX: number,
  cellsY: number,
  contrast: number,
  floor: number,
) {
  scratchMaskSmall = sized(scratchMaskSmall, cellsX, cellsY)
  const sctx = scratchMaskSmall.getContext('2d')!
  const img = sctx.createImageData(cellsX, cellsY)
  for (let i = 0; i < img.data.length; i += 4) {
    let v = floor + (1 - floor) * Math.random()
    // Push the 0..1 noise through a contrast curve around its midpoint so
    // blobs read as more clearly on/off rather than a smooth grey wash.
    v = Math.min(1, Math.max(0, (v - 0.5) * (contrast / 100) + 0.5))
    img.data[i] = 255
    img.data[i + 1] = 255
    img.data[i + 2] = 255
    img.data[i + 3] = v * 255
  }
  sctx.putImageData(img, 0, 0)

  scratchMask = sized(scratchMask, w, h)
  const mctx = scratchMask.getContext('2d')!
  mctx.clearRect(0, 0, w, h)
  mctx.imageSmoothingEnabled = true
  mctx.drawImage(scratchMaskSmall, 0, 0, w, h)
  return scratchMask
}

export function drawGrainyText(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  text: string,
  opts: GrainyTextOptions,
) {
  const {
    weight = 300,
    fontFamily = '"Helvetica Neue", Arial, sans-serif',
    maxWidthPx,
    crispAlpha = 0.85,
    smudgeAlpha = 0.65,
    smudgeBlurPx = 3.5,
    smudgeWeight = Math.min(900, weight + 300),
    smudgeBoost = 3,
    smudgeCellsX = 10,
    smudgeCellsY = 5,
    smudgeContrast = 220,
    smudgeFloor = 0.5,
    grain = 30,
    shade = 232,
    shadeVariance = 40,
    tint = [1, 1, 1],
    edgeFade = 0,
    verticalFade = 0,
  } = opts

  const w = canvas.width
  const h = canvas.height

  // 1. Crisp base glyph pass.
  const base = sized(scratchBase, w, h)
  scratchBase = base
  const bctx = base.getContext('2d')!
  bctx.clearRect(0, 0, w, h)
  bctx.textAlign = 'center'
  bctx.textBaseline = 'middle'

  let fontPx = opts.fontPx
  if (maxWidthPx) {
    bctx.font = `${weight} ${fontPx}px ${fontFamily}`
    const measured = bctx.measureText(text).width
    if (measured > maxWidthPx && measured > 0) {
      fontPx = Math.max(10, fontPx * (maxWidthPx / measured))
    }
  }
  bctx.font = `${weight} ${fontPx}px ${fontFamily}`
  bctx.fillStyle = '#ffffff'
  bctx.fillText(text, w / 2, h / 2)

  // 2. Smudge layer — a heavy/bold copy of the same glyphs (blur dilutes
  // ink; a thin source over-blurs into near-nothing), blurred, boosted back
  // up with additive passes, then masked by soft organic blobs so it only
  // reads strongly over part of the letters.
  const smudgeSource = sized(scratchSmudgeSource, w, h)
  scratchSmudgeSource = smudgeSource
  const ssctx = smudgeSource.getContext('2d')!
  ssctx.clearRect(0, 0, w, h)
  ssctx.textAlign = 'center'
  ssctx.textBaseline = 'middle'
  ssctx.font = `${smudgeWeight} ${fontPx}px ${fontFamily}`
  ssctx.fillStyle = '#ffffff'
  ssctx.fillText(text, w / 2, h / 2)

  const blurred = blurTo(smudgeSource, w, h, smudgeBlurPx)
  const smudge = sized(scratchSmudge, w, h)
  scratchSmudge = smudge
  const smctx = smudge.getContext('2d')!
  smctx.clearRect(0, 0, w, h)
  smctx.globalCompositeOperation = 'source-over'
  for (let p = 0; p < Math.max(1, smudgeBoost); p++) {
    smctx.drawImage(blurred, 0, 0)
    smctx.globalCompositeOperation = 'lighter'
  }
  smctx.globalCompositeOperation = 'source-over'

  const mask = buildSmudgeMask(w, h, smudgeCellsX, smudgeCellsY, smudgeContrast, smudgeFloor)
  smctx.globalCompositeOperation = 'destination-in'
  smctx.drawImage(mask, 0, 0)
  smctx.globalCompositeOperation = 'source-over'

  // 3. Composite: crisp layer first (legible), smudge layer on top (uneven,
  // translucent — clear in some places, webbed/wet in others).
  ctx.clearRect(0, 0, w, h)
  ctx.globalAlpha = crispAlpha
  ctx.drawImage(base, 0, 0)
  ctx.globalAlpha = smudgeAlpha
  ctx.drawImage(smudge, 0, 0)
  ctx.globalAlpha = 1

  // 4. Fine grain — jitter per-pixel alpha/value so the combined result
  // reads as a dusty texture rather than a flat fill.
  if (grain > 0) {
    const img = ctx.getImageData(0, 0, w, h)
    const data = img.data
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3]
      if (a < 3) continue
      const g = Math.min(255, Math.max(0, shade + (Math.random() - 0.5) * shadeVariance))
      data[i] = g * tint[0]
      data[i + 1] = g * tint[1]
      data[i + 2] = g * tint[2]
      data[i + 3] = Math.min(255, Math.max(0, a + (Math.random() - 0.5) * grain))
    }
    ctx.putImageData(img, 0, 0)
  } else {
    // Still need the shade/tint applied even with grain off.
    const img = ctx.getImageData(0, 0, w, h)
    const data = img.data
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 3) continue
      data[i] = shade * tint[0]
      data[i + 1] = shade * tint[1]
      data[i + 2] = shade * tint[2]
    }
    ctx.putImageData(img, 0, 0)
  }

  // 5. Gradient overlay — dissolves the text's own edges into transparency
  // so it reads as blending into the wall rather than sitting flat on top.
  if (edgeFade > 0) {
    const grad = ctx.createLinearGradient(0, 0, w, 0)
    const edgeAlpha = 1 - edgeFade
    grad.addColorStop(0, `rgba(255,255,255,${edgeAlpha})`)
    grad.addColorStop(0.5, 'rgba(255,255,255,1)')
    grad.addColorStop(1, `rgba(255,255,255,${edgeAlpha})`)
    ctx.globalCompositeOperation = 'destination-in'
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'
  }
  if (verticalFade > 0) {
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    const edgeAlpha = 1 - verticalFade
    grad.addColorStop(0, `rgba(255,255,255,${edgeAlpha})`)
    grad.addColorStop(0.5, 'rgba(255,255,255,1)')
    grad.addColorStop(1, `rgba(255,255,255,${edgeAlpha})`)
    ctx.globalCompositeOperation = 'destination-in'
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'
  }
}
