export type FaceBlendshapeCategory = {
  categoryName: string
  score: number
}

export type MirrorFaceSignals = {
  blink: number
  gazeX: number
  gazeY: number
  mouthOpen: number
  smile: number
  browLift: number
  headYaw: number
  headPitch: number
  headRoll: number
}

export const NEUTRAL_MIRROR_FACE_SIGNALS: MirrorFaceSignals = Object.freeze({
  blink: 0,
  gazeX: 0,
  gazeY: 0,
  mouthOpen: 0,
  smile: 0,
  browLift: 0,
  headYaw: 0,
  headPitch: 0,
  headRoll: 0,
})

const MAX_HEAD_ANGLE = Math.PI / 3

export function deriveMirrorFaceSignals(
  categories: FaceBlendshapeCategory[] = [],
  transformationMatrix?: number[],
): MirrorFaceSignals {
  const scores = new Map(
    categories.map(({ categoryName, score }) => [categoryName, clamp(score)]),
  )
  const score = (name: string) => scores.get(name) ?? 0
  const average = (...values: number[]) =>
    values.reduce((total, value) => total + value, 0) / values.length
  const head = deriveHeadPose(transformationMatrix)

  return {
    blink: average(score('eyeBlinkLeft'), score('eyeBlinkRight')),
    gazeX: clampSigned(
      average(score('eyeLookOutLeft'), score('eyeLookInRight')) -
        average(score('eyeLookInLeft'), score('eyeLookOutRight')),
    ),
    gazeY: clampSigned(
      average(score('eyeLookUpLeft'), score('eyeLookUpRight')) -
        average(score('eyeLookDownLeft'), score('eyeLookDownRight')),
    ),
    mouthOpen: score('jawOpen'),
    smile: average(score('mouthSmileLeft'), score('mouthSmileRight')),
    browLift: average(
      score('browInnerUp'),
      average(score('browOuterUpLeft'), score('browOuterUpRight')),
    ),
    ...head,
  }
}

function deriveHeadPose(matrix?: number[]) {
  if (
    !matrix ||
    matrix.length < 16 ||
    matrix.some((value) => !Number.isFinite(value))
  ) {
    return { headYaw: 0, headPitch: 0, headRoll: 0 }
  }

  const yaw = Math.atan2(matrix[8], matrix[10])
  const pitch = Math.atan2(-matrix[9], Math.hypot(matrix[8], matrix[10]))
  const roll = Math.atan2(matrix[4], matrix[0])

  return {
    headYaw: clampSigned(yaw / MAX_HEAD_ANGLE),
    headPitch: clampSigned(pitch / MAX_HEAD_ANGLE),
    headRoll: clampSigned(roll / MAX_HEAD_ANGLE),
  }
}

function clamp(value: number) {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0
}

function clampSigned(value: number) {
  if (!Number.isFinite(value) || value === 0) return 0
  return Math.min(1, Math.max(-1, value))
}
