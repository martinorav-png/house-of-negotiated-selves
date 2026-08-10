import * as THREE from 'three'
import { ORB, PALETTE, ROOM, STATS_SCREEN } from '../config'

const screenZ = -ROOM.depth / 2 + STATS_SCREEN.zOffset

/**
 * Shared GPU uniforms — Orb writes each frame; environment shaders read the same objects.
 * Avoids React state for per-frame lighting / shockwave.
 */
export const scanUniforms = {
  uTime: { value: 0 },
  uOrbPosition: { value: new THREE.Vector3(0, ORB.baseY, 0) },
  uOrbColor: { value: new THREE.Color(PALETTE.orbMid) },
  uOrbIntensity: { value: 1 },
  uHover: { value: 0 },
  /** Idle heartbeat / ripple envelope 0–1 */
  uPulse: { value: 0 },
  uActivation: { value: 0 },
  /** Expanding shockwave distance from orb (world units) */
  uShockwave: { value: 0 },
  uReducedMotion: { value: 0 },
  /** Horizontal room scan plane Y */
  uScanY: { value: 0 },
  /** 0–1 — scan band only shows once the visitor starts typing an answer. */
  uScanActive: { value: 0 },
  /** Mic amplitude 0–1 */
  uAudio: { value: 0 },
  uAudioBass: { value: 0 },
  uAudioMid: { value: 0 },
  /** Back-wall CRT screen spill into room points */
  uScreenPosition: {
    value: new THREE.Vector3(0, STATS_SCREEN.y, screenZ),
  },
  uScreenColor: { value: new THREE.Color(PALETTE.orbMid) },
  // No CRT/text panel in the scene right now — keep the spill term inert.
  uScreenIntensity: { value: 0 },
  uScreenHalfSize: {
    value: new THREE.Vector2(STATS_SCREEN.width * 0.5, STATS_SCREEN.height * 0.5),
  },
}
