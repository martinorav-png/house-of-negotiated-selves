import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { PLATFORM, PALETTE, SCAN } from '../config'
import { scanUniforms } from '../lib/scanUniforms'
import {
  sampleBoxSurface,
  sampleDisk,
  mergePointClouds,
  buildPointGeometry,
} from '../lib/samplePoints'
import {
  envPointVertexShader,
  envPointFragmentShader,
} from '../shaders/pointCloudShaders'

/**
 * Platform as point cloud — same footprint / height as the solid pedestal.
 * Denser under the orb; concentric scan rings on the top disk.
 */
export function Platform() {
  const geometry = useMemo(() => {
    const boxW = PLATFORM.radius * 1.85
    const boxH = PLATFORM.height
    const boxD = PLATFORM.radius * 1.85
    const center = new THREE.Vector3(0, PLATFORM.y, 0)

    const box = sampleBoxSurface(center, boxW, boxH, boxD, {
      count: SCAN.platformBox,
      topBias: 0.5,
      keepChance: 0.9,
      holeFraction: 0.1,
      sizeMin: 1.3,
      sizeMax: 3.0,
      brightnessMin: 0.35,
      brightnessMax: 1.0,
      weight: (x, _y, z) => {
        const r = Math.hypot(x, z) / (PLATFORM.radius * 1.2)
        return 1.05 - Math.min(1, r) * 0.45
      },
    })

    const disk = sampleDisk(
      new THREE.Vector3(0, PLATFORM.y + PLATFORM.height / 2 + 0.012, 0),
      PLATFORM.radius * 0.92,
      {
        count: SCAN.platformDisk,
        ringBias: true,
        keepChance: 0.92,
        sizeMin: 1.5,
        sizeMax: 3.4,
        brightnessMin: 0.5,
        brightnessMax: 1.25,
      },
    )

    return buildPointGeometry(mergePointClouds([box, disk]))
  }, [])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: envPointVertexShader,
        fragmentShader: envPointFragmentShader,
        uniforms: {
          ...scanUniforms,
          uEnvColor: { value: new THREE.Color(PALETTE.envPoint).offsetHSL(0, 0, 0.06) },
          uPointScale: { value: SCAN.envPointScale * 1.05 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  return <points geometry={geometry} material={material} frustumCulled={false} />
}
