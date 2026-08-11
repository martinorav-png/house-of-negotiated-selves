import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Renderer, Program, Mesh, Triangle, Texture, type OGLRenderingContext } from 'ogl'
import { gsap } from 'gsap'
import type { AvatarPortrait } from '../lib/avatarPortraits'
import './MorphSlider.css'

type MorphTransition = 'melt' | 'ripple' | 'shear' | 'swirl'

type MorphOptions = {
  transition: MorphTransition
  duration: number
  ease: string
  intensity: number
  scale: number
  aberration: number
  drift: number
  overlayColor: string
  loop: boolean
}

type MorphSliderProps = {
  items: AvatarPortrait[]
  startIndex?: number
  transition?: MorphTransition
  duration?: number
  ease?: string
  intensity?: number
  scale?: number
  aberration?: number
  drift?: number
  autoplay?: boolean
  autoplayDelay?: number
  loop?: boolean
  radius?: number
  overlayColor?: string
  showCaptions?: boolean
  showControls?: boolean
  showIndicators?: boolean
  className?: string
}

const TRANSITIONS: Record<MorphTransition, number> = {
  melt: 0,
  ripple: 1,
  shear: 2,
  swirl: 3,
}

const vertexShader = `
attribute vec2 position;
varying vec2 vUv;

void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const fragmentShader = `
precision highp float;

uniform sampler2D tCurrent;
uniform sampler2D tNext;
uniform vec2 uResolution;
uniform vec2 uCurrentSize;
uniform vec2 uNextSize;
uniform float uProgress;
uniform float uDir;
uniform float uMode;
uniform float uIntensity;
uniform float uScale;
uniform float uAberration;
uniform float uDrift;
uniform float uTime;
uniform float uReduce;
uniform vec2 uPointer;
uniform vec3 uOverlay;

varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

vec2 coverUV(vec2 uv, vec2 resolution, vec2 imageSize) {
  vec2 s = resolution / imageSize;
  float scale = max(s.x, s.y);
  vec2 rendered = imageSize * scale;
  vec2 offset = (rendered - resolution) / (2.0 * rendered);
  vec2 ratio = resolution / rendered;
  return uv * ratio + offset;
}

