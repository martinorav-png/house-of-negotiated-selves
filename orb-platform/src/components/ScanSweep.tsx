import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ROOM } from '../config'
import { scanUniforms } from '../lib/scanUniforms'
import { settings } from '../dev/settingsStore'
import { syncColor } from '../lib/colorSync'
import { samplePlane, mergePointClouds, buildPointGeometry } from '../lib/samplePoints'

const STRIP_HEIGHT = 0.55

/**
 * Thin point-cloud bands hugging the back/left/right walls, bodily
 * translated up through the room by uScanY — the original repo's
 * point-cloud Room lit up its own wall points as a scan band passed them;
 * this reuses that same wall-sampling technique now that the room itself
 * is solid geometry rather than points. Only visible while the visitor is
 * actively typing (scanUniforms.uScanActive, written from Orb.tsx).
 */
export function ScanSweep() {
  const points = useRef<THREE.Points>(null)

  const geometry = useMemo(() => {
    const halfW = ROOM.width / 2
    const halfD = ROOM.depth / 2
    const opts = {
      count: 480,
      keepChance: 0.75,
      holeFraction: 0.2,
      sizeMin: 0.7,
      sizeMax: 1.5,
      brightnessMin: 0.5,
      brightnessMax: 1.0,
    }

    const back = samplePlane(
      new THREE.Vector3(0, 0, -halfD),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      ROOM.width,
      STRIP_HEIGHT,
      new THREE.Vector3(0, 0, 1),
      opts,
    )
    const left = samplePlane(
      new THREE.Vector3(-halfW, 0, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 1, 0),
      ROOM.depth,
      STRIP_HEIGHT,
      new THREE.Vector3(1, 0, 0),
      opts,
    )
    const right = samplePlane(
      new THREE.Vector3(halfW, 0, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 1, 0),
      ROOM.depth,
      STRIP_HEIGHT,
      new THREE.Vector3(-1, 0, 0),
      opts,
    )

    return buildPointGeometry(mergePointClouds([back, left, right]))
  }, [])

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        color: new THREE.Color(settings.scan.color),
        size: settings.scan.pointSize,
        transparent: true,
        opacity: 0,
        depthWrite: false,
        sizeAttenuation: true,
      }),
    [],
  )

  useFrame(() => {
    if (points.current) {
      points.current.position.y = scanUniforms.uScanY.value
    }
    material.size = settings.scan.pointSize
    syncColor(material.color, settings.scan.color)
    // Fade near the very top/bottom of each climb so the sawtooth's reset
    // back to the floor happens while invisible, not as a visible jump.
    const cycleFrac = THREE.MathUtils.clamp(scanUniforms.uScanY.value / ROOM.height, 0, 1)
    const fadeIn = THREE.MathUtils.smoothstep(cycleFrac, 0, 0.12)
    const fadeOut = 1 - THREE.MathUtils.smoothstep(cycleFrac, 0.82, 1)
    material.opacity = scanUniforms.uScanActive.value * fadeIn * fadeOut * settings.scan.opacity
  })

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} />
}
