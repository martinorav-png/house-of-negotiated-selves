import { Suspense, useMemo } from 'react'
import {
  EffectComposer,
  Bloom,
  Vignette,
  Noise,
  ChromaticAberration,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Vector2 } from 'three'
import { POST } from '../config'

type Props = {
  enabled: boolean
  reducedMotion: boolean
}

/**
 * Soft bloom + slight chromatic aberration + vignette + grain.
 */
export function PostProcessing({ enabled, reducedMotion }: Props) {
  const caOffset = useMemo(
    () => new Vector2(POST.chromaticAberration, POST.chromaticAberration),
    [],
  )

  if (!enabled) return null

  const bloom = reducedMotion ? POST.bloomIntensity * 0.5 : POST.bloomIntensity
  const noise = reducedMotion ? 0 : POST.noiseOpacity
  if (reducedMotion) caOffset.set(0, 0)

  return (
    <Suspense fallback={null}>
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={bloom}
          luminanceThreshold={POST.bloomLuminanceThreshold}
          luminanceSmoothing={POST.bloomLuminanceSmoothing}
          mipmapBlur={POST.bloomMipmapBlur}
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={caOffset}
          radialModulation={false}
          modulationOffset={0}
        />
        <Vignette
          offset={POST.vignetteOffset}
          darkness={POST.vignetteDarkness}
          eskil={false}
        />
        <Noise opacity={noise} blendFunction={BlendFunction.SOFT_LIGHT} />
      </EffectComposer>
    </Suspense>
  )
}
