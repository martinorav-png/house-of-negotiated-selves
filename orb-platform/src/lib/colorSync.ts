import * as THREE from 'three'

/** Avoid re-parsing the same hex string every frame. */
const lastHex = new WeakMap<THREE.Color, string>()

export function syncColor(color: THREE.Color, hex: string) {
  if (lastHex.get(color) === hex) return
  lastHex.set(color, hex)
  color.set(hex)
}
