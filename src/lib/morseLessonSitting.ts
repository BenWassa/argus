export const LESSON_RETRIEVAL_TARGET = 10

export interface LessonSitting {
  retrievals: number
  correct: number
  /** Runtime-only unique item ids missed during this sitting. */
  revisitItemIds: string[]
}

export function newLessonSitting(): LessonSitting {
  return { retrievals: 0, correct: 0, revisitItemIds: [] }
}

export function lessonSittingComplete(sitting: LessonSitting): boolean {
  return sitting.retrievals >= LESSON_RETRIEVAL_TARGET
}

export function lessonSittingRemaining(sitting: LessonSitting): number {
  return Math.max(0, LESSON_RETRIEVAL_TARGET - sitting.retrievals)
}

/**
 * One answered formative retrieval earns one session point, regardless of
 * correctness. Correctness still belongs to the acquisition policy: it fades or
 * restores support and decides what returns later. The point only says that one
 * finite unit of this sitting has been completed.
 *
 * This value is deliberately runtime-only. It is never written to Topic,
 * scheduler state, cue evidence, export/import data or a global XP balance.
 */
export function recordLessonRetrieval(
  sitting: LessonSitting,
  itemId: string,
  correct: boolean,
): LessonSitting {
  if (lessonSittingComplete(sitting)) return sitting

  const revisitItemIds = correct || sitting.revisitItemIds.includes(itemId)
    ? sitting.revisitItemIds
    : [...sitting.revisitItemIds, itemId]

  return {
    retrievals: sitting.retrievals + 1,
    correct: sitting.correct + (correct ? 1 : 0),
    revisitItemIds,
  }
}
