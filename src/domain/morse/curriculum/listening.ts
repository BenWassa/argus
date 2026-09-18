import type { LessonEntry, LessonRun } from './lesson'
import type { MorseLetter } from '../code'
import { LISTENING_IMBALANCE_ALLOWANCE, hasListeningCoverage } from './review'
import type { MorseReviewProgress } from '../progress'

/** One listening prompt at most every third completed formative retrieval. */
export const LISTENING_RETRIEVAL_INTERVAL = 3

/** Runtime-only modality state for one finite Learn sitting. */
export interface LessonListeningState {
  suppressed: boolean
  previousItemId: string | null
  /** A sound answer that must be checked again before another audio target. */
  pendingRetryItemId: string | null
  /** A correct sound answer is formative once per character in a lesson run. */
  successfulItemIds: readonly string[]
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
  return {
    suppressed: false,
    previousItemId: null,
    pendingRetryItemId: null,
    successfulItemIds: [],
  }
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
 * Record the outcome of an auditory question without changing printed work.
 *
 * A miss gets one immediate recheck (and continues to be rechecked if it is
 * missed again). A hit clears that obligation and removes this character from
 * the rest of the run's optional listening pool. This is deliberately runtime
 * state: hearing a letter is not printed acquisition evidence.
 */
export function recordListeningAnswer(
  state: LessonListeningState,
  itemId: string,
  correct: boolean,
): LessonListeningState {
  if (!correct) {
    return {
      ...state,
      previousItemId: itemId,
      pendingRetryItemId: itemId,
    }
  }

  return {
    ...state,
    previousItemId: itemId,
    pendingRetryItemId: null,
    successfulItemIds: state.successfulItemIds.includes(itemId)
      ? state.successfulItemIds
      : [...state.successfulItemIds, itemId],
  }
}

/**
 * Whether this retrieval slot is one the cadence offers to listening.
 *
 * Offer reinforcement every third retrieval while unfinished returning
 * material remains. The cadence never extends a completed lesson.
 */
export function isListeningSlot(retrievalsCompleted: number): boolean {
  return (retrievalsCompleted + 1) % LISTENING_RETRIEVAL_INTERVAL === 0
}

/**
 * Whether this character may be asked by ear at all.
 *
 * Listening is reinforcement, not acquisition: a character that still owes
 * more than one printed check is excluded. A target cannot immediately switch
 * modality and repeat while its answer is still fresh.
 */
export function isListeningEligible(entry: LessonEntry, state: LessonListeningState): boolean {
  if (state.suppressed) return false
  // New mappings and cued returns still owe two printed acquisition checks.
  // Audio is optional reinforcement only when a returning character has one
  // printed check left, keeping a character to at most two correct prompts in
  // this run (one sound, one print).
  if (
    entry.novel ||
    entry.done ||
    !entry.introduced ||
    (entry.support !== 'solo' && entry.support !== 'settled')
  ) return false
  if (state.successfulItemIds.includes(entry.itemId)) return false
  return state.previousItemId !== entry.itemId
}

/**
 * Listening is reinforcement, not the first presentation of a mapping.
 *
 * Retained for the narrow question it actually answers — may *this* entry be
 * asked by ear on *this* slot. Which entry gets the slot is now decided by
 * `chooseListeningTarget`, because asking whichever character the printed
 * scheduler happened to pick is exactly what produced the baseline's modality
 * gap (#90 §5).
 */
export function shouldUseListeningQuestion(
  retrievalsCompleted: number,
  entry: LessonEntry,
  state: LessonListeningState,
): boolean {
  return isListeningSlot(retrievalsCompleted) && isListeningEligible(entry, state)
}

/**
 * How much this character wants a listening retrieval (#90 §5).
 *
 * Higher is more urgent. Coverage first — a character never met in sound
 * outranks every character that has been, however shakily — then the balance
 * term, which is simply "fewer times heard wins", and finally a nudge for a
 * character whose last listening answer was wrong.
 *
 * The old policy had no term like this at all. It asked whichever character the
 * printed queue offered on the third slot, which is why the measured baseline
 * landed 51 listening questions on a repeating subset while other letters were
 * never heard once.
 */
export function listeningNeed(itemId: string, review: MorseReviewProgress): number {
  const item = review.items[itemId]
  const heard = item?.heard ?? 0
  const missed = item ? item.heard - item.heardCorrect : 0

  const uncovered = hasListeningCoverage(review, itemId) ? 0 : 1000
  // Negative, so fewer times heard scores higher. Bounded by the allowance so
  // a character cannot be starved indefinitely by one that is merely behind.
  const balance = -heard * 10
  const struggling = Math.min(missed, LISTENING_IMBALANCE_ALLOWANCE + 1)

  return uncovered + balance + struggling
}

/**
 * Which character this listening slot should ask, or `null` for none.
 *
 * Chosen by need across every eligible character on the roster rather than by
 * whichever one the printed queue offered. An ineligible or unavailable target
 * yields the slot back to the visual path rather than losing the coverage —
 * the slot is reallocated on the next one, because need is recomputed from
 * durable state every time.
 */
export function chooseListeningTarget(
  retrievalsCompleted: number,
  entries: readonly LessonEntry[],
  state: LessonListeningState,
  review: MorseReviewProgress,
): LessonEntry | null {
  if (state.suppressed) return null

  // A miss is not allowed to disappear behind the cadence. Keep checking the
  // same sound mapping until it is right; a correct recheck clears this state.
  if (state.pendingRetryItemId) {
    const pending = entries.find((entry) => entry.itemId === state.pendingRetryItemId)
    if (pending?.introduced) return pending
  }

  if (!isListeningSlot(retrievalsCompleted)) return null

  const eligible = entries.filter((entry) => isListeningEligible(entry, state))
  if (eligible.length === 0) return null

  return [...eligible].sort(
    (a, b) =>
      listeningNeed(b.itemId, review) - listeningNeed(a.itemId, review) || a.order - b.order,
  )[0]
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
 * Distractors vary by target, listening history and the current offered slot;
 * answer placement rotates by the durable total of prior listening attempts.
 * Neither rule depends on the reset-prone lesson step that establishes the
 * fixed listening cadence, so the correct answer cannot become a learnable
 * cadence residue. The result is still a pure function of the
 * durable/formative inputs and current sitting.
 */
export function lessonListeningOptions(
  run: LessonRun,
  entry: LessonEntry,
  knownGlyphs: readonly MorseLetter[],
  retrievalsCompleted: number = run.step,
  review: MorseReviewProgress = { sittings: 0, items: {} },
): MorseLetter[] {
  const pool = knownGlyphs.filter((glyph) => glyph !== entry.glyph)
  const targetIndex = Math.max(0, knownGlyphs.indexOf(entry.glyph))
  const listeningAttempt = review.items[entry.itemId]?.heard ?? 0
  const alternatives: MorseLetter[] = []
  if (pool.length > 0) {
    const distractorCount = Math.min(2, pool.length)
    // The target's durable listening count and the known-pool shape vary
    // independently from the fixed 3rd/6th/9th cadence. This avoids the old
    // `run.step % optionCount` coupling while retaining reproducible choices.
    const start = (targetIndex * 5 + listeningAttempt * 7 + retrievalsCompleted) % pool.length
    for (let offset = 0; offset < distractorCount; offset += 1) {
      alternatives.push(pool[(start + offset) % pool.length])
    }
  }

  const options = [...alternatives]
  // A short run can have only one listening slot, so a per-run slot ordinal
  // would always put that answer first. Durable history continues the rotation
  // across packets and sittings while still producing a deterministic choice.
  const priorListeningAttempts = Object.values(review.items).reduce(
    (total, item) => total + item.heard,
    0,
  )
  const at = priorListeningAttempts % (options.length + 1)
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
