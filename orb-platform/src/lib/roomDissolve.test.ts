import { describe, expect, it } from 'vitest'
import { ROOM } from '../config'
import {
  dissolveProgressForQuestion,
  dissolveYForProgress,
  shouldResetDissolve,
} from './roomDissolve'

describe('roomDissolve', () => {
  it('advances dissolve progress one step per entered question', () => {
    expect(dissolveProgressForQuestion(0, 8)).toBeCloseTo(0.125)
    expect(dissolveProgressForQuestion(3, 8)).toBeCloseTo(0.5)
    expect(dissolveProgressForQuestion(7, 8)).toBe(1)
  })

  it('maps progress to a top-to-bottom dissolve front', () => {
    expect(dissolveYForProgress(0)).toBeCloseTo(ROOM.height)
    expect(dissolveYForProgress(0.5)).toBeCloseTo(ROOM.height * 0.5)
    expect(dissolveYForProgress(1)).toBeCloseTo(0)
  })

  it('resets when the question cycle wraps back to the start', () => {
    expect(shouldResetDissolve(null, 0)).toBe(true)
    expect(shouldResetDissolve(0, 1)).toBe(false)
    expect(shouldResetDissolve(7, 0)).toBe(true)
  })
})
