import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ROOM, PALETTE, SCAN, ORB, ROOM_DISSOLVE } from '../config'
import { scanUniforms } from '../lib/scanUniforms'
import {
  samplePlane,
  mergePointClouds,
  buildPointGeometry,
} from '../lib/samplePoints'
import {
  envPointVertexShader,
  envPointFragmentShader,
} from '../shaders/pointCloudShaders'

/**
 * Room as LiDAR-style point cloud — same dimensions / positions as the solid room.
 * Revealed top→bottom by the shared dissolve front as each question is entered.
 */
export function Room() {
  const geometry = useMemo(() => {
    const { width, height, depth } = ROOM
    const halfW = width / 2
    const halfD = depth / 2
    const halfH = height / 2

    const back = samplePlane(
      new THREE.Vector3(0, halfH, -halfD),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      width,
      height,
      new THREE.Vector3(0, 0, 1),
      {
        count: SCAN.roomBack,
        keepChance: 0.94,
        holeFraction: 0.06,
        sizeMin: 1.3,
        sizeMax: 2.9,
        brightnessMin: 0.4,
        brightnessMax: 1.05,
        // Slightly denser near orb height / center
        weight: (x, y) => {
          const cx = 1 - Math.min(1, Math.abs(x) / halfW)
          const cy = 1 - Math.min(1, Math.abs(y - ORB.baseY) / halfH)
          return 0.55 + cx * 0.25 + cy * 0.25
        },
      },
    )

    // Side walls: sparser toward +Z (camera / open front)
    const sideWeight = (_x: number, _y: number, z: number) => {
      const front = (z + halfD) / depth // 0 back → 1 front
      return 0.95 - front * 0.7
    }

    const left = samplePlane(
      new THREE.Vector3(-halfW, halfH, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 1, 0),
      depth,
      height,
      new THREE.Vector3(1, 0, 0),
      {
        count: SCAN.roomLeft,
        keepChance: 0.88,
        holeFraction: 0.1,
        sizeMin: 1.1,
        sizeMax: 2.6,
        brightnessMin: 0.3,
        brightnessMax: 0.9,
        weight: sideWeight,
      },
    )

    const right = samplePlane(
      new THREE.Vector3(halfW, halfH, 0),
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(0, 1, 0),
      depth,
      height,
      new THREE.Vector3(-1, 0, 0),
      {
        count: SCAN.roomRight,
        keepChance: 0.88,
        holeFraction: 0.1,
        sizeMin: 1.1,
        sizeMax: 2.6,
        brightnessMin: 0.3,
        brightnessMax: 0.9,
        weight: sideWeight,
      },
    )

    const floor = samplePlane(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 1),
      width,
      depth,
      new THREE.Vector3(0, 1, 0),
      {
        count: SCAN.roomFloor,
        keepChance: 0.9,
        holeFraction: 0.09,
        sizeMin: 1.2,
        sizeMax: 2.7,
        brightnessMin: 0.28,
        brightnessMax: 0.95,
        weight: (x, _y, z) => {
          const front = (z + halfD) / depth
          const radial = 1 - Math.min(1, Math.hypot(x, z) / (halfW * 1.2))
          return (0.95 - front * 0.65) * (0.5 + radial * 0.5)
        },
      },
    )

    const ceiling = samplePlane(
      new THREE.Vector3(0, height, 0),
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 0, 1),
      width,
      depth,
      new THREE.Vector3(0, -1, 0),
      {
        count: SCAN.roomCeiling,
        keepChance: 0.8,
        holeFraction: 0.14,
        sizeMin: 1.0,
        sizeMax: 2.2,
        brightnessMin: 0.2,
        brightnessMax: 0.65,
        weight: (_x, _y, z) => {
          const front = (z + halfD) / depth
          return 0.85 - front * 0.55
        },
      },
    )

    return buildPointGeometry(mergePointClouds([back, left, right, floor, ceiling]))
  }, [])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: envPointVertexShader,
        fragmentShader: envPointFragmentShader,
        uniforms: {
          ...scanUniforms,
          uEnvColor: { value: new THREE.Color(PALETTE.envPoint) },
          uPointScale: { value: SCAN.envPointScale },
          uPeelStrength: { value: ROOM_DISSOLVE.peelStrength },
          uPointScaleBoost: { value: ROOM_DISSOLVE.pointScaleBoost },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
      }),
    [],
  )

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame(() => {
    material.uniforms.uPointScale.value = SCAN.envPointScale
    material.uniforms.uPeelStrength.value = ROOM_DISSOLVE.peelStrength
    material.uniforms.uPointScaleBoost.value = ROOM_DISSOLVE.pointScaleBoost
  })

  return <points geometry={geometry} material={material} frustumCulled={false} />
}
