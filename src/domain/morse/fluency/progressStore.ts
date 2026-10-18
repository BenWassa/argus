// Owns the formative progress record, immutable updates and storage validation.
import { MORSE_LETTERS, type MorseLetter } from '../code'
import { FIRST_FLUENCY_RUNG, isFluencyRung, nearestRung, type FluencyRung } from './timing'

/**
 * What Argus knows about how *fast* a learner hears a character.
 *
 * Formative throughout, and structurally separated from everything that is
 * not. This is a fourth durable store rather than a field on `morseReview`
 * for the same reason `lessonProgress` is not `itemEvidence`: it answers a
 * different question, and a shared field is how two questions quietly become
 * one claim. `morseReview` says what the guided lesson has covered. This says
 * how quickly and how stably the learner now recognises a character by ear.
 * Neither can qualify the other, and neither reaches Test evidence.
 *
 * Nothing here can complete anything, move a retention clock, resolve an
 * attempt or write `DirectionEvidence`. That is enforced by the import
 * boundary in the Fluency feature, not by this comment.
 *
 * ## Keyed by glyph, not by item id
 *
 * `morseReview` keys by the topic's stable item ids because it is bookkeeping
 * about a topic's items. This is bookkeeping about *characters heard*, which
 * exist whether or not a particular topic models them as items — so the key is
 * the letter itself. It also means the store validates against `MORSE_LETTERS`
 * alone and can never reference an item id that no longer exists.
 */

/**
 * How many recent latencies to keep per character.
 *
 * The measure this store exists to support is the coefficient of variation of
 * response time, so a single last value is structurally useless: it has no
 * variance. Twenty is enough for a stable CV without letting one character's
 * record grow without bound in an exported library.
 */
export const FLUENCY_LATENCY_WINDOW = 20

/**
 * Below this many samples a CV is reported as unknown rather than as a number.
 *
 * Five is a low bar and deliberately so — the alternative is a surface that
 * says nothing for a week. It is high enough that a single interrupted answer
 * cannot swing the figure from "automatic" to "still counting".
 */
export const FLUENCY_CV_MIN_SAMPLES = 5

export interface MorseFluencyCharacter {
  /** Times this character was presented by ear in Fluency. */
  heard: number
  /** Times it was answered correctly. */
  correct: number
  /** Latencies of recent *correct* answers, oldest first. Capped. */
  recentLatencyMs: number[]
}

export interface MorseFluencyProgress {
  /** The learner's current Farnsworth rung. Character speed is never stored. */
  rung: FluencyRung
  characters: Partial<Record<MorseLetter, MorseFluencyCharacter>>
  /**
   * Best result per mode, as that mode defines "best". Never a completion,
   * never a status, and never displayed next to retention state.
   */
  bests: Record<string, number>
}

export function newFluencyProgress(): MorseFluencyProgress {
  return { rung: FIRST_FLUENCY_RUNG, characters: {}, bests: {} }
}

/**
 * True for a record that says nothing.
 *
 * A fresh store is written as an *absent* field rather than as zeroed
 * counters, matching `morseReview`: "this learner has done no Fluency" then
 * has exactly one representation in a stored or exported record.
 */
export function fluencyIsFresh(progress: MorseFluencyProgress): boolean {
  return (
    progress.rung === FIRST_FLUENCY_RUNG &&
    Object.keys(progress.characters).length === 0 &&
    Object.keys(progress.bests).length === 0
  )
}

/**
 * Record one answered character.
 *
 * `latencyMs` is accepted only for a correct answer, and the caller is
 * responsible for the hygiene rules that make it meaningful — measured from
 * the end of the stimulus, discarded if the document was hidden, discarded on
 * a replay. A miss records the exposure and no latency: a miss's response time
 * mixes a fast wrong guess with a long failed search and means neither.
 */
export function recordFluencyAnswer(
  progress: MorseFluencyProgress,
  glyph: MorseLetter,
  correct: boolean,
  latencyMs: number | null,
): MorseFluencyProgress {
  const existing = progress.characters[glyph] ?? { heard: 0, correct: 0, recentLatencyMs: [] }
  const keepLatency =
    correct && latencyMs !== null && Number.isFinite(latencyMs) && latencyMs >= 0

  const recentLatencyMs = keepLatency
    ? [...existing.recentLatencyMs, Math.round(latencyMs)].slice(-FLUENCY_LATENCY_WINDOW)
    : existing.recentLatencyMs

  return {
    ...progress,
    characters: {
      ...progress.characters,
      [glyph]: {
        heard: existing.heard + 1,
        correct: existing.correct + (correct ? 1 : 0),
        recentLatencyMs,
      },
    },
  }
}

