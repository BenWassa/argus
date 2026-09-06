import type { LessonEntry, LessonRun } from './morseLesson'
import type { MorseLetter } from './morse'

/** One listening prompt at most every third completed formative retrieval. */
export const LISTENING_RETRIEVAL_INTERVAL = 3

/** Runtime-only modality state for one finite Learn sitting. */
export interface LessonListeningState {
  suppressed: boolean
  previousItemId: string | null
}

export function newLessonListeningState(): LessonListeningState {
  return { suppressed: false, previousItemId: null }
}

export function suppressListening(state: LessonListeningState): LessonListeningState {
  return state.suppressed ? state : { ...state, suppressed: true }
}

export function recordLessonQuestion(
  state: LessonListeningState,
  itemId: string,
): LessonListeningState {
  return { ...state, previousItemId: itemId }
}

/**
 * Listening is reinforcement, not the first presentation of a mapping.
 *
 * It is offered deterministically on the 3rd/6th/9th retrieval slots, only for
 * an introduced character that has already survived at least one printed
 * retrieval (`support !== taught`). A target cannot immediately switch modality
 * and repeat while its answer is still fresh.
 */
export function shouldUseListeningQuestion(
  retrievalsCompleted: number,
  entry: LessonEntry,
  state: LessonListeningState,
): boolean {
  if (state.suppressed) return false
  if (!entry.introduced || entry.support === 'taught') return false
  if (state.previousItemId === entry.itemId) return false
  return (retrievalsCompleted + 1) % LISTENING_RETRIEVAL_INTERVAL === 0
}

/**
 * Compact deterministic letter choices for a sound stimulus.
 *
 * Only characters already introduced in this packet roster may appear. The
 * first packet therefore legitimately offers two choices rather than padding
 * with an unfamiliar letter. The answer position rotates by lesson step.
 */
export function lessonListeningOptions(run: LessonRun, entry: LessonEntry): MorseLetter[] {
  const alternatives = run.entries
    .filter((candidate) => candidate.introduced && candidate.itemId !== entry.itemId)
    .sort((a, b) => a.order - b.order)
    .map((candidate) => candidate.glyph)
    .slice(0, 2)

  const options = alternatives.filter((glyph, index, all) => all.indexOf(glyph) === index)
  const at = run.step % (options.length + 1)
  options.splice(at, 0, entry.glyph)
  return options
}
