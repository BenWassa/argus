import type { Item } from '../library/topic'

/**
 * Listening evidence (#151): a record of its own, deliberately separate from
 * `itemEvidence`.
 *
 * `itemEvidence` answers "how well is this recalled as text or recognized from a
 * picture". This answers "did the learner get this right **by ear**". They are
 * different claims, so neither store can qualify the other: an audio answer
 * never writes to `itemEvidence`, a text or choice answer never writes here, and
 * a topic's listening claim is read only from this record.
 *
 * `unassistedCorrect` counts correct answers given without the transcript having
 * been revealed first. Replaying the clean recording is allowed and never
 * disqualifies. A transcript-assisted answer is real practice and is recorded as
 * such, but it is not evidence that the learner heard the words unaided.
 *
 * Additive within library v5: absent means no listening evidence, which can only
 * withhold a claim, never fabricate one.
 */
export interface AudioEvidence {
  attempts: number
  correct: number
  /** Correct, and the transcript was never revealed before answering. */
  unassistedCorrect: number
  /** Attempts on which the transcript was revealed first. */
  assistedAttempts: number
  lastAt: string | null
  lastLatencyMs: number | null
}

export type AudioEvidenceStore = Record<string, AudioEvidence>

export const EMPTY_AUDIO_EVIDENCE: AudioEvidence = {
  attempts: 0,
  correct: 0,
  unassistedCorrect: 0,
  assistedAttempts: 0,
  lastAt: null,
  lastLatencyMs: null,
}

export interface RecordedAudioAnswer {
  correct: boolean
  /** The transcript was revealed before the answer was given. */
  assisted: boolean
  latencyMs: number | null
  at: string
}

export function recordAudioAnswer(
  evidence: AudioEvidence | undefined,
  answer: RecordedAudioAnswer,
): AudioEvidence {
  const before = evidence ?? EMPTY_AUDIO_EVIDENCE
  return {
    attempts: before.attempts + 1,
    correct: before.correct + (answer.correct ? 1 : 0),
    unassistedCorrect: before.unassistedCorrect + (answer.correct && !answer.assisted ? 1 : 0),
    assistedAttempts: before.assistedAttempts + (answer.assisted ? 1 : 0),
    lastAt: answer.at,
    lastLatencyMs: answer.latencyMs,
  }
}

export function mergeAudioEvidence(
  existing: AudioEvidenceStore | undefined,
  updates: AudioEvidenceStore,
): AudioEvidenceStore {
  return { ...(existing ?? {}), ...updates }
}

/**
 * Drop evidence for items that are no longer heard: deleted, or detached from
 * their recording by an answer edit (`reconcileAuthoredItems`). The parser
 * refuses evidence for an item without audio, so keeping it would make the
 * whole library unreadable on the next load.
 */
export function pruneAudioEvidence(
  evidence: AudioEvidenceStore | undefined,
  items: Item[],
): AudioEvidenceStore {
  if (!evidence) return {}
  const live = new Set(audioItems(items).flatMap((item) => (item.id ? [item.id] : [])))
  return Object.fromEntries(Object.entries(evidence).filter(([id]) => live.has(id)))
}

/** The items of a topic that are heard. */
export function audioItems(items: Item[]): Item[] {
  return items.filter((item) => item.audio !== undefined)
}

/**
 * How many of a topic's heard items the learner has answered correctly by ear,
 * unaided, at least once. This is the only reading of the listening claim; it
 * never consults text or choice evidence.
 */
export function listeningCoverage(
  items: Item[],
  evidence: AudioEvidenceStore | undefined,
): { unaided: number; total: number } {
  const heard = audioItems(items)
  const unaided = heard.filter((item) => (evidence?.[item.id ?? '']?.unassistedCorrect ?? 0) > 0).length
  return { unaided, total: heard.length }
}

export function hasCompleteListeningCoverage(
  items: Item[],
  evidence: AudioEvidenceStore | undefined,
): boolean {
  const { unaided, total } = listeningCoverage(items, evidence)
  return total > 0 && unaided === total
}
