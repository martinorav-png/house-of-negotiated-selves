import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CAMERA, ORB, RENDERER, ROOM } from '../config'
import {
  SECOND_STATION_POINT_CLOUD_CONFIG,
  buildSecondStationPlatformCloud,
  buildSecondStationRoomCloud,
  type PointCloudQuality,
} from '../lib/secondStationPointCloud'
import {
  buildPointGeometry,
  mergePointClouds,
  sampleSphere,
} from '../lib/samplePoints'
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

function makeUniforms(isOrb: boolean, pixelRatio: number) {
  const config = SECOND_STATION_POINT_CLOUD_CONFIG
  return {
    uTime: { value: 0 },
    uPointScale: { value: config.pointSize.scale },
    uPixelRatio: { value: pixelRatio },
    uOrbPosition: { value: new THREE.Vector3(0, ORB.baseY, 0) },
    uOrbInfluenceRadius: { value: config.orbInfluenceRadius },
    uOrbInfluenceStrength: { value: config.orbInfluenceStrength },
    uFlickerAmount: { value: config.flickerAmount },
    uFlickerSpeed: { value: config.flickerSpeed },
    uDepthFade: { value: config.depthFade },
    uIsOrb: { value: isOrb ? 1 : 0 },
  }
}

function ScannedInstallation({ quality }: { quality: PointCloudQuality }) {
  const { gl } = useThree()
  const orb = useRef<THREE.Points>(null)
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
  const orbGeometry = useMemo(() => {
    const count = SECOND_STATION_POINT_CLOUD_CONFIG[quality].orbCount
    return buildPointGeometry(
      sampleSphere(ORB.radius, {
        shellCount: Math.round(count * 0.72),
        volumeCount: Math.round(count * 0.22),
        haloCount: count - Math.round(count * 0.72) - Math.round(count * 0.22),
      }),
    )
  }, [quality])
  const roomUniforms = useMemo(() => makeUniforms(false, gl.getPixelRatio()), [gl])
  const orbUniforms = useMemo(() => makeUniforms(true, gl.getPixelRatio()), [gl])
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
  const orbMaterial = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: cardPointCloudVertexShader,
        fragmentShader: cardPointCloudFragmentShader,
        uniforms: orbUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [orbUniforms],
  )

  useFrame((state) => {
    const time = state.clock.elapsedTime
    const orbY = ORB.baseY + Math.sin(time * 0.7) * 0.018
    if (orb.current) orb.current.position.y = orbY
    roomUniforms.uTime.value = time
    orbUniforms.uTime.value = time
    roomUniforms.uOrbPosition.value.set(0, orbY, 0)
    orbUniforms.uOrbPosition.value.set(0, 0, 0)
  })

  useEffect(
    () => () => {
      roomGeometry.dispose()
      orbGeometry.dispose()
      roomMaterial.dispose()
      orbMaterial.dispose()
    },
    [orbGeometry, orbMaterial, roomGeometry, roomMaterial],
  )

  return (
    <>
      <points geometry={roomGeometry} material={roomMaterial} frustumCulled={false} />
      <points
        ref={orb}
        geometry={orbGeometry}
        material={orbMaterial}
        position={[0, ORB.baseY, 0]}
        frustumCulled={false}
      />
    </>
  )
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
