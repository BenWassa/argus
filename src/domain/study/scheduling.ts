import type { Status, Topic } from '../library/topic'

/** A topic reaches `drilled` only on a clean session. No partial credit. */
export const PASS_THRESHOLD = 1

/**
 * Where a topic stands on the ladder, in the learner's words.
 *
 * Nothing here reads a clock (owner, 2026-09-29). A learner may use Argus five
 * days running or five times a year, so no rung, availability or label waits on
 * elapsed time: every topic can be Tested whenever the learner chooses. "Due"
 * means *in motion* — started and not yet banked, or needing repair — which is
 * what Today holds. A banked topic is not due, and can still be checked at any
 * time.
 */
export interface DueReason {
  due: boolean
  /** Shown to the user so the ladder is never a black box. */
  label: string
}

export function dueState(topic: Topic): DueReason {
  switch (topic.status) {
    case 'unstarted':
      return { due: true, label: 'Not started' }
    case 'decayed':
      return { due: true, label: 'Needs repair' }
    case 'learning':
      return { due: true, label: 'Ready to test' }
    case 'drilled':
      return { due: true, label: 'Ready to test again' }
    case 'completed':
      return { due: false, label: 'Banked' }
  }
}

/**
 * Repair first, then the tests that can actually bank a completion, then
 * unfinished work. Exported so the journey layer ranks the day's work the same
 * way rather than inventing a second order for the same ladder.
 */
export const DUE_RANK: Record<Status, number> = {
  decayed: 0,
  drilled: 1,
  learning: 2,
  unstarted: 3,
  completed: 4,
}

/**
 * Deliberately starting acquisition moves a topic off `unstarted`. For an
 * ordinary topic this is explicit enrollment (`Start learning`); for a
 * progressive topic it is the canonical lesson start. Merely browsing a
 * reference must never call this function.
 *
 * No attempt or evidence is recorded: nothing was scored. The timestamp records
 * when learning began.
 */
export function resolveStudy(topic: Topic, now: Date = new Date()): Topic {
  if (topic.status !== 'unstarted') return topic
  return { ...topic, status: 'learning', learningAt: now.toISOString() }
}

export interface Resolution {
  topic: Topic
  from: Status
  to: Status
  /** True when this attempt banked a permanent completion. */
  completed: boolean
  /** True when a previously completed topic fell back for repair. */
  decayed: boolean
}

export interface AttemptOptions {
  /**
   * Whether this attempt is allowed to move the topic along the retention
   * ladder (#67).
   *
   * The scheduler stays generic and stays the retention authority: it does not
   * know what progressive acquisition is, and it does not go looking. Eligibility
   * is decided by the journey layer, which does, and is handed here as one
   * boolean. `true` is the default and is every ordinary topic's answer.
   *
   * An ineligible attempt is scored, kept in history and updates
   * `lastTestedAt`, and moves no status in either direction. It cannot advance a rung it has not earned, and
   * equally it cannot demote one: refusing to bank a result is not a failure.
   */
  advancementEligible?: boolean
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
  let decayed = false

  const eligible = options.advancementEligible ?? true

  if (!eligible) {
    // Recorded, and nothing else. See `AttemptOptions.advancementEligible`.
  } else if (from === 'unstarted') {
    // A first Test is itself a deliberate learning/check action, so it enrolls
    // the topic, but it cannot also prove retention, whatever the score.
    next.status = 'learning'
    next.learningAt = at
  } else if (from === 'completed') {
    // A check, whenever the learner chooses to take one. Passing keeps the
    // record; failing routes back to repair without erasing that the topic was
    // completed.
    if (clean) {
      next.status = 'completed'
      next.spotCheckedAt = at
    } else {
      next.status = 'decayed'
      decayed = true
    }
  } else if (from === 'drilled') {
    if (clean) {
      next.status = 'completed'
      next.completedAt = topic.completedAt ?? at
      completed = true
    } else {
      next.status = 'learning'
      next.drilledAt = null
      next.learningAt = at
    }
  } else {
    // learning, decayed
    if (clean) {
      const priorPerfect = topic.history.some((attempt) => attempt.total > 0 && attempt.correct === attempt.total)
      if (from === 'learning' && priorPerfect) {
        next.status = 'completed'
        next.completedAt = topic.completedAt ?? at
        completed = true
      } else {
        next.status = 'drilled'
        next.drilledAt = at
      }
    } else {
      next.status = 'learning'
      next.learningAt = at
    }
  }

  next.history = [...topic.history, { at, correct, total, resolvedTo: next.status }]

  return { topic: next, from, to: next.status, completed, decayed }
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
    status: resolution.topic.status,
    drilledAt: resolution.topic.drilledAt,
    learningAt: resolution.topic.learningAt,
    completedAt: resolution.topic.completedAt,
    lastTestedAt: resolution.topic.lastTestedAt,
    spotCheckedAt: resolution.topic.spotCheckedAt,
    history: attempt ? [...current.history, attempt] : current.history,
  }
}
