/**
 * Renders text as two layers, not one uniformly-degraded one:
 *  1. A crisp, fully legible base pass.
 *  2. A separate translucent "smudge" layer — the same glyphs, blurred,
 *     masked by soft organic blobs so it covers some parts of the letters
 *     more than others (like a webbed/wet film), rather than an even haze
 *     over the whole thing.
 * Each layer gets its own grain + color pass before compositing, so the
 * crisp text and its smudge can be tinted independently.
 *
 * Performance notes:
 *  - Glyph layers are cached until text/style inputs change; only the cheap
 *    smudge mask + composite re-runs for drift animation.
 *  - Blur runs at half resolution then upscales (visually soft smudge, far
 *    fewer pixels).
 *  - Grain walks pixels with a stride and a cheap LCG instead of Math.random.
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
  /**
   * Elapsed seconds — when given (with smudgeDriftPeriod), the blob mask
   * drifts smoothly over time (each cell continuously interpolates toward
   * its next random value) instead of being fixed or jumping between fully
   * unrelated random states on redraw.
   */
  smudgeDriftTime?: number
  /** Seconds per drift step — larger = slower, calmer drift. */
  smudgeDriftPeriod?: number

  /** Per-pixel speckle amplitude, applied to each layer before compositing. */
  grain?: number

  /** Base grey level 0–255 before per-pixel jitter, before tinting. */
  shade?: number
  shadeVariance?: number
  /** Crisp layer color — 0–1 RGB, multiplied onto the shade value. */
  color?: [number, number, number]
  /** Smudge layer color — independent of the crisp layer's `color`. */
  smudgeColor?: [number, number, number]

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
let scratchSmudgeColored: HTMLCanvasElement | null = null
let scratchMask: HTMLCanvasElement | null = null
let scratchMaskSmall: HTMLCanvasElement | null = null
let scratchBlurA: HTMLCanvasElement | null = null
let scratchBlurB: HTMLCanvasElement | null = null
let scratchBlurSrc: HTMLCanvasElement | null = null
let scratchBlurUp: HTMLCanvasElement | null = null

/** Cached glyph layers — rebuilt only when static style/text changes. */
let cacheKey = ''
let cacheBase: HTMLCanvasElement | null = null
let cacheBlurredSmudge: HTMLCanvasElement | null = null

function sized(ref: HTMLCanvasElement | null, w: number, h: number): HTMLCanvasElement {
  const c = ref ?? document.createElement('canvas')
  if (c.width !== w) c.width = w
  if (c.height !== h) c.height = h
  return c
}

function copyCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = source.width
  c.height = source.height
  c.getContext('2d')!.drawImage(source, 0, 0)
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
  taps = 5,
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

/**
 * Soft smudge blur at half resolution — same look, ~4× fewer pixels.
 */
function blurTo(source: HTMLCanvasElement, w: number, h: number, radius: number) {
  if (radius <= 0) return source
  const scale = radius >= 4 ? 0.5 : 1
  const bw = Math.max(1, Math.round(w * scale))
  const bh = Math.max(1, Math.round(h * scale))
  const br = radius * scale

  scratchBlurSrc = sized(scratchBlurSrc, bw, bh)
  const sctx = scratchBlurSrc.getContext('2d')!
  sctx.clearRect(0, 0, bw, bh)
  sctx.imageSmoothingEnabled = true
  sctx.drawImage(source, 0, 0, bw, bh)

  scratchBlurA = sized(scratchBlurA, bw, bh)
  scratchBlurB = sized(scratchBlurB, bw, bh)
  boxBlurAxis(scratchBlurA.getContext('2d')!, scratchBlurSrc, bw, bh, br, 'x')
  boxBlurAxis(scratchBlurB.getContext('2d')!, scratchBlurA, bw, bh, br, 'y')

  if (scale === 1) return scratchBlurB

  const up = sized(scratchBlurUp, w, h)
  scratchBlurUp = up
  const uctx = up.getContext('2d')!
  uctx.clearRect(0, 0, w, h)
  uctx.imageSmoothingEnabled = true
  uctx.drawImage(scratchBlurB, 0, 0, w, h)
  return up
}

function hash2(x: number, y: number): number {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return s - Math.floor(s)
}

