import type { MorseLessonSittingProgress, Topic } from './types'

export const LESSON_RETRIEVAL_TARGET = 10
export type LessonSitting = MorseLessonSittingProgress

export function newLessonSitting(): LessonSitting {
  return { retrievals: 0, correct: 0, revisitItemIds: [] }
}

/** Resume the current finite sitting, or start fresh for older records. */
export function lessonSittingOf(topic: Pick<Topic, 'lessonSitting'>): LessonSitting {
  const sitting = topic.lessonSitting
  if (!sitting) return newLessonSitting()
  return {
    retrievals: sitting.retrievals,
    correct: sitting.correct,
    revisitItemIds: [...sitting.revisitItemIds],
  }
}

/** Persist formative sitting bookkeeping without touching any formal evidence. */
export function withLessonSitting(topic: Topic, sitting: LessonSitting): Topic {
  const current = topic.lessonSitting
  const unchanged =
    current !== undefined &&
    current.retrievals === sitting.retrievals &&
    current.correct === sitting.correct &&
    current.revisitItemIds.length === sitting.revisitItemIds.length &&
    current.revisitItemIds.every((itemId, index) => itemId === sitting.revisitItemIds[index])
  if (unchanged) return topic
  return {
    ...topic,
    lessonSitting: {
      retrievals: sitting.retrievals,
      correct: sitting.correct,
      revisitItemIds: [...sitting.revisitItemIds],
    },
  }
}

export function lessonSittingComplete(sitting: LessonSitting): boolean {
  return sitting.retrievals >= LESSON_RETRIEVAL_TARGET
}

export function lessonSittingRemaining(sitting: LessonSitting): number {
  return Math.max(0, LESSON_RETRIEVAL_TARGET - sitting.retrievals)
}

/**
 * One answered formative retrieval earns one sitting point, regardless of
 * correctness. Correctness still belongs to the acquisition policy: it fades or
 * restores support and decides what returns later. The durable sitting field
 * says only how far through this finite Learn sitting the learner has progressed.
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
