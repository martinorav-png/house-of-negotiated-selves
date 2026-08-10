import { useEffect, useMemo, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CAMERA, RENDERER, ROOM } from '../config'
import {
  SECOND_STATION_POINT_CLOUD_CONFIG,
  buildSecondStationPlatformCloud,
  buildSecondStationRoomCloud,
  type PointCloudQuality,
} from '../lib/secondStationPointCloud'
import { buildPointGeometry, mergePointClouds } from '../lib/samplePoints'
import {
  cardPointCloudFragmentShader,
  cardPointCloudVertexShader,
} from '../shaders/cardPointCloudShaders'

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

  return null
}

function makeUniforms(pixelRatio: number) {
  const config = SECOND_STATION_POINT_CLOUD_CONFIG
  return {
    uTime: { value: 0 },
    uPointScale: { value: config.pointSize.scale },
    uPixelRatio: { value: pixelRatio },
    uOrbPosition: { value: new THREE.Vector3(0, -100, 0) },
    uOrbInfluenceRadius: { value: config.orbInfluenceRadius },
    uOrbInfluenceStrength: { value: 0 },
    uFlickerAmount: { value: config.flickerAmount },
    uFlickerSpeed: { value: config.flickerSpeed },
    uDepthFade: { value: config.depthFade },
    uRippleCenter: { value: new THREE.Vector3(...config.ripple.center) },
    uRippleDuration: { value: config.ripple.duration },
    uRippleRadius: { value: config.ripple.radius },
    uRippleWidth: { value: config.ripple.width },
    uRippleDisplacement: { value: config.ripple.displacement },
    uRippleBrightness: { value: config.ripple.brightness },
    uIsOrb: { value: 0 },
  }
}

function ScannedInstallation({ quality }: { quality: PointCloudQuality }) {
  const { gl } = useThree()
  const roomGeometry = useMemo(
    () =>
      buildPointGeometry(
        mergePointClouds([
          buildSecondStationRoomCloud(quality),
          buildSecondStationPlatformCloud(quality),
        ]),
      ),
    [quality],
  )
  const roomUniforms = useMemo(() => makeUniforms(gl.getPixelRatio()), [gl])
  const roomMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: cardPointCloudVertexShader,
        fragmentShader: cardPointCloudFragmentShader,
        uniforms: roomUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [roomUniforms],
  )
  useFrame((state) => {
    roomUniforms.uTime.value = state.clock.elapsedTime
  })

  useEffect(
    () => () => {
      roomGeometry.dispose()
      roomMaterial.dispose()
    },
    [roomGeometry, roomMaterial],
  )

  return <points geometry={roomGeometry} material={roomMaterial} frustumCulled={false} />
}

export function CardPointCloudRoom() {
  const [quality] = useState<PointCloudQuality>(() =>
    typeof window !== 'undefined' && window.innerWidth < CAMERA.narrowBreakpoint
      ? 'mobile'
      : 'desktop',
  )

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
        <ScannedInstallation quality={quality} />
      </Canvas>
    </div>
  )
}
