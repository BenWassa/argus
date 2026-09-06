import {
  LESSON_RETRIEVAL_TARGET,
  lessonSittingIsFresh,
  type LessonSitting,
} from './morseLessonSitting'

/**
 * The retired pre-#66 sidecar for active Morse Learn sittings.
 *
 * `Topic.lessonSitting` is now the single durable authority, so this module is
 * no longer a store: it is a one-way migration door. It can read a sitting an
 * older build left behind and it can remove the key, and it deliberately has no
 * way to write one, so a permanent dual-write cannot be reintroduced by
 * accident.
 */
const KEY = 'argus.morse-learn-sittings.v1'

export const LEGACY_LESSON_SITTING_KEY = KEY

function validSitting(value: unknown): LessonSitting | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null
  const raw = value as Record<string, unknown>
  const retrievals = Number.isInteger(raw.retrievals) ? Number(raw.retrievals) : -1
  const correct = Number.isInteger(raw.correct) ? Number(raw.correct) : -1
  if (retrievals < 0 || retrievals > LESSON_RETRIEVAL_TARGET || correct < 0 || correct > retrievals) return null
  if (!Array.isArray(raw.revisitItemIds) || raw.revisitItemIds.some((id) => typeof id !== 'string' || !id)) return null
  const revisitItemIds = [...new Set(raw.revisitItemIds as string[])]
  // The sidecar never recorded listening suppression, so a migrated sitting
  // resumes with listening available. That is the conservative direction: it
  // restores a capability rather than silently withholding one.
  return { retrievals, correct, revisitItemIds }
}

/** Every sitting an older build left behind, keyed by topic id. */
export function readLessonSittingSidecar(): Record<string, LessonSitting> {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}
    const store: Record<string, LessonSitting> = {}
    for (const [topicId, value] of Object.entries(parsed as Record<string, unknown>)) {
      const sitting = validSitting(value)
      // A sidecar sitting that records nothing is not progress worth migrating,
      // and adopting it would write a zeroed field where absent is canonical.
      if (sitting && !lessonSittingIsFresh(sitting)) store[topicId] = sitting
    }
    return store
  } catch {
    return {}
  }
}

/**
 * Remove the sidecar entirely. Called once the canonical store has taken over,
 * and again on reset/import replacement so a sitting belonging to a replaced
 * library can never surface inside its successor.
 */
export function clearAllLessonSittings(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* reset remains best effort, like the main library storage */
  }
}
