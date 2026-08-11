import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CAMERA, RENDERER } from '../config'
import { Platform } from './Platform'
import { Lighting } from './Lighting'
import { Orb } from './Orb'
import { DarkSpace } from './DarkSpace'
import { SpaceRoom } from './SpaceRoom'
import { Room } from './Room'
import { DissolvingRoomDust, RoomDissolveController } from './RoomDissolve'
import { SpatialQuestion } from './SpatialQuestion'
import { QuestionPrompt } from './QuestionPrompt'
import { PostProcessing } from './PostProcessing'
import { CameraParallax } from './CameraParallax'
import { useOrbContext } from '../context/OrbContext'

type Props = {
  postEnabled: boolean
  parallaxEnabled: boolean
  answerText: string
  questionText: string
  questionIndex: number
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
  questionIndex,
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
      <color attach="background" args={['#0b0704']} />
      <fog attach="fog" args={['#0b0704', 14, 26]} />

      <Lighting />
      <DarkSpace />
      <SpaceRoom />
      <Room />
      <DissolvingRoomDust />
      <Platform />
      <Orb />
      <QuestionPrompt questionText={questionText} submitSerial={submitSerial} />
      <SpatialQuestion answerText={answerText} submitSerial={submitSerial} />
      <RoomDissolveController questionIndex={questionIndex} />
      <CameraParallax enabled={parallaxEnabled} />

      <PostProcessing enabled={postEnabled} reducedMotion={reducedMotion} />
    </>
  )
}
