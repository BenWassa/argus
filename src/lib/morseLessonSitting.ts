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
    ...(sitting.listeningSuppressed ? { listeningSuppressed: true } : {}),
  }
}

/**
 * True for a sitting that has recorded nothing at all.
 *
 * A fresh sitting has exactly one durable representation — the absent field —
 * so an export never distinguishes "0/10 because it is new" from "0/10 because
 * something wrote zeroes", and an old v5 record with no field is byte-for-byte
 * the same learner state as a record whose sitting has just been reset.
 */
export function lessonSittingIsFresh(sitting: LessonSitting): boolean {
  return (
    sitting.retrievals === 0 &&
    sitting.correct === 0 &&
    sitting.revisitItemIds.length === 0 &&
    !sitting.listeningSuppressed
  )
}

function sameSitting(a: LessonSitting | undefined, b: LessonSitting): boolean {
  if (!a) return false
  return (
    a.retrievals === b.retrievals &&
    a.correct === b.correct &&
    Boolean(a.listeningSuppressed) === Boolean(b.listeningSuppressed) &&
    a.revisitItemIds.length === b.revisitItemIds.length &&
    a.revisitItemIds.every((itemId, index) => itemId === b.revisitItemIds[index])
  )
}

/**
 * Persist formative sitting bookkeeping without touching any formal evidence.
 *
 * Every other field is copied through verbatim, so a sitting write composes with
 * concurrent scheduler, cue-evidence and lesson-support writes rather than
 * reinstating a stale snapshot of them.
 */
export function withLessonSitting(topic: Topic, sitting: LessonSitting): Topic {
  if (lessonSittingIsFresh(sitting)) return withoutLessonSitting(topic)
  if (sameSitting(topic.lessonSitting, sitting)) return topic
  return {
    ...topic,
    lessonSitting: {
      retrievals: sitting.retrievals,
      correct: sitting.correct,
      revisitItemIds: [...sitting.revisitItemIds],
      ...(sitting.listeningSuppressed ? { listeningSuppressed: true } : {}),
    },
  }
}

/** Begin the next finite sitting. The canonical fresh sitting is no field. */
export function withoutLessonSitting(topic: Topic): Topic {
  if (topic.lessonSitting === undefined) return topic
  const { lessonSitting: _dropped, ...rest } = topic
  return rest
}

/**
 * Drop revisit ids for items an author has actually deleted.
 *
 * The counters stay as they are: those retrievals happened, and the sitting is
 * how far through a finite task the learner is, not a tally of the letters still
 * listed. Leaving a dead id in place would be worse than cosmetic — the storage
 * boundary rejects a sitting referencing an item its topic does not have, so an
 * unpruned edit would make the whole library unloadable on the next start.
 */
export function pruneLessonSitting(
  sitting: MorseLessonSittingProgress | undefined,
  items: { id?: string }[],
): MorseLessonSittingProgress | undefined {
  if (!sitting) return undefined
  const live = new Set(items.flatMap((item) => (item.id ? [item.id] : [])))
  const revisitItemIds = sitting.revisitItemIds.filter((itemId) => live.has(itemId))
  const pruned: LessonSitting = { ...sitting, revisitItemIds }
  return lessonSittingIsFresh(pruned) ? undefined : pruned
}

export function lessonSittingComplete(sitting: LessonSitting): boolean {
  return sitting.retrievals >= LESSON_RETRIEVAL_TARGET
}

export function lessonSittingRemaining(sitting: LessonSitting): number {
  return Math.max(0, LESSON_RETRIEVAL_TARGET - sitting.retrievals)
}

/** Record that the learner declined listening questions for this sitting. */
export function suppressSittingListening(sitting: LessonSitting): LessonSitting {
  return sitting.listeningSuppressed ? sitting : { ...sitting, listeningSuppressed: true }
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
    ...sitting,
    retrievals: sitting.retrievals + 1,
    correct: sitting.correct + (correct ? 1 : 0),
    revisitItemIds,
  }
}
