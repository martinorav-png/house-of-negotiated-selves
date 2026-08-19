import { useEffect, useMemo, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { CAMERA, ROOM } from '../config'
import { getDeviceQuality, webGlMaxDpr } from '../lib/deviceQuality'
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
import { CardScanSweep } from './CardScanSweep'
import { CardStationPostProcessing } from './CardStationPostProcessing'
import { cardSettings } from '../dev/cardSettingsStore'

function CardRoomCamera() {
  const { camera, gl, size } = useThree()

  useEffect(() => {
    // Match the previous GridScan canvas — no filmic tone map so bloom/CA stay punchy.
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
    persp.lookAt(0, 2.34, -ROOM.depth * 0.28)
    persp.updateProjectionMatrix()
  }, [camera, size.width, size.height])

  return null
}

function makeUniforms(pixelRatio: number) {
  const config = SECOND_STATION_POINT_CLOUD_CONFIG
  const pc = cardSettings.pointCloud
  return {
    uTime: { value: 0 },
    uPointScale: { value: pc.pointScale },
    uPixelRatio: { value: pixelRatio },
    uOrbPosition: { value: new THREE.Vector3(0, -100, 0) },
    uOrbInfluenceRadius: { value: config.orbInfluenceRadius },
    uOrbInfluenceStrength: { value: 0 },
    uFlickerAmount: { value: pc.flickerAmount },
    uFlickerSpeed: { value: pc.flickerSpeed },
    uDepthFade: { value: pc.depthFade },
    uRippleCenter: { value: new THREE.Vector3(...config.ripple.center) },
    uRippleDuration: { value: pc.rippleDuration },
    uRippleRadius: { value: pc.rippleRadius },
    uRippleWidth: { value: pc.rippleWidth },
    uRippleDisplacement: { value: pc.rippleDisplacement },
    uRippleBrightness: { value: pc.rippleBrightness },
    uIsOrb: { value: 0 },
    uNearBlack: { value: new THREE.Color(pc.colorNearBlack) },
    uMutedCyan: { value: new THREE.Color(pc.colorCyan) },
    uMutedViolet: { value: new THREE.Color(pc.colorViolet) },
    uDimGreen: { value: new THREE.Color(pc.colorGreen) },
    uRareMagenta: { value: new THREE.Color(pc.colorMagenta) },
    uOrbInfluenceColor: { value: new THREE.Color(pc.colorOrbInfluence) },
    uRippleColor: { value: new THREE.Color(pc.colorRipple) },
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
    const pc = cardSettings.pointCloud
    roomUniforms.uPointScale.value = pc.pointScale
    roomUniforms.uFlickerAmount.value = pc.flickerAmount
    roomUniforms.uFlickerSpeed.value = pc.flickerSpeed
    roomUniforms.uDepthFade.value = pc.depthFade
    roomUniforms.uRippleDuration.value = pc.rippleDuration
    roomUniforms.uRippleRadius.value = pc.rippleRadius
    roomUniforms.uRippleWidth.value = pc.rippleWidth
    roomUniforms.uRippleDisplacement.value = pc.rippleDisplacement
    roomUniforms.uRippleBrightness.value = pc.rippleBrightness
    roomUniforms.uNearBlack.value.set(pc.colorNearBlack)
    roomUniforms.uMutedCyan.value.set(pc.colorCyan)
    roomUniforms.uMutedViolet.value.set(pc.colorViolet)
    roomUniforms.uDimGreen.value.set(pc.colorGreen)
    roomUniforms.uRareMagenta.value.set(pc.colorMagenta)
    roomUniforms.uOrbInfluenceColor.value.set(pc.colorOrbInfluence)
    roomUniforms.uRippleColor.value.set(pc.colorRipple)
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

/**
 * Bridges cardSettings.post (a plain object, no leva dependency, safe for
 * production) into real React props for CardStationPostProcessing — polled
 * via useFrame rather than imported reactively, so the always-loaded
 * post-processing component never needs to import leva itself.
 */
function CardsPostBridge() {
  const [post, setPost] = useState(() => ({ ...cardSettings.post }))
  useFrame(() => {
    const s = cardSettings.post
    if (
      s.bloomIntensity !== post.bloomIntensity ||
      s.bloomThreshold !== post.bloomThreshold ||
      s.bloomSmoothing !== post.bloomSmoothing ||
      s.chromaticAberration !== post.chromaticAberration ||
      s.noiseOpacity !== post.noiseOpacity
    ) {
      setPost({ ...s })
    }
  })
  return <CardStationPostProcessing post={post} />
}

export function CardPointCloudRoom() {
  const kiosk = getDeviceQuality() === 'kiosk'
  const [quality] = useState<PointCloudQuality>(() =>
    kiosk || (typeof window !== 'undefined' && window.innerWidth < CAMERA.narrowBreakpoint)
      ? 'mobile'
      : 'desktop',
  )

  return (
    <div className="card-point-room" aria-hidden="true">
      <Canvas
        dpr={[1, webGlMaxDpr()]}
        camera={{
          fov: 34,
          near: CAMERA.near,
          far: CAMERA.far,
          position: [0, 2.28, 7.4],
        }}
        gl={{
          antialias: !kiosk,
          powerPreference: kiosk ? 'low-power' : 'high-performance',
          toneMapping: THREE.NoToneMapping,
          toneMappingExposure: 1,
        }}
      >
        <color attach="background" args={['#030406']} />
        <fog attach="fog" args={['#030406', 7.5, 18]} />
        <CardRoomCamera />
        <ScannedInstallation quality={quality} />
        <CardScanSweep />
        {kiosk ? null : <CardsPostBridge />}
      </Canvas>
    </div>
  )
}
