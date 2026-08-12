import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ROOM } from '../config'
import { duneRoomVertexShader, duneRoomFragmentShader } from '../shaders/duneRoomShaders'
import { settings } from '../dev/settingsStore'
import { syncColor } from '../lib/colorSync'

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
          uHotRadius: { value: settings.room.glowRadius },
          uGlowStrength: { value: glowStrength },
          uBaseColor: { value: new THREE.Color(settings.room.baseColor) },
          uLiftColor: { value: new THREE.Color(settings.room.liftColor) },
          uSaturation: { value: settings.room.saturation },
          uGrainAmount: { value: settings.room.grain },
        },
        toneMapped: false,
      }),
    [glowStrength],
  )
}

/** Syncs a dune-room material's live-tunable uniforms from the settings store. */
export function useSyncDuneRoomMaterial(material: THREE.ShaderMaterial, elapsed: number) {
  material.uniforms.uTime.value = elapsed
  material.uniforms.uHotRadius.value = settings.room.glowRadius
  syncColor(material.uniforms.uBaseColor.value, settings.room.baseColor)
  syncColor(material.uniforms.uLiftColor.value, settings.room.liftColor)
  material.uniforms.uSaturation.value = settings.room.saturation
  material.uniforms.uGrainAmount.value = settings.room.grain
}

export function SpaceRoom() {
  const material = useDuneRoomMaterial(1)
  const { width, height, depth } = ROOM
  const halfW = width / 2
  const halfD = depth / 2

  useFrame((state) => {
    useSyncDuneRoomMaterial(material, state.clock.elapsedTime)
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
