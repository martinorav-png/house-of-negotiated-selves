import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CAMERA, RENDERER } from '../config'
import { Room } from './Room'
import { Platform } from './Platform'
import { Lighting } from './Lighting'
import { Orb } from './Orb'
import { StatsLogWall } from './StatsLogWall'
import { SpatialQuestion } from './SpatialQuestion'
import { PostProcessing } from './PostProcessing'
import { CameraParallax } from './CameraParallax'
import { useOrbContext } from '../context/OrbContext'

type Props = {
  postEnabled: boolean
  parallaxEnabled: boolean
  answerText: string
  questionText: string
  submitSerial: number
}

/**
 * Fixed-camera installation scene — point-cloud scan visual language.
 * Layout, framing, and interaction unchanged from the solid-material version.
 */
export function Scene({
  postEnabled,
  parallaxEnabled,
  answerText,
  questionText,
  submitSerial,
}: Props) {
  const { camera, size, gl } = useThree()
  const { reducedMotion } = useOrbContext()

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = RENDERER.exposure
    gl.shadowMap.enabled = false
  }, [gl])

  useEffect(() => {
    const persp = camera as THREE.PerspectiveCamera
    const narrow = size.width < CAMERA.narrowBreakpoint
    persp.fov = narrow ? CAMERA.narrowFov : CAMERA.fov
    persp.near = CAMERA.near
    persp.far = CAMERA.far
    persp.updateProjectionMatrix()
  }, [camera, size.width, size.height])

  return (
    <>
      <color attach="background" args={['#030406']} />
      <fog attach="fog" args={['#030406', 9, 20]} />

      <Lighting />
      <Room />
      <StatsLogWall questionText={questionText} submitSerial={submitSerial} />
      <Platform />
      <Orb />
      <SpatialQuestion answerText={answerText} submitSerial={submitSerial} />
      <CameraParallax enabled={parallaxEnabled} />

      <PostProcessing enabled={postEnabled} reducedMotion={reducedMotion} />
    </>
  )
}
