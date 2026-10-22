// Owns derived latency diagnostics and the character selection priority.
import { MORSE_LETTERS, type MorseLetter } from '../code'
import { FLUENCY_CV_MIN_SAMPLES, type MorseFluencyProgress } from './progressStore'

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
/** What a letter the learner is currently missing adds (`morseFocusLetters`). */
export const FOCUS_NEED = 150

export function fluencyNeed(
  progress: MorseFluencyProgress,
  glyph: MorseLetter,
  focus: ReadonlySet<MorseLetter> = new Set(),
): number {
  // A letter missed in a lesson or a Test comes round more often. Bounded like
  // every other term, so it leads without crowding the rest out of a run.
  const focused = focus.has(glyph) ? FOCUS_NEED : 0
  const character = progress.characters[glyph]
  if (!character || character.heard === 0) return 1000 + focused

  const latency = medianLatency(progress, glyph)
  // Bounded so one pathological character cannot monopolise a whole run.
  const slowness = latency === null ? 200 : Math.min(latency / 10, 150)
  const wrong = character.heard - character.correct
  const inaccuracy = Math.min(wrong * 20, 100)
  // Fewer exposures still wins ties, so coverage keeps improving after the
  // first pass over the roster.
  const exposure = -Math.min(character.heard, 20) * 2

  return slowness + inaccuracy + exposure + focused
}

