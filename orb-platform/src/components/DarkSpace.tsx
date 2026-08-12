import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { settings } from '../dev/settingsStore'
import { syncColor } from '../lib/colorSync'

/**
 * Distant fallback void — sand/rust glow low-center, near-black otherwise.
 * Always faces the camera at a fixed distance, behind the real room geometry
 * (SpaceRoom), so wide parallax swings never reveal an edge.
 */
const vertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = /* glsl */ `
uniform float uTime;
uniform vec3 uBaseColor;
uniform vec3 uLiftColor;
uniform float uSaturation;
uniform float uGrainAmount;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec2 uv = vUv;
  vec2 c = uv - vec2(0.5, 0.32);
  float d = length(c * vec2(1.0, 1.15));

  // Values below are in "intended on-screen" terms; converted to linear
  // at the end so the renderer's sRGB output pass lands on these tones.
  vec3 base = uBaseColor;
  vec3 lift = uLiftColor;

  float glow = smoothstep(0.82, 0.0, d);
  vec3 col = mix(base, lift, glow * 0.7);

  float vignette = smoothstep(1.0, 0.2, length(uv - 0.5));
  col *= mix(0.45, 1.0, vignette);

  float grain = hash(gl_FragCoord.xy + fract(uTime) * 131.0) - 0.5;
  col += grain * uGrainAmount;
  col = max(col, 0.0);

  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(luma), col, uSaturation);
  col = max(col, 0.0);

  col = pow(col, vec3(2.2));

  gl_FragColor = vec4(col, 1.0);
}
`

export function DarkSpace() {
  const mesh = useRef<THREE.Mesh>(null)
  const { camera } = useThree()

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uBaseColor: { value: new THREE.Color(settings.darkspace.baseColor) },
          uLiftColor: { value: new THREE.Color(settings.darkspace.liftColor) },
          uSaturation: { value: settings.darkspace.saturation },
          uGrainAmount: { value: settings.darkspace.grain },
        },
        depthWrite: false,
        depthTest: false,
        toneMapped: false,
      }),
    [],
  )

  useFrame((state) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
    syncColor(material.uniforms.uBaseColor.value, settings.darkspace.baseColor)
    syncColor(material.uniforms.uLiftColor.value, settings.darkspace.liftColor)
    material.uniforms.uSaturation.value = settings.darkspace.saturation
    material.uniforms.uGrainAmount.value = settings.darkspace.grain
    if (mesh.current) {
      mesh.current.position.copy(camera.position)
      mesh.current.quaternion.copy(camera.quaternion)
      mesh.current.translateZ(-22)
    }
  })

  return (
    <mesh ref={mesh} renderOrder={-10} material={material} frustumCulled={false}>
      <planeGeometry args={[100, 70]} />
    </mesh>
  )
}
