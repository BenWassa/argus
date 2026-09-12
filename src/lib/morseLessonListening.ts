import type { LessonEntry, LessonRun } from './morseLesson'
import type { MorseLetter } from './morse'

/** One listening prompt at most every third completed formative retrieval. */
export const LISTENING_RETRIEVAL_INTERVAL = 3

/** Runtime-only modality state for one finite Learn sitting. */
export interface LessonListeningState {
  suppressed: boolean
  previousItemId: string | null
}

export interface ListeningFeedback {
  itemId: string
  glyph: MorseLetter
  pattern: string
  response: string
  correct: boolean
}

export interface ListeningAnswer {
  run: LessonRun
  feedback: ListeningFeedback
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
 * `knownGlyphs` is every character introduced anywhere in the topic so far
 * (see `introducedGlyphs`), not just this packet's own small roster: a
 * packet's roster stays capped at a handful of characters for the whole
 * lesson, and a distractor pool scoped to it would keep offering the same one
 * or two letters again and again long after the learner has met many more.
 * Only characters the learner has actually met may appear at all, and the very
 * first packet legitimately offers two choices rather than padding with an
 * unfamiliar letter, because nothing else exists yet to draw from.
 *
 * Both which two distractors appear and where the answer lands rotate by
 * lesson step, so the pair actually varies as a sitting progresses rather than
 * settling on the same two letters for its whole duration, while remaining a
 * pure function of the run: the same step over the same known pool always
 * looks the same, which is what keeps this testable without a DOM.
 */
export function lessonListeningOptions(
  run: LessonRun,
  entry: LessonEntry,
  knownGlyphs: readonly MorseLetter[],
): MorseLetter[] {
  const pool = knownGlyphs.filter((glyph) => glyph !== entry.glyph)
  const alternatives: MorseLetter[] = []
  if (pool.length > 0) {
    const distractorCount = Math.min(2, pool.length)
    const start = run.step % pool.length
    for (let offset = 0; offset < distractorCount; offset += 1) {
      alternatives.push(pool[(start + offset) % pool.length])
    }
  }

  const options = [...alternatives]
  const at = run.step % (options.length + 1)
  options.splice(at, 0, entry.glyph)
  return options
}

/**
 * Answer a sound→letter formative prompt without touching printed support.
 *
 * The target is deferred for one intervening lesson step so the next question
 * cannot simply reveal the same answer visually. `asked`, `done`, and `support`
 * are deliberately unchanged: auditory reinforcement cannot make a printed
 * packet ready, fade/restore printed acquisition support, or become durable
 * evidence. Only ephemeral queue timing moves.
 */
export function answerListeningQuestion(
  run: LessonRun,
  itemId: string,
  response: string,
): ListeningAnswer | null {
  const entry = run.entries.find((candidate) => candidate.itemId === itemId)
  if (!entry || !entry.introduced || run.feedback || run.complete) return null

  const normalised = response.trim().toUpperCase()
  const correct = normalised === entry.glyph
  const step = run.step + 1
  const entries = run.entries.map((candidate) =>
    candidate.itemId === itemId
      ? {
          ...candidate,
          lastAskedAt: run.step,
          notBefore: step + 1,
        }
      : candidate,
  )

  return {
    run: { ...run, step, entries },
    feedback: {
      itemId,
      glyph: entry.glyph,
      pattern: entry.pattern,
      response: normalised,
      correct,
    },
  }
}
