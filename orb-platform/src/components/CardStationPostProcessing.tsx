import { Suspense, useMemo } from 'react'
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
  Noise,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { SECOND_STATION_POINT_CLOUD_CONFIG } from '../lib/secondStationPointCloud'

type PostSettings = {
  bloomIntensity: number
  bloomThreshold: number
  bloomSmoothing: number
  chromaticAberration: number
  noiseOpacity: number
}

/**
 * Station-2 post stack — same language as the previous GridScan:
 * soft bloom, radial chromatic aberration, and film grain. Accepts an
 * optional live-tunable `post` prop (see CardPointCloudRoom's
 * CardsPostBridge); defaults to the static config so behavior is
 * unchanged when nothing overrides it.
 */
export function CardStationPostProcessing({ post: postOverride }: { post?: PostSettings } = {}) {
  const reducedMotion = usePrefersReducedMotion()
  const post = postOverride ?? SECOND_STATION_POINT_CLOUD_CONFIG.post
  const bloom = reducedMotion ? post.bloomIntensity * 0.45 : post.bloomIntensity
  const noise = reducedMotion ? post.noiseOpacity * 0.4 : post.noiseOpacity
  const chromaOffset = useMemo(
    () => new THREE.Vector2(post.chromaticAberration, post.chromaticAberration),
    [post.chromaticAberration],
  )

  return (
    <Suspense fallback={null}>
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom
          intensity={bloom}
          luminanceThreshold={post.bloomThreshold}
          luminanceSmoothing={post.bloomSmoothing}
          mipmapBlur
        />
        <ChromaticAberration
          offset={chromaOffset}
          radialModulation
          modulationOffset={0}
        />
        <Noise opacity={noise} blendFunction={BlendFunction.SOFT_LIGHT} />
      </EffectComposer>
    </Suspense>
  )
}
