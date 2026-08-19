import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ORB, LIGHT, PALETTE, PARTICLES, SCAN, ROOM, AUDIO } from '../config'
import { useOrbContext } from '../context/OrbContext'
import { scanUniforms } from '../lib/scanUniforms'
import { audioLevels } from '../lib/audioLevels'
import { heartbeat } from '../lib/heartbeat'
import { typingState } from '../lib/typingState'
import { settings } from '../dev/settingsStore'
import { sampleSphere, buildPointGeometry } from '../lib/samplePoints'
import { kioskOrbCounts } from '../lib/deviceQuality'
import {
  orbPointVertexShader,
  orbPointFragmentShader,
} from '../shaders/pointCloudShaders'
import { OrbParticles, type OrbParticlesHandle } from './OrbParticles'

const _colorCore = new THREE.Color(PALETTE.orbCore)
const _colorMid = new THREE.Color(PALETTE.orbMid)
const _colorRim = new THREE.Color(PALETTE.orbRim)

/**
 * Point-cloud orb — invisible hit sphere for interaction; visible Points scan volume.
 * Writes shared scanUniforms so the room reacts to light / shockwave.
 */
export function Orb() {
  const group = useRef<THREE.Group>(null)
  const light = useRef<THREE.PointLight>(null)
  const particles = useRef<OrbParticlesHandle>(null)

  const { hover, activation, locked, reducedMotion, setHover, triggerActivation } =
    useOrbContext()

  const geometry = useMemo(() => {
    const counts = kioskOrbCounts({
      shell: SCAN.orbShell,
      volume: SCAN.orbVolume,
      halo: SCAN.orbHalo,
    })
    const data = sampleSphere(ORB.radius, {
      shellCount: counts.shell,
      volumeCount: counts.volume,
      haloCount: counts.halo,
    })
    return buildPointGeometry(data)
  }, [])

  const uniforms = useMemo(
    () => ({
      uTime: scanUniforms.uTime,
      uIntensity: { value: 1 },
      uHover: scanUniforms.uHover,
      uPulse: scanUniforms.uPulse,
      uActivation: scanUniforms.uActivation,
      uReducedMotion: scanUniforms.uReducedMotion,
      uPointScale: { value: SCAN.orbPointScale },
      uRadius: { value: ORB.radius },
      uColorCore: { value: _colorCore },
      uColorMid: { value: _colorMid },
      uColorRim: { value: _colorRim },
      uAudio: scanUniforms.uAudio,
      uAudioBass: scanUniforms.uAudioBass,
      uAudioMid: scanUniforms.uAudioMid,
      uBrightness: { value: settings.orb.brightness },
      uAlphaFloor: { value: settings.orb.alphaFloor },
    }),
    [],
  )

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

  const hitMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    [],
  )

  const hoverAmt = useRef(0)
  const actAmt = useRef(0)
  const scanActiveAmt = useRef(0)
  const scanCycleStart = useRef(0)
  const wasTyping = useRef(false)
  const prevActivation = useRef(0)
  const lightIntensity = useRef<number>(LIGHT.orbIdle)
  const scaleRef = useRef(1)
  const shockwave = useRef(0)

  useEffect(() => {
    if (activation > 0.5 && prevActivation.current <= 0.5) {
      particles.current?.burst()
      shockwave.current = 0.01
    }
    prevActivation.current = activation
  }, [activation])

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
      hitMat.dispose()
    }
  }, [geometry, material, hitMat])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime
    const motionScale = reducedMotion ? 0.25 : 1
    const d = Math.min(delta, 0.05)

    scanUniforms.uTime.value = t
    scanUniforms.uReducedMotion.value = reducedMotion ? 1 : 0
    uniforms.uBrightness.value = settings.orb.brightness
    uniforms.uAlphaFloor.value = settings.orb.alphaFloor
    // Horizontal scan band climbing floor → ceiling — only while typing.
    // Restarts from the floor each time typing begins (not wherever a
    // background cycle happened to be), so it always reads as climbing up
    // from the bottom rather than resuming mid-air.
    if (typingState.active && !wasTyping.current) {
      scanCycleStart.current = t
    }
    wasTyping.current = typingState.active
    const cyclePos = (t - scanCycleStart.current) * settings.scan.speed * 0.09
    const scanT = cyclePos % 1
    scanUniforms.uScanY.value = scanT * ROOM.height
    scanActiveAmt.current = THREE.MathUtils.damp(
      scanActiveAmt.current,
      typingState.active ? 1 : 0,
      2.5,
      d,
    )
    scanUniforms.uScanActive.value = scanActiveAmt.current

    // Smooth hover — never snap the live value; only chase the boolean target
    const hoverTarget = hover
    const hoverLambda =
      hoverTarget > hoverAmt.current ? ORB.hoverDampIn : ORB.hoverDampOut
    const h = THREE.MathUtils.damp(hoverAmt.current, hoverTarget, hoverLambda, d)
    hoverAmt.current = h

    const a = THREE.MathUtils.damp(actAmt.current, activation, 5, d)
    actAmt.current = a

    scanUniforms.uHover.value = h
    scanUniforms.uActivation.value = a

    // Autonomous heartbeat (quieter under reduced motion)
    const pulseRaw = heartbeat(t, settings.orb.heartbeatBpm)
    const pulse = pulseRaw * settings.orb.heartbeatRipple * (reducedMotion ? 0.35 : 1)
    scanUniforms.uPulse.value = pulse

    // Mic levels → shaders + motion
    const audioMul = reducedMotion ? 0.35 : 1
    scanUniforms.uAudio.value = audioLevels.level * audioMul
    scanUniforms.uAudioBass.value = audioLevels.bass * audioMul
    scanUniforms.uAudioMid.value = audioLevels.mid * audioMul

    // Activation wave climbs from floor to ceiling.
    if (a > 0.015 || shockwave.current > 0.05) {
      if (shockwave.current > 0 && shockwave.current < SCAN.shockwaveMaxRadius) {
        shockwave.current = Math.min(
          SCAN.shockwaveMaxRadius,
          shockwave.current + d * (1.45 + a * 1.15),
        )
      }
      if (a <= 0.015 && shockwave.current >= SCAN.shockwaveMaxRadius * 0.98) {
        shockwave.current = THREE.MathUtils.damp(shockwave.current, 0, 2.2, d)
        if (shockwave.current < 0.05) shockwave.current = 0
      }
    } else {
      shockwave.current = THREE.MathUtils.damp(shockwave.current, 0, 3, d)
    }
    scanUniforms.uShockwave.value = shockwave.current

    const bass = audioLevels.bass * audioMul
    const level = audioLevels.level * audioMul

    const floatY =
      ORB.baseY +
      Math.sin(t * settings.orb.floatSpeed) * settings.orb.floatAmplitude * motionScale +
      bass * AUDIO.floatBoost * motionScale +
      Math.sin(t * (2.4 + level * 6)) * level * 0.04 * motionScale

    const breath =
      1 +
      Math.sin(t * settings.orb.breathSpeed) * settings.orb.breathAmplitude * motionScale +
      level * AUDIO.scaleBoost

    const hoverScale = THREE.MathUtils.lerp(1, settings.orb.hoverScale, h)
    const clickScale = THREE.MathUtils.lerp(1, ORB.clickPulseScale, a)
    const heartScale = 1 + pulse * settings.orb.heartbeatScale
    const targetScale = breath * hoverScale * clickScale * heartScale
    scaleRef.current = THREE.MathUtils.damp(
      scaleRef.current,
      targetScale,
      settings.orb.scaleDamp,
      d,
    )
    if (group.current) {
      group.current.position.y = floatY
      // Subtle audio sway — keeps composition centered
      group.current.position.x = Math.sin(t * 1.7) * audioLevels.mid * 0.04 * audioMul
      group.current.position.z = Math.cos(t * 1.3) * audioLevels.treble * 0.03 * audioMul
      group.current.scale.setScalar(scaleRef.current)
      scanUniforms.uOrbPosition.value.set(
        group.current.position.x,
        group.current.position.y,
        group.current.position.z,
      )
    }

    const intensity =
      0.48 +
      h * 0.12 +
      a * 0.2 +
      pulse * 0.08 +
      level * AUDIO.intensityBoost +
      Math.sin(t * 1.4) * 0.015 * motionScale
    uniforms.uIntensity.value = intensity

    const lightTarget =
      LIGHT.orbIdle +
      h * (LIGHT.orbHover - LIGHT.orbIdle) +
      a * (LIGHT.orbClick - LIGHT.orbIdle) +
      pulse * ORB.heartbeatLight +
      level * (LIGHT.orbHover - LIGHT.orbIdle) * 0.35
    lightIntensity.current = THREE.MathUtils.damp(lightIntensity.current, lightTarget, 4, d)
    const li =
      lightIntensity.current + Math.sin(t * 2.2) * 0.12 * motionScale
    if (light.current) {
      light.current.intensity = li
    }
    // Normalized intensity for environment shader (relative to idle)
    scanUniforms.uOrbIntensity.value = Math.min(1.4, li / Math.max(LIGHT.orbIdle, 0.01) * 0.65)
  })

  const particleCount = reducedMotion ? PARTICLES.reducedCount : PARTICLES.count

  return (
    <group ref={group} position={[0, ORB.baseY, 0]}>
      {/* Invisible interaction proxy — preserves hit testing */}
      <mesh
        material={hitMat}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
          setHover(true)
        }}
        onPointerOut={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'default'
          setHover(false)
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (!locked) triggerActivation()
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <sphereGeometry args={[ORB.radius * 1.05, 24, 24]} />
      </mesh>

      <points geometry={geometry} material={material} frustumCulled={false} />

      <pointLight
        ref={light}
        color={PALETTE.orbMid}
        intensity={LIGHT.orbIdle}
        distance={LIGHT.orbDistance}
        decay={LIGHT.orbDecay}
        castShadow={false}
      />

      <OrbParticles ref={particles} count={particleCount} />
    </group>
  )
}