function smootherstep(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

function buildSmudgeMask(
  w: number,
  h: number,
  cellsX: number,
  cellsY: number,
  contrast: number,
  floor: number,
  driftTime: number,
  driftPeriod: number,
) {
  scratchMaskSmall = sized(scratchMaskSmall, cellsX, cellsY)
  const sctx = scratchMaskSmall.getContext('2d')!
  const img = sctx.createImageData(cellsX, cellsY)

  const step = driftPeriod > 0 ? driftTime / driftPeriod : 0
  const stepFloor = Math.floor(step)
  const frac = smootherstep(step - stepFloor)

  let cell = 0
  for (let i = 0; i < img.data.length; i += 4, cell++) {
    const a = hash2(cell * 1.7 + 11.1, stepFloor)
    const b = hash2(cell * 1.7 + 11.1, stepFloor + 1)
    let v = floor + (1 - floor) * (a + (b - a) * frac)
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

/** Grain + color — stride-2 walk with LCG (looks like film grain, ~2× cheaper). */
function applyGrainAndColor(
  layerCtx: CanvasRenderingContext2D,
  w: number,
  h: number,
  shade: number,
  shadeVariance: number,
  grain: number,
  color: [number, number, number],
  seed = 1,
) {
  const img = layerCtx.getImageData(0, 0, w, h)
  const data = img.data
  let rng = (seed * 1664525 + 1013904223) >>> 0
  const next = () => {
    rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0
    return rng / 4294967296
  }

  for (let y = 0; y < h; y += 1) {
    const row = y * w
    // Checkerboard-ish stride: still dense enough for fine grain.
    for (let x = y & 1; x < w; x += 2) {
      const i = (row + x) * 4
      const a = data[i + 3]
      if (a < 3) continue
      const g = Math.min(255, Math.max(0, shade + (next() - 0.5) * shadeVariance))
      const r = g * color[0]
      const gv = g * color[1]
      const b = g * color[2]
      data[i] = r
      data[i + 1] = gv
      data[i + 2] = b
      if (grain > 0) {
        data[i + 3] = Math.min(255, Math.max(0, a + (next() - 0.5) * grain))
      }
      // Fill neighbor for continuous coverage.
      if (x + 1 < w) {
        const j = i + 4
        if (data[j + 3] >= 3) {
          data[j] = r
          data[j + 1] = gv
          data[j + 2] = b
          if (grain > 0) {
            data[j + 3] = Math.min(255, Math.max(0, data[j + 3] + (next() - 0.5) * grain * 0.7))
          }
        }
      }
    }
  }
  layerCtx.putImageData(img, 0, 0)
}

function styleKey(
  text: string,
  opts: Required<
    Pick<
      GrainyTextOptions,
      | 'fontPx'
      | 'weight'
      | 'fontFamily'
      | 'smudgeWeight'
      | 'smudgeBlurPx'
      | 'smudgeBoost'
      | 'shade'
      | 'shadeVariance'
      | 'grain'
    >
  > & {
    color: [number, number, number]
    smudgeColor: [number, number, number]
    maxWidthPx?: number
  },
) {
  return [
    text,
    opts.fontPx,
    opts.weight,
    opts.fontFamily,
    opts.smudgeWeight,
    opts.smudgeBlurPx,
    opts.smudgeBoost,
    opts.shade,
    opts.shadeVariance,
    opts.grain,
    opts.color.join(','),
    opts.smudgeColor.join(','),
    opts.maxWidthPx ?? 0,
  ].join('|')
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
    smudgeDriftTime = 0,
    smudgeDriftPeriod = 0,
    grain = 30,
    shade = 232,
    shadeVariance = 40,
    color = [1, 1, 1],
    smudgeColor = color,
    edgeFade = 0,
    verticalFade = 0,
  } = opts

  const w = canvas.width
  const h = canvas.height
  const key = styleKey(text, {
    fontPx: opts.fontPx,
    weight,
    fontFamily,
    smudgeWeight,
    smudgeBlurPx,
    smudgeBoost,
    shade,
    shadeVariance,
    grain,
    color,
    smudgeColor,
    maxWidthPx,
  })

  if (key !== cacheKey || !cacheBase || !cacheBlurredSmudge) {
    // 1. Crisp base glyph pass, then its own grain + color.
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
    applyGrainAndColor(bctx, w, h, shade, shadeVariance, grain * 0.6, color, 17)

    // 2. Smudge source → half-res blur → boost stack (no mask yet).
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
    const boost = Math.max(1, smudgeBoost)
    for (let p = 0; p < boost; p++) {
      smctx.drawImage(blurred, 0, 0)
      smctx.globalCompositeOperation = 'lighter'
    }
    smctx.globalCompositeOperation = 'source-over'
    applyGrainAndColor(smctx, w, h, shade, shadeVariance, grain, smudgeColor, 91)

    cacheBase = copyCanvas(base)
    cacheBlurredSmudge = copyCanvas(smudge)
    cacheKey = key
  }

  // 3. Mask the cached smudge for this drift frame, then composite.
  scratchSmudgeColored = sized(scratchSmudgeColored, w, h)
  const mctx = scratchSmudgeColored.getContext('2d')!
  mctx.clearRect(0, 0, w, h)
  mctx.drawImage(cacheBlurredSmudge, 0, 0)
  const mask = buildSmudgeMask(
    w,
    h,
    smudgeCellsX,
    smudgeCellsY,
    smudgeContrast,
    smudgeFloor,
    smudgeDriftTime,
    smudgeDriftPeriod,
  )
  mctx.globalCompositeOperation = 'destination-in'
  mctx.drawImage(mask, 0, 0)
  mctx.globalCompositeOperation = 'source-over'

  ctx.clearRect(0, 0, w, h)
  ctx.globalAlpha = crispAlpha
  ctx.drawImage(cacheBase, 0, 0)
  ctx.globalAlpha = smudgeAlpha
  ctx.drawImage(scratchSmudgeColored, 0, 0)
  ctx.globalAlpha = 1

  // 4. Edge dissolve overlays.
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


