import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { CAMERA, PLATFORM, RENDERER, ROOM } from '../config'
import { avatarPortraits, type AvatarPortrait } from '../lib/avatarPortraits'
import './AvatarStation.css'

const PORTRAIT_HEIGHT = 1.22
const PORTRAIT_GAP = 0.18
const PORTRAIT_ASPECT = 0.72
const PORTRAIT_HOVER = 0.07

function AvatarRoomCamera() {
  const { camera, gl, size } = useThree()

  useEffect(() => {
    gl.toneMapping = THREE.NoToneMapping
    gl.toneMappingExposure = 1
  }, [gl])

  useEffect(() => {
    const persp = camera as THREE.PerspectiveCamera
    const narrow = size.width < CAMERA.narrowBreakpoint
    persp.fov = narrow ? 44 : 34
    persp.near = CAMERA.near
    persp.far = CAMERA.far
    persp.position.set(0, 2.28, narrow ? 8.6 : 7.4)
    persp.lookAt(0, 2.1, -ROOM.depth * 0.12)
    persp.updateProjectionMatrix()
  }, [camera, size.width, size.height])

  return null
}

/** Shared room shell as wire edges — same ROOM bounds as stations 1–2. */
function WireRoom() {
  const geometry = useMemo(() => {
    const box = new THREE.BoxGeometry(ROOM.width, ROOM.height, ROOM.depth)
    const edges = new THREE.EdgesGeometry(box)
    box.dispose()
    return edges
  }, [])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <lineSegments geometry={geometry} position={[0, ROOM.height / 2, 0]}>
      <lineBasicMaterial color="#6f8a7c" transparent opacity={0.72} />
    </lineSegments>
  )
}

/** Pedestal matching PLATFORM knobs. */
function WirePlatform() {
  return (
    <mesh position={[0, PLATFORM.y, 0]}>
      <cylinderGeometry
        args={[
          PLATFORM.radius,
          PLATFORM.radius * 1.04,
          PLATFORM.height,
          PLATFORM.segments,
        ]}
      />
      <meshBasicMaterial color="#9bb5a4" wireframe transparent opacity={0.85} />
    </mesh>
  )
}

function PersonaPortraitCard({
  portrait,
  index,
  count,
}: {
  portrait: AvatarPortrait
  index: number
  count: number
}) {
  const group = useRef<THREE.Group>(null)
  const texture = useTexture(portrait.image)
  const width = PORTRAIT_HEIGHT * PORTRAIT_ASPECT
  const span = count * width + (count - 1) * PORTRAIT_GAP
  const x = -span / 2 + width / 2 + index * (width + PORTRAIT_GAP)
  const baseY =
    PLATFORM.y + PLATFORM.height / 2 + PORTRAIT_HEIGHT / 2 + 0.42

  const frameGeometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(width, PORTRAIT_HEIGHT)
    const edges = new THREE.EdgesGeometry(plane)
    plane.dispose()
    return edges
  }, [width])

  useEffect(() => () => frameGeometry.dispose(), [frameGeometry])

  useEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    texture.needsUpdate = true
  }, [texture])

  useFrame((state) => {
    if (!group.current) return
    const bob =
      Math.sin(state.clock.elapsedTime * 0.9 + index * 0.85) * PORTRAIT_HOVER
    group.current.position.y = baseY + bob
  })

  return (
    <group ref={group} position={[x, baseY, 0.55]}>
      <mesh>
        <planeGeometry args={[width, PORTRAIT_HEIGHT]} />
        <meshBasicMaterial map={texture} toneMapped={false} side={THREE.FrontSide} />
      </mesh>
      <lineSegments geometry={frameGeometry}>
        <lineBasicMaterial color="#c8ddd2" transparent opacity={0.55} />
      </lineSegments>
    </group>
  )
}

function PersonaPortraitRow() {
  return (
    <group>
      {avatarPortraits.map((portrait, index) => (
        <PersonaPortraitCard
          key={portrait.id}
          portrait={portrait}
          index={index}
          count={avatarPortraits.length}
        />
      ))}
    </group>
  )
}

export function AvatarStation() {
  return (
    <section className="avatar-station" aria-label="Avatar portrait station">
      <div className="avatar-station-canvas" aria-hidden="true">
        <Canvas
          dpr={[1, RENDERER.maxDpr]}
          camera={{
            fov: 34,
            near: CAMERA.near,
            far: CAMERA.far,
            position: [0, 2.28, 7.4],
          }}
          gl={{
            antialias: true,
            powerPreference: 'high-performance',
            toneMapping: THREE.NoToneMapping,
            toneMappingExposure: 1,
          }}
        >
          <color attach="background" args={['#030406']} />
          <AvatarRoomCamera />
          <WireRoom />
          <WirePlatform />
          <Suspense fallback={null}>
            <PersonaPortraitRow />
          </Suspense>
        </Canvas>
      </div>
    </section>
  )
}
