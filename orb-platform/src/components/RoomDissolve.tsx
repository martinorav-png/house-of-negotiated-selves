import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ROOM, ROOM_DISSOLVE } from '../config'
import { scanUniforms } from '../lib/scanUniforms'
import {
  dissolveProgressForQuestion,
  dissolveYForProgress,
  shouldResetDissolve,
} from '../lib/roomDissolve'
import { QUESTIONS } from '../lib/questions'
import { rand } from '../lib/samplePoints'
import { useOrbContext } from '../context/OrbContext'

/**
 * Advances the shared dissolve front one step each time a new orb question
 * is entered. Resets when the question cycle wraps.
 */
export function RoomDissolveController({ questionIndex }: { questionIndex: number }) {
  const { reducedMotion } = useOrbContext()
  const targetY = useRef(ROOM.height as number)
  const previousIndex = useRef<number | null>(null)

  useEffect(() => {
    if (shouldResetDissolve(previousIndex.current, questionIndex)) {
      scanUniforms.uDissolveY.value = ROOM.height
      scanUniforms.uDissolveFill.value = 0
    }
    previousIndex.current = questionIndex
    const progress = dissolveProgressForQuestion(questionIndex, QUESTIONS.length)
    targetY.current = dissolveYForProgress(progress)
  }, [questionIndex])

  useFrame((_, delta) => {
    const damp = reducedMotion ? ROOM_DISSOLVE.reducedDamp : ROOM_DISSOLVE.damp
    scanUniforms.uDissolveSoft.value = ROOM_DISSOLVE.soft
    scanUniforms.uDissolveY.value = THREE.MathUtils.damp(
      scanUniforms.uDissolveY.value,
      targetY.current,
      damp,
      delta,
    )
    scanUniforms.uDissolveFill.value = THREE.MathUtils.clamp(
      1 - scanUniforms.uDissolveY.value / ROOM.height,
      0,
      1,
    )
  })

  return null
}

const dustVertexShader = /* glsl */ `
uniform float uTime;
uniform float uDissolveY;
uniform float uDissolveSoft;
uniform float uDissolveFill;
uniform float uDustStrength;
uniform float uPointScale;
uniform float uReducedMotion;

attribute float aSeed;
attribute float aSize;
attribute float aBrightness;

varying float vAlpha;
varying float vBright;

void main() {
  vec3 pos = position;
  float soft = max(uDissolveSoft, 0.05);
  float dissolved = smoothstep(uDissolveY - soft, uDissolveY + soft, pos.y);
  float fill = uDissolveFill * uDustStrength;
  if (dissolved * fill < 0.02) {
    gl_PointSize = 0.0;
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0;
    vBright = 0.0;
    return;
  }

  float motion = mix(1.0, 0.15, uReducedMotion);
  float t = uTime * (0.12 + aSeed * 0.2);
  pos.x += sin(t + aSeed * 40.0) * 0.08 * motion;
  pos.y += cos(t * 0.85 + aSeed * 18.0) * 0.05 * motion;
  pos.z += sin(t * 0.7 + aSeed * 27.0) * 0.08 * motion;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  float distScale = 110.0 / max(0.1, -mvPosition.z);
  gl_PointSize = aSize * uPointScale * distScale * (0.7 + fill);
  gl_PointSize = clamp(gl_PointSize, 0.4, 5.5);

  vBright = aBrightness * (0.35 + fill * 0.9);
  vAlpha = dissolved * fill * (0.22 + aBrightness * 0.35);
  gl_Position = projectionMatrix * mvPosition;
}
`

const dustFragmentShader = /* glsl */ `
uniform vec3 uColor;
varying float vAlpha;
varying float vBright;

void main() {
  vec2 c = gl_PointCoord - vec2(0.5);
  float r = length(c);
  if (r > 0.5) discard;
  float soft = smoothstep(0.5, 0.2, r);
  float alpha = soft * vAlpha;
  if (alpha < 0.015) discard;
  gl_FragColor = vec4(uColor * vBright, alpha);
}
`

/**
 * Sparse volume dust that fills the void left by dissolved walls —
 * denser / brighter as more questions are answered.
 */
export function DissolvingRoomDust() {
  const { reducedMotion } = useOrbContext()

  const geometry = useMemo(() => {
    const count = reducedMotion ? ROOM_DISSOLVE.dustReducedCount : ROOM_DISSOLVE.dustCount
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    const sizes = new Float32Array(count)
    const brightness = new Float32Array(count)
    const halfW = ROOM.width * 0.46
    const halfD = ROOM.depth * 0.46

    for (let i = 0; i < count; i++) {
      // Bias toward upper volume so early dissolve steps already feel populated.
      const yBias = Math.pow(rand(i, 1), 0.55)
      positions[i * 3] = (rand(i, 2) * 2 - 1) * halfW
      positions[i * 3 + 1] = yBias * ROOM.height
      positions[i * 3 + 2] = (rand(i, 3) * 2 - 1) * halfD
      seeds[i] = rand(i, 4)
      sizes[i] = 0.7 + rand(i, 5) * 1.6
      brightness[i] = 0.35 + rand(i, 6) * 0.65
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('aBrightness', new THREE.BufferAttribute(brightness, 1))
    geo.computeBoundingSphere()
    return geo
  }, [reducedMotion])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: dustVertexShader,
        fragmentShader: dustFragmentShader,
        uniforms: {
          uTime: scanUniforms.uTime,
          uDissolveY: scanUniforms.uDissolveY,
          uDissolveSoft: scanUniforms.uDissolveSoft,
          uDissolveFill: scanUniforms.uDissolveFill,
          uDustStrength: { value: ROOM_DISSOLVE.dustStrength },
          uPointScale: { value: 0.22 },
          uReducedMotion: scanUniforms.uReducedMotion,
          uColor: { value: new THREE.Color('#b9a585') },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.NormalBlending,
      }),
    [],
  )

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  return <points geometry={geometry} material={material} frustumCulled={false} />
}
