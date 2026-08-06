import { Suspense } from 'react'
import {
  EffectComposer,
  Bloom,
} from '@react-three/postprocessing'
import { POST } from '../config'

type Props = {
  enabled: boolean
  reducedMotion: boolean
}

/**
 * Soft bloom only. Grain, chromatic aberration and vignette are intentionally off.
 */
export function PostProcessing({ enabled, reducedMotion }: Props) {
  if (!enabled) return null

  const bloom = reducedMotion ? POST.bloomIntensity * 0.5 : POST.bloomIntensity

  return (
    <Suspense fallback={null}>
      <EffectComposer multisampling={0}>
        <Bloom
          intensity={bloom}
          luminanceThreshold={POST.bloomLuminanceThreshold}
          luminanceSmoothing={POST.bloomLuminanceSmoothing}
          mipmapBlur={POST.bloomMipmapBlur}
          radius={POST.bloomRadius}
          levels={POST.bloomLevels}
        />
      </EffectComposer>
    </Suspense>
  )
}
