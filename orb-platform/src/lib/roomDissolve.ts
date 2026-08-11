import { ROOM } from '../config'

/**
 * Top-to-bottom room dissolve driven by the orb question cycle.
 * Progress 0 = fully solid (front at ceiling). Progress 1 = fully particle
 * (front at floor). Each entered question advances one equal step.
 */
export function dissolveProgressForQuestion(
  questionIndex: number,
  questionCount: number,
): number {
  if (questionCount <= 0) return 0
  const clampedIndex = Math.max(0, Math.min(questionIndex, questionCount - 1))
  return (clampedIndex + 1) / questionCount
}

/** World-Y of the dissolve front. Points / solid above this become particles. */
export function dissolveYForProgress(progress: number, roomHeight = ROOM.height): number {
  const p = Math.min(1, Math.max(0, progress))
  return roomHeight * (1 - p)
}

export function shouldResetDissolve(
  previousIndex: number | null,
  nextIndex: number,
): boolean {
  if (previousIndex === null) return true
  return nextIndex < previousIndex
}
