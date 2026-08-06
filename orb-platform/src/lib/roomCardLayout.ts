export type RoomCardTransform = {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: number
  opacity: number
}

export function getRoomCardLayout(index: number, total: number): RoomCardTransform {
  const last = Math.max(1, total - 1)
  const progress = index / last
  const x = -2.25 + progress * 4.5
  const y = 2.55 - progress * 0.44
  const z = -2.35 - index * 0.16
  const yaw = 0.34 - progress * 0.68
  const roll = -0.12 + progress * 0.08

  return {
    position: [x, y, z],
    rotation: [-0.08, yaw, roll],
    scale: 0.86 - progress * 0.1,
    opacity: 0.52 - progress * 0.16,
  }
}

export function getRoomServedCardTransform(index: number, total: number): RoomCardTransform {
  const last = Math.max(1, total - 1)
  const progress = index / last

  return {
    position: [-0.2 + (progress - 0.5) * 0.28, 2.42, -1.08],
    rotation: [-0.03, (progress - 0.5) * 0.12, -0.025],
    scale: 1.08,
    opacity: 0.9,
  }
}
