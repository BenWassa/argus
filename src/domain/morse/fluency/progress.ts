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

// ---------------------------------------------------------------------------
// Derived measures. Pure reads; none of these adds state.
// ---------------------------------------------------------------------------

/**
 * Median rather than mean, throughout.
 *
 * One answer interrupted by a notification produces a 9-second latency that
 * drags a mean of twenty samples by half a second. The median does not care,
 * and "how long does this usually take" is the question being asked.
 */
export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2)
}

export function medianLatency(
  progress: MorseFluencyProgress,
  glyph: MorseLetter,
): number | null {
  return median(progress.characters[glyph]?.recentLatencyMs ?? [])
}

/**
 * The coefficient of variation of response time: `SD / mean`.
 *
 * This is the measure, and the reason mean latency alone is not. A process can
 * get uniformly faster without becoming any more automatic — Segalowitz and
 * Segalowitz call that *speedup*, and it leaves CV unchanged. *Automatization*
 * is the case where the spread falls faster than the mean, and CV falls with
 * it, because attentional and strategic routes produce variable timing while
 * automatic retrieval produces stable timing.
 *
 * In Morse that maps almost too neatly. A learner counting elements produces
 * latencies that scale with element count and scatter widely; a learner with
 * instant character recognition produces latencies that are lower *and
 * flatter*. So this number distinguishes "got quicker" from "stopped
 * counting", which is exactly the distinction the product otherwise cannot
 * make.
 *
 * `null` below `FLUENCY_CV_MIN_SAMPLES`, because a CV over three samples is
 * noise wearing a statistic's clothes.
 */
export function coefficientOfVariation(values: readonly number[]): number | null {
  if (values.length < FLUENCY_CV_MIN_SAMPLES) return null
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  if (mean <= 0) return null
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
  return Math.sqrt(variance) / mean
}

export function characterCv(
  progress: MorseFluencyProgress,
  glyph: MorseLetter,
): number | null {
  return coefficientOfVariation(progress.characters[glyph]?.recentLatencyMs ?? [])
}

/** Every latency the learner has, pooled. Used for the roster-wide CV. */
export function allLatencies(progress: MorseFluencyProgress): number[] {
  return Object.values(progress.characters).flatMap((character) =>
    character ? character.recentLatencyMs : [],
  )
}

export interface SlowCharacter {
  glyph: MorseLetter
  medianMs: number
  elements: number
}

/**
 * The slowest characters the learner has enough data for.
 *
 * This is the surface's diagnostic, and it is the one number worth saying out
 * loud, because it is actionable in a way an accuracy percentage is not.
 */
export function slowestCharacters(
  progress: MorseFluencyProgress,
  limit = 3,
): SlowCharacter[] {
  const scored: SlowCharacter[] = []
  for (const [glyph, character] of Object.entries(progress.characters)) {
    if (!character || character.recentLatencyMs.length < FLUENCY_CV_MIN_SAMPLES) continue
    const medianMs = median(character.recentLatencyMs)
    if (medianMs === null) continue
    scored.push({
      glyph: glyph as MorseLetter,
      medianMs,
      elements: MORSE_LETTERS[glyph as MorseLetter].length,
    })
  }
  return scored.sort((a, b) => b.medianMs - a.medianMs || a.glyph.localeCompare(b.glyph)).slice(0, limit)
}

/**
 * The counting signal.
 *
 * If recognising a character were a single act, its cost would be roughly
 * independent of how many elements it contains. Counting is serial, so its
 * cost is not: a four-element character takes about twice as long to count as
 * a two-element one, and that ratio is directly observable.
 *
 * Returns the ratio of the median latency for long characters (3–4 elements)
 * to that for short ones (1–2). Around 1.0 means element count is not costing
 * the learner anything, which is what recognition looks like. Rising well
 * above it means the long characters are still being assembled.
 *
 * `null` until both halves have data. Deliberately not thresholded here — the
 * surface decides what to say about a number, and a domain module that
 * returned "still counting" would be putting copy in the wrong file.
 */
export function elementCountRatio(progress: MorseFluencyProgress): number | null {
  const short: number[] = []
  const long: number[] = []
  for (const [glyph, character] of Object.entries(progress.characters)) {
    if (!character) continue
    const elements = MORSE_LETTERS[glyph as MorseLetter].length
    const bucket = elements <= 2 ? short : long
    bucket.push(...character.recentLatencyMs)
  }
  const shortMedian = median(short)
  const longMedian = median(long)
  if (
    shortMedian === null ||
    longMedian === null ||
    shortMedian <= 0 ||
    short.length < FLUENCY_CV_MIN_SAMPLES ||
    long.length < FLUENCY_CV_MIN_SAMPLES
  ) {
    return null
  }
  return longMedian / shortMedian
}

/**
 * How much this character wants to be asked next.
 *
 * Coverage first — a character never heard in Fluency outranks every character
 * that has been, however slow. Then slowness, so the characters costing the
 * learner the most time come round more often. Then accuracy.
 *
 * Deliberately the same shape as `listeningNeed` in the Learn curriculum,
 * because it answers the same kind of question and a second unrelated
 * selection policy would be a second thing to keep honest.
 */
export function fluencyNeed(progress: MorseFluencyProgress, glyph: MorseLetter): number {
  const character = progress.characters[glyph]
  if (!character || character.heard === 0) return 1000

  const latency = medianLatency(progress, glyph)
  // Bounded so one pathological character cannot monopolise a whole run.
  const slowness = latency === null ? 200 : Math.min(latency / 10, 150)
  const wrong = character.heard - character.correct
  const inaccuracy = Math.min(wrong * 20, 100)
  // Fewer exposures still wins ties, so coverage keeps improving after the
  // first pass over the roster.
  const exposure = -Math.min(character.heard, 20) * 2

  return slowness + inaccuracy + exposure
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
