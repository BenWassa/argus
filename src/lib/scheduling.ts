import type { Mode, Status, Topic } from './types'

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
      const since = topic.learningAt ? daysBetween(topic.learningAt, now) : Infinity
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
      const anchor = topic.spotCheckedAt ?? topic.completedAt
      const since = anchor ? daysBetween(anchor, now) : 0
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
      return (a.lastTestedAt ?? '').localeCompare(b.lastTestedAt ?? '')
    })
}

/**
 * Which mode a topic is actually asking for. The ladder already knows: a rung
 * the user has never seen wants reading, and every other rung wants proving.
 * Voluntary early Tests use the same interaction; evidence policy is enforced
 * when the result resolves rather than by exposing another mode.
 */
export function modeFor(topic: Topic): Mode {
  return topic.status === 'unstarted' ? 'learn' : 'test'
}

/**
 * How far a waiting topic has travelled through its gap, 0 to 1, or null when
 * it is not waiting on one. The row already states the wait in words; this lets
 * a long shelf be scanned without reading every one of them.
 */
export function gapProgress(topic: Topic, now: Date = new Date()): number | null {
  const span =
    topic.status === 'drilled' ? COMPLETION_GAP_DAYS
    : topic.status === 'completed' ? SPOT_CHECK_DAYS
    : null
  if (span === null) return null

  const from = topic.status === 'drilled' ? topic.drilledAt : topic.spotCheckedAt ?? topic.completedAt
  if (!from) return null

  return Math.min(1, Math.max(0, daysBetween(from, now) / span))
}

export type ShelfId = 'due' | 'active' | 'completed' | 'unfinished'

export interface Shelf {
  id: ShelfId
  label: string
  topics: Topic[]
}

/**
 * The library ordered the way the schedule reads it rather than the way the
 * alphabet does. Title order never changes and never decides anything; which
 * shelf a topic sits on answers "what can I do right now" without opening it.
 * Topics with no items are an authoring job, not a testing one, so they are
 * held apart rather than left dimmed in the middle of the list.
 */
export function shelves(topics: Topic[], now: Date = new Date()): Shelf[] {
  const due = dueTopics(topics, now)
  const claimed = new Set(due.map((t) => t.id))
  const rest = topics.filter((t) => !claimed.has(t.id))
  const waiting = rest.filter((t) => t.items.length > 0)

  const byTitle = (a: Topic, b: Topic) => a.title.localeCompare(b.title)
  const bySoonest = (a: Topic, b: Topic) =>
    dueState(a, now).waitDays - dueState(b, now).waitDays || byTitle(a, b)

  const all: Shelf[] = [
    { id: 'due', label: 'Due now', topics: due },
    {
      id: 'active',
      label: 'In progress',
      topics: waiting.filter((t) => t.status !== 'completed').sort(bySoonest),
    },
    {
      id: 'completed',
      label: 'Completed',
      topics: waiting.filter((t) => t.status === 'completed').sort(bySoonest),
    },
    {
      id: 'unfinished',
      label: 'Needs items',
      topics: rest.filter((t) => t.items.length === 0).sort(byTitle),
    },
  ]

  return all.filter((shelf) => shelf.topics.length > 0)
}

/**
 * Reading a topic moves it off `unstarted`, because it has now been seen. No
 * attempt is recorded: nothing was scored. The exposure timestamp starts
 * the one-day learning gap, so a topic read today comes back tomorrow to be
 * drilled rather than immediately.
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
  /** Gap in days that qualified a completion. */
  gapDays: number | null
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
): Resolution {
  const at = now.toISOString()
  const clean = total > 0 && correct / total >= PASS_THRESHOLD
  const from = topic.status
  const next: Topic = { ...topic, lastTestedAt: at }

  let completed = false
  let decayed = false
  let gapDays: number | null = null

  const due = dueState(topic, now).due

  if (from === 'unstarted') {
    // A first Test exposes the whole deck, but it cannot also prove retention.
    // Start the learning gap regardless of score.
    next.status = 'learning'
    next.learningAt = at
  } else if (!due && from !== 'decayed') {
    // An early Test is recorded in history but cannot qualify a rung or reset
    // the learning, completion, or spot-check evidence clocks.
  } else if (from === 'completed') {
    // A spot check. Passing keeps the record; failing routes back to drilling
    // without erasing that the topic was completed.
    if (clean) {
      next.status = 'completed'
      next.spotCheckedAt = at
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
      next.learningAt = at
    }
  } else {
    // learning, decayed
    if (clean) {
      next.status = 'drilled'
      next.drilledAt = at
    } else {
      next.status = 'learning'
      next.learningAt = at
    }
  }

  next.history = [...topic.history, { at, correct, total, resolvedTo: next.status }]

  return { topic: next, from, to: next.status, completed, decayed, gapDays }
}
