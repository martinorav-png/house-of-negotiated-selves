import { describe, expect, it } from 'vitest'
import {
  deriveMirrorFaceSignals,
  NEUTRAL_MIRROR_FACE_SIGNALS,
} from './mirrorFaceSignals'

describe('deriveMirrorFaceSignals', () => {
  it('returns neutral, finite signals when tracking data is missing', () => {
    expect(deriveMirrorFaceSignals()).toEqual(NEUTRAL_MIRROR_FACE_SIGNALS)
    expect(deriveMirrorFaceSignals([], [Number.NaN])).toEqual(
      NEUTRAL_MIRROR_FACE_SIGNALS,
    )
  })

  it('combines bilateral expression categories into stable UI signals', () => {
    const result = deriveMirrorFaceSignals([
      { categoryName: 'eyeBlinkLeft', score: 0.8 },
      { categoryName: 'eyeBlinkRight', score: 0.4 },
      { categoryName: 'jawOpen', score: 0.7 },
      { categoryName: 'mouthSmileLeft', score: 0.5 },
      { categoryName: 'mouthSmileRight', score: 0.9 },
      { categoryName: 'browInnerUp', score: 0.6 },
      { categoryName: 'browOuterUpLeft', score: 0.3 },
      { categoryName: 'browOuterUpRight', score: 0.9 },
    ])

    expect(result.blink).toBeCloseTo(0.6)
    expect(result.mouthOpen).toBeCloseTo(0.7)
    expect(result.smile).toBeCloseTo(0.7)
    expect(result.browLift).toBeCloseTo(0.6)
  })

  it('derives signed gaze from opposing eye directions', () => {
    const result = deriveMirrorFaceSignals([
      { categoryName: 'eyeLookOutLeft', score: 0.8 },
      { categoryName: 'eyeLookInRight', score: 0.6 },
      { categoryName: 'eyeLookUpLeft', score: 0.7 },
      { categoryName: 'eyeLookUpRight', score: 0.5 },
      { categoryName: 'eyeLookDownLeft', score: 0.1 },
      { categoryName: 'eyeLookDownRight', score: 0.1 },
    ])

    expect(result.gazeX).toBeCloseTo(0.7)
    expect(result.gazeY).toBeCloseTo(0.5)
  })

  it('normalizes head pose from a column-major transformation matrix', () => {
    const identity = [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]
    const yawThirtyDegrees = Math.PI / 6
    const c = Math.cos(yawThirtyDegrees)
    const s = Math.sin(yawThirtyDegrees)
    const yawMatrix = [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ]

    expect(deriveMirrorFaceSignals([], identity)).toMatchObject({
      headYaw: 0,
      headPitch: 0,
      headRoll: 0,
    })
    expect(deriveMirrorFaceSignals([], yawMatrix).headYaw).toBeCloseTo(0.5)
  })
})
