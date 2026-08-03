import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ROOM, STATS_SCREEN, PALETTE } from '../config'
import { scanUniforms } from '../lib/scanUniforms'
import { audioLevels } from '../lib/audioLevels'
import { createBootLines, createLogLine, type LogLine } from '../lib/statsLog'
import { drawGlitchedText, tickGlitch } from '../lib/textGlitch'
import {
  crtVertexShader,
  crtFragmentShader,
  screenGlowVertexShader,
  screenGlowFragmentShader,
} from '../shaders/crtScreenShaders'

/**
 * Faux CRT TV / stats log on the back wall.
 * Canvas content + CRT shader (scanlines, CA, flicker) + additive glow that spills into the room.
 */
export function StatsLogWall() {
  const linesRef = useRef<LogLine[]>(createBootLines())
  const lastPush = useRef(0)
  const scanY = useRef(0)
  const glitchClock = useRef({ nextAt: 1.2, holdUntil: 0, seed: 0 })
  const lightRef = useRef<THREE.PointLight>(null)
  const spotRef = useRef<THREE.SpotLight>(null)
  const spotTarget = useMemo(() => new THREE.Object3D(), [])

  const { canvas, ctx, texture } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = STATS_SCREEN.textureWidth
    canvas.height = STATS_SCREEN.textureHeight
    const ctx = canvas.getContext('2d')!
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    return { canvas, ctx, texture }
  }, [])

  const crtUniforms = useMemo(
    () => ({
      uMap: { value: texture },
      uTime: scanUniforms.uTime,
      uGlow: { value: 0.55 },
      uAberration: { value: 0.0011 },
    }),
    [texture],
  )

  const panelMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: crtVertexShader,
        fragmentShader: crtFragmentShader,
        uniforms: crtUniforms,
        toneMapped: false,
      }),
    [crtUniforms],
  )

  const bezelMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#07090c',
        toneMapped: false,
      }),
    [],
  )

  const glowMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: screenGlowVertexShader,
        fragmentShader: screenGlowFragmentShader,
        uniforms: {
          uColor: { value: new THREE.Color(PALETTE.orbMid) },
          uOpacity: { value: 0.22 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    [],
  )

  const glowNearMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: screenGlowVertexShader,
        fragmentShader: screenGlowFragmentShader,
        uniforms: {
          uColor: { value: new THREE.Color(PALETTE.orbAccent) },
          uOpacity: { value: 0.14 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        side: THREE.DoubleSide,
      }),
    [],
  )

  useEffect(() => {
    return () => {
      texture.dispose()
      panelMat.dispose()
      bezelMat.dispose()
      glowMat.dispose()
      glowNearMat.dispose()
    }
  }, [texture, panelMat, bezelMat, glowMat, glowNearMat])

  const draw = (glitchAmount = 0) => {
    const w = canvas.width
    const h = canvas.height
    const activity = Math.min(
      1,
      scanUniforms.uActivation.value * 0.7 +
        scanUniforms.uHover.value * 0.25 +
        audioLevels.level * 0.45,
    )

    const lines = linesRef.current
    const line = lines[lines.length - 1]
    if (!line) {
      ctx.fillStyle = '#04060a'
      ctx.fillRect(0, 0, w, h)
      texture.needsUpdate = true
      return
    }

    const colors = {
      info: `rgba(150, 175, 195, ${0.9})`,
      data: `rgba(160, 225, 255, ${0.85 + activity * 0.15})`,
      warn: 'rgba(235, 185, 125, 0.95)',
      ok: 'rgba(155, 230, 185, 0.95)',
    } as const

    const glitch = {
      amount: glitchAmount,
      tear: (Math.random() - 0.5) * 24 * glitchAmount,
      tearY: 0.35 + Math.random() * 0.3,
      tearH: 0.06 + Math.random() * 0.1,
    }

    drawGlitchedText(ctx, canvas, line.text, {
      opacity: 0.95,
      color: colors[line.kind],
      font: '600 48px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      glitch,
      clear: '#04060a',
    })

    // Soft travelling scan — keeps CRT feel without chrome
    scanY.current = (scanY.current + 1.2) % h
    ctx.fillStyle = `rgba(120, 210, 255, ${0.06 + activity * 0.08})`
    ctx.fillRect(40, scanY.current, w - 80, 2)

    texture.needsUpdate = true
  }

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (t - lastPush.current > STATS_SCREEN.lineIntervalMs / 1000) {
      lastPush.current = t
      const next = createLogLine()
      const lines = linesRef.current
      lines.push(next)
      while (lines.length > STATS_SCREEN.maxVisibleLines) {
        lines.shift()
      }
      // Fresh line often arrives with a small glitch sting
      glitchClock.current.holdUntil = t + 0.12
      glitchClock.current.seed = Math.random()
    }

    const g = tickGlitch(glitchClock.current, t, audioLevels.level * 0.5)
    draw(g.amount)

    const activity = Math.min(
      1,
      0.55 +
        scanUniforms.uActivation.value * 0.35 +
        scanUniforms.uHover.value * 0.15 +
        audioLevels.level * 0.4,
    )

    crtUniforms.uGlow.value = 0.45 + activity * 0.55
    crtUniforms.uAberration.value = 0.0009 + activity * 0.0005 + g.amount * 0.0025

    const spill = 0.85 + activity * 0.9
    scanUniforms.uScreenIntensity.value = spill
    ;(glowMat.uniforms.uOpacity as { value: number }).value = 0.16 + activity * 0.14
    ;(glowNearMat.uniforms.uOpacity as { value: number }).value = 0.1 + activity * 0.1

    if (lightRef.current) lightRef.current.intensity = 4 + activity * 5
    if (spotRef.current) spotRef.current.intensity = 10 + activity * 12
  })

  const halfD = ROOM.depth / 2
  const z = -halfD + STATS_SCREEN.zOffset
  const { width, height, y } = STATS_SCREEN
  const bezel = 0.1

  useEffect(() => {
    spotTarget.position.set(0, y - 0.3, z + 3.5)
    spotTarget.updateMatrixWorld()
  }, [spotTarget, y, z])

  return (
    <group position={[0, y, z]}>
      <mesh material={bezelMat} position={[0, 0, -0.025]}>
        <planeGeometry args={[width + bezel * 2, height + bezel * 2]} />
      </mesh>

      <mesh material={panelMat} position={[0, 0, 0]}>
        <planeGeometry args={[width, height]} />
      </mesh>

      <mesh material={glowNearMat} position={[0, 0, 0.04]} scale={[1.06, 1.08, 1]}>
        <planeGeometry args={[width, height]} />
      </mesh>
      <mesh material={glowMat} position={[0, 0, 0.35]} scale={[1.35, 1.4, 1]}>
        <planeGeometry args={[width, height]} />
      </mesh>
      <mesh material={glowMat} position={[0, 0, 1.1]} scale={[1.7, 1.75, 1]}>
        <planeGeometry args={[width, height]} />
      </mesh>

      <pointLight
        ref={lightRef}
        color={PALETTE.orbMid}
        intensity={5}
        distance={10}
        decay={1.5}
        position={[0, 0, 0.45]}
      />
      <primitive object={spotTarget} />
      <spotLight
        ref={spotRef}
        color={PALETTE.orbAccent}
        intensity={12}
        distance={14}
        angle={0.9}
        penumbra={0.7}
        decay={1.35}
        position={[0, 0, 0.25]}
        target={spotTarget}
      />
    </group>
  )
}
