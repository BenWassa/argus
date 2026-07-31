import type { Status, Topic } from './types'

/** A topic reaches `drilled` only on a clean session. No partial credit. */
export const PASS_THRESHOLD = 1

/** Recall has to survive a real gap before it counts as retention. */
export const COMPLETION_GAP_DAYS = 30

/** Completed topics come back for a spot check on this cadence. */
export const SPOT_CHECK_DAYS = 90

/** While learning, a topic returns the next day. */
export const LEARNING_GAP_DAYS = 1

export function daysBetween(from: string, to: Date = new Date()): number {
  const ms = to.getTime() - new Date(from).getTime()
  return Math.floor(ms / 86_400_000)
}

export interface DueReason {
  due: boolean
  /** Shown to the user so the schedule is never a black box. */
  label: string
  /** Days remaining until due. Zero or negative when due now. */
  waitDays: number
}

export function dueState(topic: Topic, now: Date = new Date()): DueReason {
  switch (topic.status) {
    case 'unstarted':
      return { due: true, label: 'Not started', waitDays: 0 }

    case 'decayed':
      return { due: true, label: 'Needs repair', waitDays: 0 }

    case 'learning': {
      const since = topic.lastPracticedAt ? daysBetween(topic.lastPracticedAt, now) : Infinity
      const wait = LEARNING_GAP_DAYS - since
      return wait <= 0
        ? { due: true, label: 'Ready to drill', waitDays: 0 }
        : { due: false, label: 'Drilled today', waitDays: wait }
    }

    case 'drilled': {
      const since = topic.drilledAt ? daysBetween(topic.drilledAt, now) : 0
      const wait = COMPLETION_GAP_DAYS - since
      return wait <= 0
        ? { due: true, label: 'Ready for the delayed test', waitDays: 0 }
        : { due: false, label: `Delayed test in ${wait} ${wait === 1 ? 'day' : 'days'}`, waitDays: wait }
    }

    case 'completed': {
      const since = topic.lastPracticedAt ? daysBetween(topic.lastPracticedAt, now) : 0
      const wait = SPOT_CHECK_DAYS - since
      return wait <= 0
        ? { due: true, label: 'Spot check ready', waitDays: 0 }
        : { due: false, label: `Spot check in ${wait} ${wait === 1 ? 'day' : 'days'}`, waitDays: wait }
    }
  }
}

export function isDue(topic: Topic, now: Date = new Date()): boolean {
  return dueState(topic, now).due
}

export function dueTopics(topics: Topic[], now: Date = new Date()): Topic[] {
  // Repair first, then the delayed tests that can actually bank a completion,
  // then unfinished work. Within a rank, the longest overdue goes first.
  const rank: Record<Status, number> = {
    decayed: 0,
    drilled: 1,
    learning: 2,
    unstarted: 3,
    completed: 4,
  }
  return topics
    .filter((t) => isDue(t, now) && t.items.length > 0)
    .sort((a, b) => {
      const byRank = rank[a.status] - rank[b.status]
      if (byRank !== 0) return byRank
      return (a.lastPracticedAt ?? '').localeCompare(b.lastPracticedAt ?? '')
    })
}

export interface Resolution {
  topic: Topic
  from: Status
  to: Status
  /** True when this attempt banked a permanent completion. */
  completed: boolean
  /** True when a previously completed topic fell back for repair. */
  decayed: boolean
  /** Gap in days that qualified a completion. */
  gapDays: number | null
}

/**
 * Applies one session's result to a topic and reports the transition, so the
 * session-end screen can name what actually happened rather than reporting a
 * bare score.
 */
export function resolveAttempt(
  topic: Topic,
  correct: number,
  total: number,
  now: Date = new Date(),
): Resolution {
  const at = now.toISOString()
  const clean = total > 0 && correct / total >= PASS_THRESHOLD
  const from = topic.status
  const next: Topic = { ...topic, lastPracticedAt: at }

  let completed = false
  let decayed = false
  let gapDays: number | null = null

  if (from === 'completed') {
    // A spot check. Passing keeps the record; failing routes back to drilling
    // without erasing that the topic was completed.
    if (clean) {
      next.status = 'completed'
    } else {
      next.status = 'decayed'
      decayed = true
    }
  } else if (from === 'drilled') {
    const gap = topic.drilledAt ? daysBetween(topic.drilledAt, now) : 0
    if (clean && gap >= COMPLETION_GAP_DAYS) {
      next.status = 'completed'
      next.completedAt = topic.completedAt ?? at
      completed = true
      gapDays = gap
    } else if (clean) {
      next.status = 'drilled'
    } else {
      next.status = 'learning'
      next.drilledAt = null
    }
  } else {
    // unstarted, learning, decayed
    if (clean) {
      next.status = 'drilled'
      next.drilledAt = at
    } else {
      next.status = 'learning'
    }
  }

  next.history = [...topic.history, { at, correct, total, resolvedTo: next.status }]

  return { topic: next, from, to: next.status, completed, decayed, gapDays }
}
