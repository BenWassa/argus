import { morseAcquisitionPosition } from '../morse/curriculum/lesson/packets'
import type { Status, Topic } from '../library/topic'

/** One clean eligible Test completes an ordinary topic permanently. */
export const PASS_THRESHOLD = 1

/** Completion is permanent, including records written by the retired ladder. */
export function isLearned(topic: Topic): boolean {
  return Boolean(topic.completedAt ||
    topic.status === 'completed' || topic.status === 'drilled' || topic.status === 'decayed' ||
    morseAcquisitionPosition(topic)?.ready)
}

export interface DueReason {
  due: boolean
  label: string
}

export function dueState(topic: Topic): DueReason {
  if (isLearned(topic)) return { due: false, label: 'Learned' }
  return { due: true, label: topic.status === 'unstarted' ? 'Not tested yet' : 'Ready to test' }
}

/** In-progress learning precedes topics that have not been started. */
export const DUE_RANK: Record<Status, number> = {
  decayed: 4,
  drilled: 4,
  learning: 2,
  unstarted: 3,
  completed: 4,
}

/**
 * Deliberately starting acquisition moves a topic off `unstarted`. For an
 * progressive topic this is the canonical lesson start. Ordinary topics
 * offer Test directly; their reference content needs no enrollment. Merely browsing a
 * reference must never call this function.
 *
 * No attempt or evidence is recorded: nothing was scored. The timestamp records
 * when learning began.
 */
export function resolveStudy(topic: Topic, now: Date = new Date()): Topic {
  if (topic.status === 'drilled') return { ...topic, status: 'completed', completedAt: topic.completedAt ?? topic.drilledAt ?? now.toISOString() }
  if (topic.status !== 'unstarted') return topic
  return { ...topic, status: 'learning', learningAt: now.toISOString() }
}

export interface Resolution {
  topic: Topic
  from: Status
  to: Status
  /** True when this attempt first completed the topic. */
  completed: boolean
}

export interface AttemptOptions {
  /** Whether this Test meets the acquisition and independent-evidence boundary.
   * Ineligible Tests keep their actual score without completing unfinished work.
   * This gate never reopens a topic that is already learned.
   */
  advancementEligible?: boolean
  /** Items this run answered wrong, kept on the attempt for Practice and the topic page. */
  missedItemIds?: string[]
}

/**
 * Applies one test's result to a topic and reports the transition, so the
 * end screen can name what actually happened rather than reporting a bare
 * score. Test is the only recall interaction.
 */
export function resolveAttempt(
  topic: Topic,
  correct: number,
  total: number,
  now: Date = new Date(),
  options: AttemptOptions = {},
): Resolution {
  const at = now.toISOString()
  const clean = total > 0 && correct / total >= PASS_THRESHOLD
  const from = topic.status
  const next: Topic = { ...topic, lastTestedAt: at }

  let completed = false

  const eligible = options.advancementEligible ?? true

  if (isLearned(topic)) {
    // Later Tests keep their scores and misses, but never reopen learned work.
    next.status = 'completed'
    next.completedAt = topic.completedAt ?? topic.acquisitionReadyAt ?? topic.drilledAt ?? at
    if (clean) next.spotCheckedAt = at
  } else if (!eligible) {
    // An early or supported Test cannot finish the learning boundary.
  } else if (clean) {
    next.status = 'completed'
    next.completedAt = at
    completed = true
  } else {
    next.status = 'learning'
    next.learningAt = topic.learningAt ?? at
  }

  const missedItemIds = [...new Set(options.missedItemIds ?? [])]
  next.history = [
    ...topic.history,
    { at, correct, total, resolvedTo: next.status, ...(missedItemIds.length > 0 ? { missedItemIds } : {}) },
  ]

  return { topic: next, from, to: next.status, completed }
}

/**
 * Re-apply a resolution to the topic as it stands *now* rather than as it stood
 * when the attempt was scored.
 *
 * A Test snapshots its topics at session start, because a bankable attempt has
 * to run the deck it started with. Minutes later that snapshot can be stale: a
 * lesson answer or a sibling write may have landed in between. Writing
 * `resolution.topic` back whole would silently revert those. Only the fields the
 * scheduler owns are copied across, and the attempt is appended to whatever
 * history the topic currently has, so the retention decision is preserved
 * without the snapshot's other fields riding along with it.
 */
export function applyResolution(current: Topic, resolution: Resolution): Topic {
  const attempt = resolution.topic.history[resolution.topic.history.length - 1]
  return {
    ...current,
    status: isLearned(current) ? 'completed' : resolution.topic.status,
    drilledAt: resolution.topic.drilledAt,
    learningAt: resolution.topic.learningAt,
    completedAt: current.completedAt ?? resolution.topic.completedAt,
    lastTestedAt: resolution.topic.lastTestedAt,
    spotCheckedAt: resolution.topic.spotCheckedAt,
    history: attempt ? [...current.history, { ...attempt, resolvedTo: isLearned(current) ? 'completed' : attempt.resolvedTo }] : current.history,
  }
}
