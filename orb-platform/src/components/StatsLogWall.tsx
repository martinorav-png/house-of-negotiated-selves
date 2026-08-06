import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ROOM, STATS_SCREEN, PALETTE } from '../config'
import { scanUniforms } from '../lib/scanUniforms'
import { audioLevels } from '../lib/audioLevels'
import { getMirrorPromptText } from '../lib/mirrorPrompt'
import {
  liquidMirrorFragmentShader,
  liquidMirrorVertexShader,
  mirrorGlowFragmentShader,
  mirrorGlowVertexShader,
} from '../shaders/liquidMirrorShaders'

export function StatsLogWall({
  questionText,
  submitSerial,
}: {
  questionText: string
  submitSerial: number
}) {
  const questionStart = useRef(0)
  const lastQuestionText = useRef(questionText)
  const lastSubmitSerial = useRef(submitSerial)
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
    texture.premultiplyAlpha = true
    return { canvas, ctx, texture }
  }, [])

  const mirrorUniforms = useMemo(
    () => ({
      uMap: { value: texture },
      uTime: scanUniforms.uTime,
      uActivity: { value: 0.45 },
      uDeepColor: { value: new THREE.Color('#111b18') },
      uSheenColor: { value: new THREE.Color('#b8d6c4') },
      uWarmColor: { value: new THREE.Color('#d0b17f') },
    }),
    [texture],
  )

  const panelMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: liquidMirrorVertexShader,
        fragmentShader: liquidMirrorFragmentShader,
        uniforms: mirrorUniforms,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    [mirrorUniforms],
  )

  const backMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#050806',
        transparent: true,
        opacity: 0.55,
        toneMapped: false,
      }),
    [],
  )

  const glowMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: mirrorGlowVertexShader,
        fragmentShader: mirrorGlowFragmentShader,
        uniforms: {
          uColor: { value: new THREE.Color('#b8d6c4') },
          uOpacity: { value: 0.16 },
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
        vertexShader: mirrorGlowVertexShader,
        fragmentShader: mirrorGlowFragmentShader,
        uniforms: {
          uColor: { value: new THREE.Color(PALETTE.orbAccent) },
          uOpacity: { value: 0.08 },
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
      backMat.dispose()
      glowMat.dispose()
      glowNearMat.dispose()
    }
  }, [texture, panelMat, backMat, glowMat, glowNearMat])

  const draw = (elapsedTime: number) => {
    const w = canvas.width
    const h = canvas.height
    const activity = Math.min(
      1,
      scanUniforms.uActivation.value * 0.55 +
        scanUniforms.uHover.value * 0.18 +
        audioLevels.level * 0.22,
    )
    const cursorVisible = Math.floor(elapsedTime * 2.2) % 2 === 0
    const prompt = getMirrorPromptText(
      questionText,
      elapsedTime - questionStart.current,
      18,
      cursorVisible,
    )

    ctx.clearRect(0, 0, w, h)
    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '500 42px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
    ctx.shadowColor = 'rgba(190, 220, 202, 0.55)'
    ctx.shadowBlur = 18 + activity * 10
    ctx.fillStyle = `rgba(218, 232, 220, ${0.78 + activity * 0.14})`
    ctx.fillText(prompt, w / 2, h / 2)
    ctx.shadowBlur = 0
    ctx.fillStyle = `rgba(205, 178, 132, ${0.16 + activity * 0.08})`
    ctx.fillText(prompt, w / 2 + 1.5, h / 2 + 1.5)
    ctx.restore()

    texture.needsUpdate = true
  }

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (
      questionText !== lastQuestionText.current ||
      submitSerial !== lastSubmitSerial.current
    ) {
      lastQuestionText.current = questionText
      lastSubmitSerial.current = submitSerial
      questionStart.current = t
    }

    draw(t)

    const activity = Math.min(
      1,
      0.38 +
        scanUniforms.uActivation.value * 0.28 +
        scanUniforms.uHover.value * 0.12 +
        audioLevels.level * 0.2,
    )

    mirrorUniforms.uActivity.value = activity

    const spill = 0.5 + activity * 0.55
    scanUniforms.uScreenIntensity.value = spill
    ;(glowMat.uniforms.uOpacity as { value: number }).value = 0.08 + activity * 0.12
    ;(glowNearMat.uniforms.uOpacity as { value: number }).value = 0.04 + activity * 0.08

    if (lightRef.current) lightRef.current.intensity = 2.2 + activity * 3.2
    if (spotRef.current) spotRef.current.intensity = 5 + activity * 7
  })

  const halfD = ROOM.depth / 2
  const z = -halfD + STATS_SCREEN.zOffset
  const { width, height, y } = STATS_SCREEN
  const backing = 0.12

  useEffect(() => {
    spotTarget.position.set(0, y - 0.25, z + 3.4)
    spotTarget.updateMatrixWorld()
  }, [spotTarget, y, z])

  return (
    <group position={[0, y, z]}>
      <mesh material={backMat} position={[0, 0, -0.035]}>
        <planeGeometry args={[width + backing * 2, height + backing * 2]} />
      </mesh>

      <mesh material={panelMat} position={[0, 0, 0]}>
        <planeGeometry args={[width, height, 48, 28]} />
      </mesh>

      <mesh material={glowNearMat} position={[0, 0, 0.05]} scale={[1.03, 1.05, 1]}>
        <planeGeometry args={[width, height]} />
      </mesh>
      <mesh material={glowMat} position={[0, 0, 0.55]} scale={[1.42, 1.46, 1]}>
        <planeGeometry args={[width, height]} />
      </mesh>

      <pointLight
        ref={lightRef}
        color="#b8d6c4"
        intensity={3}
        distance={9}
        decay={1.55}
        position={[0, 0, 0.4]}
      />
      <primitive object={spotTarget} />
      <spotLight
        ref={spotRef}
        color="#d0b17f"
        intensity={7}
        distance={12}
        angle={0.85}
        penumbra={0.8}
        decay={1.4}
        position={[0, 0, 0.25]}
        target={spotTarget}
      />
    </group>
  )
}
