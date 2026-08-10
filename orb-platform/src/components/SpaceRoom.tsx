import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ROOM } from '../config'
import { duneRoomVertexShader, duneRoomFragmentShader } from '../shaders/duneRoomShaders'

/**
 * Real room geometry — five solid planes (open front, matching the camera's
 * view) positioned in world space so face-tracked camera parallax reveals
 * genuine depth. Sand/rust Dune palette: warm, alien-organic glow (two
 * offset soft blobs rather than a single perfect radial) plus a slow,
 * grain-broken sweep of light rather than a crisp scan line.
 */
export function useDuneRoomMaterial(glowStrength = 1) {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: duneRoomVertexShader,
        fragmentShader: duneRoomFragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uHotPointA: { value: new THREE.Vector3(0, 1.1, -ROOM.depth / 2 + 1.5) },
          uHotPointB: { value: new THREE.Vector3(-1.6, 2.4, -ROOM.depth / 2 + 0.4) },
          uHotRadius: { value: 9.5 },
          uGlowStrength: { value: glowStrength },
        },
        toneMapped: false,
      }),
    [glowStrength],
  )
}

export function SpaceRoom() {
  const material = useDuneRoomMaterial(1)
  const { width, height, depth } = ROOM
  const halfW = width / 2
  const halfD = depth / 2

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
  })

  return (
    <group>
      {/* Back wall */}
      <mesh material={material} position={[0, height / 2, -halfD]}>
        <planeGeometry args={[width, height]} />
      </mesh>
      {/* Left wall */}
      <mesh material={material} position={[-halfW, height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[depth, height]} />
      </mesh>
      {/* Right wall */}
      <mesh material={material} position={[halfW, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[depth, height]} />
      </mesh>
      {/* Floor */}
      <mesh material={material} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
      </mesh>
      {/* Ceiling */}
      <mesh material={material} position={[0, height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
      </mesh>
    </group>
  )
}
