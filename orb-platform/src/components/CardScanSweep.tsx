import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ROOM } from '../config'
import { rand } from '../lib/samplePoints'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { cardSettings } from '../dev/cardSettingsStore'

const SCAN_COUNT = 12000
const SCAN_REDUCED_COUNT = 4200
const SCAN_THICKNESS = 0.38
/** Past the station camera (z ≈ 7.4–8.6) so the sheet rides through the viewpoint. */
const SCAN_Z_NEAR = 11.2
const SCAN_Z_FAR = -ROOM.depth / 2 + 0.35

const vertexShader = /* glsl */ `
uniform float uTime;
uniform float uScanZ;
uniform float uPointScale;
uniform float uThickness;
uniform float uPixelRatio;
uniform float uReducedMotion;

attribute float aSeed;
attribute float aSize;
attribute float aBrightness;
attribute float aWallBias;

varying float vAlpha;
varying float vBright;
varying float vSeed;

void main() {
  vSeed = aSeed;
  vec3 pos = position;
  float motion = mix(1.0, 0.2, uReducedMotion);
  float drift = sin(uTime * (0.7 + aSeed * 1.1) + aSeed * 40.0);
  pos.x += drift * 0.04 * motion;
  pos.y += cos(uTime * (0.55 + aSeed * 0.8) + aSeed * 17.0) * 0.03 * motion;
  pos.z += drift * uThickness * 0.15 * motion;
  pos.z += uScanZ;

  float wall = clamp(aWallBias, 0.0, 1.0);
  float band = 1.0 - smoothstep(0.0, uThickness * 0.55, abs(position.z));
  band = pow(max(band, 0.0), 1.25);

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  float distScale = 130.0 / max(0.1, -mvPosition.z);
  float sizeBoost = 0.8 + wall * 0.7 + band * 0.55;
  gl_PointSize = aSize * uPointScale * uPixelRatio * distScale * sizeBoost;
  gl_PointSize = clamp(gl_PointSize, 0.6, 8.0);

  vBright = aBrightness * (0.75 + wall * 0.55 + band * 0.5);
  vAlpha = band * mix(0.2, 0.95, wall) * (0.55 + aBrightness * 0.45);
  gl_Position = projectionMatrix * mvPosition;
}
`

const fragmentShader = /* glsl */ `
uniform vec3 uColor;
varying float vAlpha;
varying float vBright;
varying float vSeed;

void main() {
  vec2 c = gl_PointCoord - vec2(0.5);
  float r = length(c);
  if (r > 0.5) discard;
  float soft = smoothstep(0.5, 0.22, r);
  float tone = fract(vSeed * 11.3);
  vec3 core = uColor;
  vec3 rim = uColor * 0.87;
  vec3 col = mix(rim, core, tone) * vBright;
  float alpha = soft * vAlpha;
  if (alpha < 0.02) discard;
  gl_FragColor = vec4(col, alpha);
}
`

/**
 * White LiDAR scan sheet for station 2 — replaces the GridScan beam.
 * Ping-pongs along room depth on the same duration as the room ripple.
 */
export function CardScanSweep() {
  const reducedMotion = usePrefersReducedMotion()

  const geometry = useMemo(() => {
    const count = reducedMotion ? SCAN_REDUCED_COUNT : SCAN_COUNT
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    const sizes = new Float32Array(count)
    const brightness = new Float32Array(count)
    const wallBias = new Float32Array(count)
    const halfW = ROOM.width * 0.5
    const height = ROOM.height

    for (let i = 0; i < count; i++) {
      const mode = rand(i, 1)
      let x = 0
      let y = 0
      let wall = 0

      if (mode < 0.28) {
        // Floor band
        x = (rand(i, 2) * 2 - 1) * halfW
        y = rand(i, 3) * 0.22
        wall = 0.9
      } else if (mode < 0.48) {
        // Ceiling band
        x = (rand(i, 4) * 2 - 1) * halfW
        y = height - rand(i, 5) * 0.22
        wall = 0.85
      } else if (mode < 0.68) {
        // Left wall
        x = -halfW + rand(i, 6) * 0.2
        y = rand(i, 7) * height
        wall = 1
      } else if (mode < 0.88) {
        // Right wall
        x = halfW - rand(i, 8) * 0.2
        y = rand(i, 9) * height
        wall = 1
      } else {
        // Interior sheet fill
        x = (rand(i, 10) * 2 - 1) * halfW * 0.9
        y = rand(i, 11) * height
        const edge = Math.max(Math.abs(x) / halfW, Math.abs(y / height - 0.5) * 2)
        wall = THREE.MathUtils.smoothstep(edge, 0.45, 1) * 0.55
      }

      const z = (rand(i, 12) - 0.5) * SCAN_THICKNESS
      positions[i * 3] = x
      positions[i * 3 + 1] = y
      positions[i * 3 + 2] = z
      seeds[i] = rand(i, 13)
      sizes[i] = 0.85 + rand(i, 14) * (1.35 + wall)
      brightness[i] = 0.45 + rand(i, 15) * 0.55
      wallBias[i] = wall
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('aBrightness', new THREE.BufferAttribute(brightness, 1))
    geo.setAttribute('aWallBias', new THREE.BufferAttribute(wallBias, 1))
    geo.computeBoundingSphere()
    return geo
  }, [reducedMotion])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uScanZ: { value: SCAN_Z_NEAR },
          uPointScale: { value: cardSettings.scan.pointScale },
          uThickness: { value: cardSettings.scan.thickness },
          uPixelRatio: { value: 1 },
          uReducedMotion: { value: reducedMotion ? 1 : 0 },
          uColor: { value: new THREE.Color(cardSettings.scan.color) },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [reducedMotion],
  )

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame((state) => {
    const cycle = Math.max(0.05, cardSettings.scan.cycleDuration)
    const t2 = state.clock.elapsedTime % (cycle * 2)
    // Triangle wave 0→1→0, then ease-in-out-back so turnarounds settle with a bounce.
    const linear = t2 < cycle ? t2 / cycle : 1 - (t2 - cycle) / cycle
    const c1 = 1.70158
    const c2 = c1 * 1.525
    const phase =
      linear < 0.5
        ? (Math.pow(2 * linear, 2) * ((c2 + 1) * 2 * linear - c2)) / 2
        : (Math.pow(2 * linear - 2, 2) * ((c2 + 1) * (linear * 2 - 2) + c2) + 2) / 2
    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uScanZ.value = THREE.MathUtils.lerp(SCAN_Z_NEAR, SCAN_Z_FAR, phase)
    material.uniforms.uPixelRatio.value = state.gl.getPixelRatio()
    material.uniforms.uReducedMotion.value = reducedMotion ? 1 : 0
    material.uniforms.uPointScale.value = cardSettings.scan.pointScale
    material.uniforms.uThickness.value = cardSettings.scan.thickness
    material.uniforms.uColor.value.set(cardSettings.scan.color)
  })

  return <points geometry={geometry} material={material} frustumCulled={false} />
}
