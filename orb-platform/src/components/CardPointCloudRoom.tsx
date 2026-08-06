import { useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CAMERA, RENDERER, ROOM, SCAN } from '../config'
import { scanUniforms } from '../lib/scanUniforms'
import { Room } from './Room'

function CardRoomCamera() {
  const { camera, gl, size } = useThree()

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = RENDERER.exposure
  }, [gl])

  useEffect(() => {
    const persp = camera as THREE.PerspectiveCamera
    const narrow = size.width < CAMERA.narrowBreakpoint
    persp.fov = narrow ? 44 : 34
    persp.near = CAMERA.near
    persp.far = CAMERA.far
    persp.position.set(0, 2.28, narrow ? 8.6 : 7.4)
    persp.lookAt(0, 2.34, -ROOM.depth * 0.28)
    persp.updateProjectionMatrix()
  }, [camera, size.width, size.height])

  useFrame((state) => {
    const time = state.clock.elapsedTime
    scanUniforms.uTime.value = time
    scanUniforms.uReducedMotion.value = 0
    scanUniforms.uHover.value = 0
    scanUniforms.uPulse.value = 0
    scanUniforms.uActivation.value = 0
    scanUniforms.uShockwave.value = 0
    scanUniforms.uAudio.value = 0
    scanUniforms.uAudioBass.value = 0
    scanUniforms.uAudioMid.value = 0
    scanUniforms.uOrbIntensity.value = 0.18
    scanUniforms.uScreenIntensity.value = 0
    scanUniforms.uScanY.value = ((time * SCAN.scanSpeed * 0.12) % 1) * ROOM.height
  })

  return null
}

export function CardPointCloudRoom() {
  return (
    <div className="card-point-room" aria-hidden="true">
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
          toneMappingExposure: RENDERER.exposure,
        }}
      >
        <color attach="background" args={['#030406']} />
        <fog attach="fog" args={['#030406', 7.5, 18]} />
        <CardRoomCamera />
        <Room />
      </Canvas>
    </div>
  )
}
