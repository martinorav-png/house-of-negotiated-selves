import { useMemo } from 'react'
import * as THREE from 'three'
import { LIGHT, PALETTE, ORB } from '../config'

/**
 * Dim secondary lights — visible illumination is mostly shader-simulated from the orb.
 */
export function Lighting() {
  const fillColor = useMemo(() => new THREE.Color(PALETTE.fill), [])
  const ambientColor = useMemo(() => new THREE.Color(PALETTE.ambient), [])

  return (
    <>
      <ambientLight intensity={LIGHT.ambientIntensity} color={ambientColor} />
      <hemisphereLight
        args={[PALETTE.fill, '#030406', LIGHT.hemiIntensity]}
        position={[0, ORB.baseY + 2, 0]}
      />
      <directionalLight
        intensity={LIGHT.fillIntensity}
        color={fillColor}
        position={[0, ORB.baseY + 1.5, 4]}
        castShadow={false}
      />
    </>
  )
}