export function setFluencyRung(
  progress: MorseFluencyProgress,
  rung: FluencyRung,
): MorseFluencyProgress {
  return progress.rung === rung ? progress : { ...progress, rung }
}

/** Keep a mode's best only when it is actually better. Higher is always better. */
export function recordFluencyBest(
  progress: MorseFluencyProgress,
  key: string,
  value: number,
): { progress: MorseFluencyProgress; improved: boolean } {
  const previous = progress.bests[key]
  if (previous !== undefined && previous >= value) return { progress, improved: false }
  return {
    progress: { ...progress, bests: { ...progress.bests, [key]: value } },
    improved: true,
  }
}

/**
 * Validate an unknown value into a store, or report why it is not one.
 *
 * Kept in the domain beside the type so the parser has one authority to call
 * rather than re-deriving the invariants in a second place.
 */
export function parseFluencyProgress(
  value: unknown,
): { ok: true; value: MorseFluencyProgress } | { ok: false; error: string } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { ok: false, error: 'must be an object' }
  }
  const raw = value as Record<string, unknown>

  if (!isFluencyRung(raw.rung)) {
    return { ok: false, error: 'rung must be one of the defined Farnsworth rungs' }
  }

  if (
    typeof raw.characters !== 'object' ||
    raw.characters === null ||
    Array.isArray(raw.characters)
  ) {
    return { ok: false, error: 'characters must be an object keyed by letter' }
  }

  const characters: Partial<Record<MorseLetter, MorseFluencyCharacter>> = {}
  for (const [glyph, entry] of Object.entries(raw.characters as Record<string, unknown>)) {
    if (!(glyph in MORSE_LETTERS)) {
      return { ok: false, error: `characters references unknown letter "${glyph}"` }
    }
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      return { ok: false, error: `characters for "${glyph}" must be an object` }
    }
    const item = entry as Record<string, unknown>
    const heard = item.heard
    const correct = item.correct
    if (
      !Number.isInteger(heard) ||
      !Number.isInteger(correct) ||
      (heard as number) < 0 ||
      (correct as number) < 0
    ) {
      return { ok: false, error: `characters for "${glyph}" needs non-negative integer counters` }
    }
    if ((correct as number) > (heard as number)) {
      return {
        ok: false,
        error: `characters for "${glyph}" records more correct answers than exposures`,
      }
    }
    if (
      !Array.isArray(item.recentLatencyMs) ||
      item.recentLatencyMs.some(
        (latency) => typeof latency !== 'number' || !Number.isFinite(latency) || latency < 0,
      )
    ) {
      return {
        ok: false,
        error: `characters for "${glyph}" needs a list of non-negative latencies`,
      }
    }
    if (item.recentLatencyMs.length > FLUENCY_LATENCY_WINDOW) {
      return {
        ok: false,
        error: `characters for "${glyph}" holds more latencies than the window allows`,
      }
    }
    if (item.recentLatencyMs.length > (correct as number)) {
      return {
        ok: false,
        error: `characters for "${glyph}" holds more latencies than correct answers`,
      }
    }
    characters[glyph as MorseLetter] = {
      heard: heard as number,
      correct: correct as number,
      recentLatencyMs: (item.recentLatencyMs as number[]).map((latency) => Math.round(latency)),
    }
  }

  const bests: Record<string, number> = {}
  if (raw.bests !== undefined) {
    if (typeof raw.bests !== 'object' || raw.bests === null || Array.isArray(raw.bests)) {
      return { ok: false, error: 'bests must be an object' }
    }
    for (const [key, best] of Object.entries(raw.bests as Record<string, unknown>)) {
      if (typeof best !== 'number' || !Number.isFinite(best) || best < 0) {
        return { ok: false, error: `bests for "${key}" must be a non-negative number` }
      }
      bests[key] = best
    }
  }

  return { ok: true, value: { rung: nearestRung(raw.rung), characters, bests } }
}
