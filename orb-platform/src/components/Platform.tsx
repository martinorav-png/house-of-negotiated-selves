import { useFrame } from '@react-three/fiber'
import { PLATFORM } from '../config'
import { useDuneRoomMaterial, useSyncDuneRoomMaterial } from './SpaceRoom'

/**
 * Pedestal — a solid mesh sharing the room's own unlit dune shader (same
 * hot spots, same grain, same desaturated palette) so it reads as a rise in
 * the floor rather than a separately lit prop.
 */
export function Platform() {
  const material = useDuneRoomMaterial(0.85)

  useFrame((state) => {
    useSyncDuneRoomMaterial(material, state.clock.elapsedTime)
  })

  return (
    <mesh material={material} position={[0, PLATFORM.y, 0]}>
      <cylinderGeometry args={[PLATFORM.radius, PLATFORM.radius * 1.04, PLATFORM.height, PLATFORM.segments]} />
    </mesh>
  )
}