void main() {
  vec2 uv = vUv;
  vec2 center = uPointer;
  float p = clamp(uProgress, 0.0, 1.0);

  // Settled states render a single clean persona so the end of a morph
  // never "snaps" when progress resets 1 → 0.
  if (p < 0.001) {
    vec2 sIdle = coverUV(uv, uResolution, uCurrentSize);
    vec3 idle = texture2D(tCurrent, sIdle).rgb;
    float vigIdle = smoothstep(1.22, 0.2, length(uv - 0.5));
    idle = mix(idle, uOverlay, (1.0 - vigIdle) * 0.24);
    gl_FragColor = vec4(idle, 1.0);
    return;
  }
  if (p > 0.999) {
    vec2 sDone = coverUV(uv, uResolution, uNextSize);
    vec3 done = texture2D(tNext, sDone).rgb;
    float vigDone = smoothstep(1.22, 0.2, length(uv - 0.5));
    done = mix(done, uOverlay, (1.0 - vigDone) * 0.24);
    gl_FragColor = vec4(done, 1.0);
    return;
  }

  float env = sin(p * 3.14159265);
  float reduce = step(0.5, uReduce);

  vec2 uvC = uv;
  vec2 uvN = uv;
  // Crossfade by progress — keep both faces readable instead of a hard
  // spatial wipe that stacks two heads mid-transition.
  float m = smoothstep(0.08, 0.92, p);

  if (reduce < 0.5) {
    float n = noise(uv * uScale + uTime * uDrift);
    vec2 dir = normalize(uv - center + 0.0001);
    // Distortion only in the middle of the morph; zero at both ends.
    float warp = env * uIntensity;

    if (uMode < 0.5) {
      float melt = (n - 0.5) * warp * 0.1;
      uvC.y += melt - (p - 0.5) * 0.02 * uDir * env;
      uvN.y -= melt + (0.5 - p) * 0.02 * uDir * env;
    } else if (uMode < 1.5) {
      float d = distance(uv, center);
      float wave = smoothstep(p - 0.2, p, d) - smoothstep(p, p + 0.2, d);
      uvC -= dir * wave * warp * 0.05;
      uvN += dir * wave * warp * 0.05;
    } else if (uMode < 2.5) {
      float shear = (uv.y - 0.5) * warp * 0.1 * uDir;
      uvC.x += shear;
      uvN.x -= shear;
    } else {
      vec2 d = uv - center;
      float a = warp * 0.55;
      float c = cos(a);
      float s = sin(a);
      mat2 r = mat2(c, -s, s, c);
      mat2 rt = mat2(c, s, -s, c);
      uvC = center + r * d;
      uvN = center + rt * d;
    }
  }

  vec2 sC = coverUV(uvC, uResolution, uCurrentSize);
  vec2 sN = coverUV(uvN, uResolution, uNextSize);

  float ca = uReduce < 0.5 ? uAberration * env * 0.015 : 0.0;
  vec3 colC = vec3(
    texture2D(tCurrent, sC + vec2(ca, 0.0)).r,
    texture2D(tCurrent, sC).g,
    texture2D(tCurrent, sC - vec2(ca, 0.0)).b
  );
  vec3 colN = vec3(
    texture2D(tNext, sN + vec2(ca, 0.0)).r,
    texture2D(tNext, sN).g,
    texture2D(tNext, sN - vec2(ca, 0.0)).b
  );

  vec3 col = mix(colC, colN, clamp(m, 0.0, 1.0));
  float vig = smoothstep(1.22, 0.2, length(uv - 0.5));
  col = mix(col, uOverlay, (1.0 - vig) * 0.24);

  gl_FragColor = vec4(col, 1.0);
}
`

function makeFallbackTexture(gl: OGLRenderingContext) {
  const size = 4
  const data = new Uint8Array(size * size * 4)
  for (let i = 0; i < size * size; i += 1) {
    data[i * 4] = 14
    data[i * 4 + 1] = 18
    data[i * 4 + 2] = 16
    data[i * 4 + 3] = 255
  }
  return new Texture(gl, {
    image: data,
    width: size,
    height: size,
    generateMipmaps: false,
  } as ConstructorParameters<typeof Texture>[1])
}

function hexToRgb(hex: string): [number, number, number] {
  let value = hex.replace('#', '')
  if (value.length === 3) {
    value = value
      .split('')
      .map((part) => part + part)
      .join('')
  }
  const numeric = Number.parseInt(value, 16)
  return [
    ((numeric >> 16) & 255) / 255,
    ((numeric >> 8) & 255) / 255,
    (numeric & 255) / 255,
  ]
}

class MorphEngine {
  private container: HTMLDivElement
  private items: AvatarPortrait[]
  private getOptions: () => MorphOptions
  private onIndexChange: (index: number) => void
  private reducedMotion: boolean
  private current: number
  private shownIndex: number
  private animating = false
  private dragging = false
  private renderer: Renderer
  private gl: OGLRenderingContext
  private canvas: HTMLCanvasElement
  private geometry: Triangle
  private program: Program
  private mesh: Mesh
  private textures: Texture[]
  private sizes: [number, number][]
  private resizeObserver: ResizeObserver
  private raf = 0
  private tween: gsap.core.Tween | null = null
  private boundLoop: (time: number) => void
  private boundContextLost: (event: Event) => void

  constructor({
    container,
    items,
    startIndex,
    reducedMotion,
    getOptions,
    onIndexChange,
  }: {
    container: HTMLDivElement
    items: AvatarPortrait[]
    startIndex: number
    reducedMotion: boolean
    getOptions: () => MorphOptions
    onIndexChange: (index: number) => void
  }) {
    this.container = container
    this.items = items
    this.getOptions = getOptions
    this.onIndexChange = onIndexChange
    this.reducedMotion = reducedMotion
    this.current = startIndex
    this.shownIndex = startIndex

    this.renderer = new Renderer({
      alpha: false,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      // Keep GLSL ES 1.00 shaders (texture2D / gl_FragColor) on a WebGL1 context.
      webgl: 1,
    })
    this.gl = this.renderer.gl
    this.gl.clearColor(0.04, 0.055, 0.05, 1)

    this.canvas = this.gl.canvas as HTMLCanvasElement
    this.canvas.className = 'morph-slider-canvas'
    container.appendChild(this.canvas)

    this.geometry = new Triangle(this.gl)
    this.textures = this.items.map(() => makeFallbackTexture(this.gl))
    this.sizes = this.items.map(() => [1, 1])

    const options = this.getOptions()
    this.program = new Program(this.gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        tCurrent: { value: this.textures[this.current] },
        tNext: { value: this.textures[this.current] },
        uResolution: { value: [1, 1] },
        uCurrentSize: { value: this.sizes[this.current] },
        uNextSize: { value: this.sizes[this.current] },
        uProgress: { value: 0 },
        uDir: { value: 1 },
        uMode: { value: TRANSITIONS[options.transition] },
        uIntensity: { value: options.intensity },
        uScale: { value: options.scale },
        uAberration: { value: options.aberration },
        uDrift: { value: options.drift },
        uTime: { value: 0 },
        uReduce: { value: reducedMotion ? 1 : 0 },
        uPointer: { value: [0.5, 0.5] },
        uOverlay: { value: hexToRgb(options.overlayColor) },
      },
    })
    this.mesh = new Mesh(this.gl, { geometry: this.geometry, program: this.program })

    this.boundContextLost = this.onContextLost.bind(this)
    this.canvas.addEventListener('webglcontextlost', this.boundContextLost, false)

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    this.resize()
    this.loadTextures()

    this.boundLoop = this.loop.bind(this)
    this.raf = requestAnimationFrame(this.boundLoop)
  }

  private loadTextures() {
    this.items.forEach((item, index) => {
      const image = new Image()
      image.decoding = 'async'
      image.onload = () => {
        const texture = new Texture(this.gl, {
          image,
          generateMipmaps: false,
          minFilter: this.gl.LINEAR,
          magFilter: this.gl.LINEAR,
          flipY: true,
        })
        texture.needsUpdate = true
        const previous = this.textures[index]
        this.textures[index] = texture
        this.sizes[index] = [image.naturalWidth || 1, image.naturalHeight || 1]

        // Keep live sampler uniforms pointing at the latest GPU texture for
        // this slot — otherwise idle/cancelled morphs can keep a deleted
        // fallback bound as tNext and flash between images.
        if (this.program.uniforms.tCurrent.value === previous) {
          this.program.uniforms.tCurrent.value = texture
          this.program.uniforms.uCurrentSize.value = this.sizes[index]
        }
        if (this.program.uniforms.tNext.value === previous) {
          this.program.uniforms.tNext.value = texture
          this.program.uniforms.uNextSize.value = this.sizes[index]
        }
        if (index === this.current && !this.animating && !this.dragging) {
          this.bindIdleTextures()
        }
        if (previous?.texture && previous !== texture) {
          this.gl.deleteTexture(previous.texture)
        }
      }
      image.onerror = () => {
        console.warn(`[MorphSlider] failed to load persona image: ${item.image}`)
      }
      image.src = item.image
    })
  }

  private bindIdleTextures() {
    const texture = this.textures[this.current]
    const size = this.sizes[this.current]
    this.program.uniforms.tCurrent.value = texture
    this.program.uniforms.uCurrentSize.value = size
    this.program.uniforms.tNext.value = texture
    this.program.uniforms.uNextSize.value = size
    this.program.uniforms.uProgress.value = 0
  }

  private resize() {
    const rect = this.container.getBoundingClientRect()
    const width = Math.max(rect.width, 1)
    const height = Math.max(rect.height, 1)
    this.renderer.setSize(width, height)
    this.program.uniforms.uResolution.value = [this.gl.canvas.width, this.gl.canvas.height]
  }

  private syncOptions() {
    const options = this.getOptions()
    this.program.uniforms.uMode.value = TRANSITIONS[options.transition]
    this.program.uniforms.uIntensity.value = options.intensity
    this.program.uniforms.uScale.value = options.scale
    this.program.uniforms.uAberration.value = options.aberration
    this.program.uniforms.uDrift.value = options.drift
    this.program.uniforms.uOverlay.value = hexToRgb(options.overlayColor)
  }

  private loop(time: number) {
    if (!this.program.uniformLocations) return
    this.program.uniforms.uTime.value = time * 0.001
    if (!this.dragging && !this.animating) {
      this.syncOptions()
      // Belt-and-suspenders: never leave a half-finished mix on screen.
      if ((this.program.uniforms.uProgress.value as number) !== 0) {
        this.bindIdleTextures()
      }
    }
    this.renderer.render({ scene: this.mesh })
    this.raf = requestAnimationFrame(this.boundLoop)
  }

  private wrap(index: number) {
    const count = this.items.length
    return ((index % count) + count) % count
  }

  private prepareNext(direction: number) {
    const target = this.wrap(this.current + direction)
    this.program.uniforms.tCurrent.value = this.textures[this.current]
    this.program.uniforms.uCurrentSize.value = this.sizes[this.current]
    this.program.uniforms.tNext.value = this.textures[target]
    this.program.uniforms.uNextSize.value = this.sizes[target]
    this.program.uniforms.uDir.value = direction
    return target
  }

  goTo(direction: number) {
    if (this.animating || this.dragging || this.items.length < 2) return
    const options = this.getOptions()
    if (!options.loop) {
      const rawTarget = this.current + direction
      if (rawTarget < 0 || rawTarget > this.items.length - 1) return
    }
    this.syncOptions()
    const target = this.prepareNext(direction)
    this.animating = true
    const duration = this.reducedMotion ? Math.min(options.duration, 0.35) : options.duration
    this.tween?.kill()
    this.tween = gsap.fromTo(
      this.program.uniforms.uProgress,
      { value: 0 },
      {
        value: 1,
        duration,
        ease: options.ease,
        onComplete: () => this.commit(target),
      },
    )
  }

  goToIndex(index: number) {
    if (this.animating || this.dragging || this.items.length < 2) return
    const target = this.wrap(index)
    if (target === this.current) return
    const options = this.getOptions()
    this.syncOptions()
    this.program.uniforms.tCurrent.value = this.textures[this.current]
    this.program.uniforms.uCurrentSize.value = this.sizes[this.current]
    this.program.uniforms.tNext.value = this.textures[target]
    this.program.uniforms.uNextSize.value = this.sizes[target]
    const forwardSteps = this.wrap(target - this.current)
    const backwardSteps = this.wrap(this.current - target)
    this.program.uniforms.uDir.value = forwardSteps <= backwardSteps ? 1 : -1
    this.animating = true
    const duration = this.reducedMotion ? Math.min(options.duration, 0.35) : options.duration
    this.tween?.kill()
    this.tween = gsap.fromTo(
      this.program.uniforms.uProgress,
      { value: 0 },
      {
        value: 1,
        duration,
        ease: options.ease,
        onComplete: () => this.commit(target),
      },
    )
  }

  next() {
    this.goTo(1)
  }

  prev() {
    this.goTo(-1)
  }

  setPointer(x: number, y: number) {
    this.program.uniforms.uPointer.value = [x, y]
  }

  beginDrag() {
    // Drag-scrub morphs made the portraits ghost/snap; keep morphs on
    // explicit Prev/Next/dot toggles only.
    return false
  }

  drag(_normalizedDeltaX: number) {}

  endDrag() {}

  private announce(index: number) {
    if (index === this.shownIndex) return
    this.shownIndex = index
    this.onIndexChange(index)
  }

  private commit(target: number) {
    // Kill the tween first so GSAP cannot write progress=1 after we settle.
    this.tween?.kill()
    this.tween = null
    // Bind the destination as both samplers while progress is still ~1
    // (clean tNext view), then drop to 0 — identical pixels, no snap.
    this.current = target
    const texture = this.textures[target]
    const size = this.sizes[target]
    this.program.uniforms.tCurrent.value = texture
    this.program.uniforms.uCurrentSize.value = size
    this.program.uniforms.tNext.value = texture
    this.program.uniforms.uNextSize.value = size
    this.program.uniforms.uProgress.value = 0
    this.animating = false
    this.announce(target)
  }

  private onContextLost(event: Event) {
    event.preventDefault()
    cancelAnimationFrame(this.raf)
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    this.tween?.kill()
    this.resizeObserver.disconnect()
    this.canvas.removeEventListener('webglcontextlost', this.boundContextLost)
    this.textures.forEach((texture) => {
      if (texture.texture) this.gl.deleteTexture(texture.texture)
    })
    if (this.program.program) this.gl.deleteProgram(this.program.program)
    this.canvas.remove()
  }
}

export function MorphSlider({
  items,
  startIndex = 0,
  transition = 'melt',
  duration = 1.1,
  ease = 'power2.inOut',
  intensity = 0.45,
  scale = 2.25,
  aberration = 0,
  drift = 0.25,
  autoplay = false,
  autoplayDelay = 4.5,
  loop = true,
  radius = 18,
  overlayColor = '#0b100d',
  showCaptions = true,
  showControls = true,
  showIndicators = true,
  className = '',
}: MorphSliderProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const engineRef = useRef<MorphEngine | null>(null)
  const [index, setIndex] = useState(startIndex)
  const [hovering, setHovering] = useState(false)
  const optionsRef = useRef<MorphOptions>({
    transition,
    duration,
    ease,
    intensity,
    scale,
    aberration,
    drift,
    overlayColor,
    loop,
  })

  optionsRef.current = {
    transition,
    duration,
    ease,
    intensity,
    scale,
    aberration,
    drift,
    overlayColor,
    loop,
  }

  useEffect(() => {
    if (!containerRef.current) return undefined
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const engine = new MorphEngine({
      container: containerRef.current,
      items,
      startIndex,
      reducedMotion,
      getOptions: () => optionsRef.current,
      onIndexChange: setIndex,
    })
    engineRef.current = engine
    setIndex(startIndex)
    return () => {
      engine.destroy()
      engineRef.current = null
    }
  }, [items, startIndex])

  const handleNext = useCallback(() => engineRef.current?.next(), [])
  const handlePrev = useCallback(() => engineRef.current?.prev(), [])

  useEffect(() => {
    if (!autoplay || hovering) return undefined
    const id = window.setTimeout(
      () => engineRef.current?.next(),
      Math.max(autoplayDelay, 1) * 1000,
    )
    return () => window.clearTimeout(id)
  }, [autoplay, autoplayDelay, hovering, index])

  useEffect(() => {
    const element = containerRef.current
    if (!element) return undefined
    let startX = 0
    let width = 1
    let active = false

    const onDown = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect()
      width = rect.width || 1
      startX = event.clientX
      engineRef.current?.setPointer(
        (event.clientX - rect.left) / rect.width,
        1 - (event.clientY - rect.top) / rect.height,
      )
      active = engineRef.current?.beginDrag() ?? false
      if (active) element.setPointerCapture(event.pointerId)
    }
    const onMove = (event: PointerEvent) => {
      if (!active) return
      engineRef.current?.drag((event.clientX - startX) / width)
    }
    const onUp = () => {
      if (!active) return
      active = false
      engineRef.current?.endDrag()
    }

    element.addEventListener('pointerdown', onDown)
    element.addEventListener('pointermove', onMove)
    element.addEventListener('pointerup', onUp)
    element.addEventListener('pointercancel', onUp)

    return () => {
      element.removeEventListener('pointerdown', onDown)
      element.removeEventListener('pointermove', onMove)
      element.removeEventListener('pointerup', onUp)
      element.removeEventListener('pointercancel', onUp)
    }
  }, [])

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        handleNext()
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        handlePrev()
      }
    },
    [handleNext, handlePrev],
  )

  const style = {
    borderRadius: `${radius}px`,
    '--ms-swap': `${(duration * 0.66).toFixed(3)}s`,
    '--ms-dot': `${(duration * 0.45).toFixed(3)}s`,
  } as CSSProperties

  return (
    <div
      className={`morph-slider ${className}`.trim()}
      style={style}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div
        ref={containerRef}
        className="morph-slider-stage"
        role="group"
        aria-roledescription="carousel"
        aria-label="Avatar portrait slider"
        tabIndex={0}
        onKeyDown={onKeyDown}
      />

      {showCaptions && (
        <div className="morph-slider-caption" aria-live="polite">
          {items.map((item, itemIndex) => (
            <span
              key={item.image}
              aria-hidden={itemIndex === index ? undefined : true}
              className={`morph-slider-caption-text ${itemIndex === index ? 'is-active' : ''}`}
            >
              {item.caption}
            </span>
          ))}
        </div>
      )}

      {showControls && (
        <div className="morph-slider-controls">
          <button
            type="button"
            className="morph-slider-btn"
            aria-label="Previous portrait"
            onClick={handlePrev}
          >
            Prev
          </button>
          <button
            type="button"
            className="morph-slider-btn"
            aria-label="Next portrait"
            onClick={handleNext}
          >
            Next
          </button>
        </div>
      )}

      {showIndicators && (
        <div className="morph-slider-indicators" role="tablist" aria-label="Portraits">
          {items.map((item, itemIndex) => (
            <button
              key={item.image}
              type="button"
              role="tab"
              aria-selected={itemIndex === index}
              aria-label={`Show ${item.caption}`}
              className={`morph-slider-dot ${itemIndex === index ? 'is-active' : ''}`}
              onClick={() => {
                if (itemIndex === index) return
                engineRef.current?.goToIndex(itemIndex)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
