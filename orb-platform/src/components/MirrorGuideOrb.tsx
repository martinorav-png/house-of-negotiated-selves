import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { RENDERER } from '../config'
import { heartbeat } from '../lib/heartbeat'
import { sampleSphere, buildPointGeometry } from '../lib/samplePoints'
import { orbPointVertexShader, orbPointFragmentShader } from '../shaders/pointCloudShaders'
import { mirrorSettings } from '../dev/mirrorSettingsStore'

const SHELL_COUNT = 9000
const VOLUME_COUNT = 3000
const HALO_COUNT = 1400

function makeUniforms() {
  const o = mirrorSettings.orb
  return {
    uTime: { value: 0 },
    uIntensity: { value: 1 },
    uHover: { value: 0 },
    uPulse: { value: 0 },
    uActivation: { value: 0 },
    uReducedMotion: { value: 0 },
    uPointScale: { value: o.pointScale },
    uRadius: { value: o.radius },
    uAudio: { value: 0 },
    uAudioBass: { value: 0 },
    uAudioMid: { value: 0 },
    uBrightness: { value: o.brightness },
    uAlphaFloor: { value: o.alphaFloor },
    uColorCore: { value: new THREE.Color(o.colorCore) },
    uColorMid: { value: new THREE.Color(o.colorMid) },
    uColorRim: { value: new THREE.Color(o.colorRim) },
  }
}

/**
 * A compact, self-contained version of the main Orb — same point-cloud
 * shader and shape, but idle (no hover/click/audio reactivity) since it's
 * only ever a passive guide presence on the Mirror station's screens, never
 * an interactive target. Renders on a transparent background so the page's
 * own CSS gradient shows through.
 */
export function MirrorGuideOrb({ className }: { className?: string }) {
  const geometry = useMemo(() => {
    const data = sampleSphere(1, {
      shellCount: SHELL_COUNT,
      volumeCount: VOLUME_COUNT,
      haloCount: HALO_COUNT,
    })
    return buildPointGeometry(data)
  }, [])

  const uniforms = useMemo(makeUniforms, [])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: orbPointVertexShader,
        fragmentShader: orbPointFragmentShader,
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
      }),
    [uniforms],
  )

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  return (
    <div className={className}>
      <Canvas
        dpr={[1, RENDERER.maxDpr]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ fov: 32, near: 0.1, far: 20, position: [0, 0, 7] }}
      >
        <GuideOrbPoints geometry={geometry} material={material} uniforms={uniforms} />
      </Canvas>
    </div>
  )
}

function GuideOrbPoints({
  geometry,
  material,
  uniforms,
}: {
  geometry: THREE.BufferGeometry
  material: THREE.ShaderMaterial
  uniforms: ReturnType<typeof makeUniforms>
}) {
  const group = useRef<THREE.Group>(null)
  const scale = useRef(1)

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const d = Math.min(delta, 0.05)
    const o = mirrorSettings.orb
    uniforms.uTime.value = t
    uniforms.uPointScale.value = o.pointScale
    uniforms.uRadius.value = o.radius
    uniforms.uBrightness.value = o.brightness
    uniforms.uAlphaFloor.value = o.alphaFloor
    uniforms.uColorCore.value.set(o.colorCore)
    uniforms.uColorMid.value.set(o.colorMid)
    uniforms.uColorRim.value.set(o.colorRim)

    const pulse = heartbeat(t, o.heartbeatBpm) * o.heartbeatRipple
    uniforms.uPulse.value = pulse

    const breath = 1 + Math.sin(t * o.breathSpeed) * o.breathAmplitude
    scale.current = THREE.MathUtils.damp(scale.current, breath, 4, d)
    if (group.current) group.current.scale.setScalar(scale.current)
  })

  return (
    <group ref={group}>
      <points geometry={geometry} material={material} frustumCulled={false} />
    </group>
  )
}
