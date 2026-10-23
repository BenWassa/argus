import { median } from '../fluency/progressMeasures'

/** Product heuristics, not validated proficiency cutoffs. */
export const RECOGNITION_SPEED = {
  schemaVersion: 1,
  capMs: 10_000,
  typicalWindow: 8,
  minSpeedSamples: 3,
  halfLifeMs: 3_000,
  speedFactorMax: 1.5,
} as const

export const RESPONSE_BANDS = [
  { minMs: 0, maxMs: 1_000, label: 'under 1s' },
  { minMs: 1_000, maxMs: 2_000, label: '1–<2s' },
  { minMs: 2_000, maxMs: 3_000, label: '2–<3s' },
  { minMs: 3_000, maxMs: 5_000, label: '3–<5s' },
  { minMs: 5_000, maxMs: 7_000, label: '5–<7s' },
  { minMs: 7_000, maxMs: 10_000, label: '7–<10s' },
  { minMs: 10_000, maxMs: Infinity, label: '10s+' },
] as const

export type ResponseBand = (typeof RESPONSE_BANDS)[number]['label']

/** Null means unmeasurable, not infinitely slow or an incorrect answer. */
export function cappedLatencyMs(rawMs: number | null): number | null {
  if (rawMs === null || !Number.isFinite(rawMs) || rawMs < 0) return null
  return Math.min(Math.floor(rawMs), RECOGNITION_SPEED.capMs)
}

export function responseBand(rawMs: number | null): ResponseBand | null {
  const duration = cappedLatencyMs(rawMs)
  if (duration === null) return null
  return RESPONSE_BANDS.find((band) => duration >= band.minMs && duration < band.maxMs)!.label
}

/**
 * Monotonic timestamp lifecycle; callers supply performance.now(), not Date.now().
 * Only arm after the Read prompt + tiles have rendered, or after Listen audio
 * has fully ended and all tiles are actionable. Replay/help/visibility loss must
 * invalidate the current clock; no rearming until the next independent prompt.
 */
export type RecognitionClock =
  | { phase: 'idle' }
  | { phase: 'running'; startedAtMs: number }
  | { phase: 'invalid' }

export const IDLE_RECOGNITION_CLOCK: RecognitionClock = { phase: 'idle' }

export interface RecognitionReadiness {
  direction: 'read' | 'listen'
  choices: number
  tilesReady: boolean
  playbackFinished?: boolean
  visible: boolean
}

export function armRecognitionClock(nowMs: number, ready: RecognitionReadiness, previous: RecognitionClock = IDLE_RECOGNITION_CLOCK): RecognitionClock {
  // Never restart the clock for an interrupted/replayed or already-started prompt.
  if (previous.phase !== 'idle') return previous
  if (!Number.isFinite(nowMs) || !ready.visible || !ready.tilesReady || ready.choices !== 4 ||
      (ready.direction === 'listen' && ready.playbackFinished !== true)) return IDLE_RECOGNITION_CLOCK
  return { phase: 'running', startedAtMs: nowMs }
}

export function invalidateRecognitionClock(_clock: RecognitionClock): RecognitionClock {
  return { phase: 'invalid' }
}

export function stopRecognitionClock(
  clock: RecognitionClock,
  nowMs: number,
  options: { visible: boolean; independent: boolean; interrupted?: boolean },
): { clock: RecognitionClock; elapsedMs: number | null } {
  const elapsedMs = clock.phase === 'running' && options.visible && options.independent &&
    !options.interrupted && Number.isFinite(nowMs) && nowMs >= clock.startedAtMs
    ? cappedLatencyMs(nowMs - clock.startedAtMs)
    : null
  return { clock: invalidateRecognitionClock(clock), elapsedMs }
}

export interface RecognitionAttempt {
  correct: boolean
  /** Measured after stimulus readiness, never audio transmission duration. */
  elapsedMs: number | null
  choices: number
  independent: boolean
  interrupted?: boolean
}

export interface RecognitionRoundSummary {
  /** All independently graded answers, including wrong answers without speed. */
  graded: number
  correct: number
  /** Full 4-choice, unassisted attempts with valid timing. */
  validSpeedSamples: number
  /** Median of valid correct response samples, or null. */
  typicalCorrectMs: number | null
  /** Null when no comparable, valid speed evidence exists. */
  roundScore: number | null
}

/** A 10s, 30s or 5-minute visible pause all contribute identically. */
export function recognitionUtility(rawMs: number): number | null {
  const capped = cappedLatencyMs(rawMs)
  if (capped === null) return null
  return Math.exp(-Math.LN2 * capped / RECOGNITION_SPEED.halfLifeMs)
}

/** Score one homogeneous stream only (same response method and audio rate). */
export function summarizeRecognitionRound(attempts: readonly RecognitionAttempt[]): RecognitionRoundSummary {
  const graded = attempts.filter((attempt) => attempt.independent && attempt.choices === 4)
  const valid = graded.flatMap((attempt) => {
    const capped = cappedLatencyMs(attempt.elapsedMs)
    return attempt.choices === 4 && !attempt.interrupted && capped !== null
      ? [{ correct: attempt.correct, ms: capped }] : []
  })
  const correctLatencies = valid.filter((attempt) => attempt.correct).map((attempt) => attempt.ms)
  return {
    graded: graded.length,
    correct: graded.filter((attempt) => attempt.correct).length,
    validSpeedSamples: valid.length,
    typicalCorrectMs: median(correctLatencies),
    roundScore: valid.length
      ? Math.round(100 * valid.reduce((sum, attempt) =>
        sum + (attempt.correct ? recognitionUtility(attempt.ms)! : 0), 0) / valid.length)
      : null,
  }
}
