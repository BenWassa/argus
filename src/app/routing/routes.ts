import type { Topic } from '../../domain/library/topic'
import type { Mode } from '../../domain/study/mode'

/**
 * The route model: what a destination is, whether an unknown value is one, and
 * whether two of them are the same place.
 *
 * Pure data throughout. Nothing here reads `window`, which is what lets a
 * restored history entry be validated against the live library without a
 * browser in the room. The history mechanics live in `history.ts`.
 */

/**
 * Top-level destinations.
 *
 * Two of them are navigation: Today is the docket, Library is everything owned.
 * `profile` is a Today utility with its own route rather than a third thumb-level
 * slot; legacy `data` entries remain valid only for history compatibility.
 * Progress is gone as a destination: its live
 * sections were a third reading of the same `journeyFor` derivation Library
 * already shelves, and its permanent completion record now closes Library.
 */
export type View = 'today' | 'library' | 'profile' | 'data'

export type ParentRoute =
  | { kind: 'section'; view: View }
  | { kind: 'topic'; topicId: string }

/**
 * Which task inside a guided run the learner asked for.
 *
 * The canonical lesson is the default and needs no target: it resumes whatever
 * `startLesson` says is current, which is the whole point of a durable sitting.
 * Replay and checkpoint name a specific path entry, and neither persists any
 * learner state, so a reloaded run entry falling back to its origin loses
 * nothing it was responsible for.
 *
 * Practice names no path entry either, but it may name items. A check's end
 * screen knows exactly what the learner just missed, including for an ordinary
 * topic that keeps no per-item evidence at all, so it hands that set straight
 * to the run. Entered from a topic page instead, `itemIds` is absent and the
 * run derives its own queue from durable evidence. Practice persists nothing
 * either way, so a reloaded entry falling back to its origin loses nothing.
 */
export type RunTarget =
  | { kind: 'lesson' }
  | { kind: 'replay'; index: number }
  | { kind: 'checkpoint'; afterLesson: number }
  | { kind: 'practice'; itemIds?: string[] }

export type AppRoute =
  | ParentRoute
  | { kind: 'run'; mode: Mode; topicIds: string[]; origin: ParentRoute; target?: RunTarget }
  | { kind: 'reference'; topicId: string; origin: ParentRoute }

/** Today is the docket, and the final Argus boundary before platform exit. */
export const ROOT_ROUTE: ParentRoute = { kind: 'section', view: 'today' }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * A history entry naming a destination that no longer exists (`progress`) fails
 * validation, so `readNavigationState` returns null and the app falls back to
 * its root rather than restoring a route it can no longer render.
 */
function isView(value: unknown): value is View {
  return value === 'today' || value === 'library' || value === 'profile' || value === 'data'
}

function isMode(value: unknown): value is Mode {
  return value === 'learn' || value === 'test'
}

function isRunTarget(value: unknown): value is RunTarget {
  if (!isRecord(value)) return false
  if (value.kind === 'lesson') return true
  if (value.kind === 'practice') {
    return value.itemIds === undefined || isIdList(value.itemIds)
  }
  if (value.kind === 'replay') return Number.isInteger(value.index) && (value.index as number) >= 0
  return (
    value.kind === 'checkpoint' &&
    Number.isInteger(value.afterLesson) &&
    (value.afterLesson as number) > 0
  )
}

/** A non-empty list of non-empty identifiers: topic ids, or practice item ids. */
function isIdList(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every((id) => typeof id === 'string' && id.length > 0)
}

export function isParentRoute(value: unknown): value is ParentRoute {
  if (!isRecord(value) || typeof value.kind !== 'string') return false
  if (value.kind === 'section') return isView(value.view)
  return value.kind === 'topic' && typeof value.topicId === 'string' && value.topicId.length > 0
}

export function isAppRoute(value: unknown): value is AppRoute {
  if (isParentRoute(value)) return true
  if (!isRecord(value) || typeof value.kind !== 'string') return false

  if (value.kind === 'run') {
    if (value.target !== undefined && !isRunTarget(value.target)) return false
    return isMode(value.mode) && isIdList(value.topicIds) && isParentRoute(value.origin)
  }

  if (value.kind === 'reference') {
    return typeof value.topicId === 'string' && value.topicId.length > 0 && isParentRoute(value.origin)
  }

  return false
}

export function sameRoute(left: AppRoute, right: AppRoute): boolean {
  if (left.kind !== right.kind) return false

  if (left.kind === 'section' && right.kind === 'section') return left.view === right.view
  if (left.kind === 'topic' && right.kind === 'topic') return left.topicId === right.topicId
  if (left.kind === 'reference' && right.kind === 'reference') {
    return left.topicId === right.topicId && sameParent(left.origin, right.origin)
  }
  if (left.kind === 'run' && right.kind === 'run') {
    return (
      left.mode === right.mode &&
      sameTarget(left.target, right.target) &&
      left.topicIds.length === right.topicIds.length &&
      left.topicIds.every((id, index) => id === right.topicIds[index]) &&
      sameParent(left.origin, right.origin)
    )
  }

  return false
}

function sameTarget(left: RunTarget | undefined, right: RunTarget | undefined): boolean {
  if (!left || !right) return !left && !right
  if (left.kind !== right.kind) return false
  if (left.kind === 'replay' && right.kind === 'replay') return left.index === right.index
  if (left.kind === 'checkpoint' && right.kind === 'checkpoint') {
    return left.afterLesson === right.afterLesson
  }
  if (left.kind === 'practice' && right.kind === 'practice') {
    // Two practice runs over different item sets are different routes. Without
    // this, navigating from one offer to another would be a no-op.
    const leftItems = left.itemIds
    const rightItems = right.itemIds
    if (!leftItems || !rightItems) return !leftItems && !rightItems
    return (
      leftItems.length === rightItems.length &&
      leftItems.every((id, index) => id === rightItems[index])
    )
  }
  return true
}

function sameParent(left: ParentRoute, right: ParentRoute): boolean {
  if (left.kind !== right.kind) return false
  return left.kind === 'section' && right.kind === 'section'
    ? left.view === right.view
    : left.kind === 'topic' && right.kind === 'topic' && left.topicId === right.topicId
}

export function parentFor(route: AppRoute): ParentRoute {
  if (route.kind === 'section' || route.kind === 'topic') return route
  return route.origin
}

function safeParent(route: ParentRoute, topics: Topic[]): ParentRoute {
  if (route.kind === 'section') return route
  return topics.some((topic) => topic.id === route.topicId)
    ? route
    : { kind: 'section', view: 'library' }
}

/**
 * True for a run whose position is durable rather than held in memory.
 *
 * A canonical Morse lesson is the only one. Its retrieval count, correct count,
 * letters to revisit and listening declination live in `Topic.lessonSitting`, so
 * restoring that entry resumes exactly where the learner was rather than
 * fabricating a fresh task. That is what lets the alphabet reference return to
 * the lesson it was opened from instead of abandoning it.
 *
 * A Test run is never resumable: restoring it would start a new scored attempt.
 * A replay or word checkpoint deliberately persists nothing, so there is no
 * position to return to and restoring one would silently restart it.
 */
function resumableRun(route: Extract<AppRoute, { kind: 'run' }>): boolean {
  return route.mode === 'learn' && (route.target?.kind ?? 'lesson') === 'lesson'
}

/**
 * Validate identifiers against the live library. A run that holds its state in
 * memory is deliberately not reconstructed: a reload or Forward traversal falls
 * back to the route that launched it rather than silently starting a fresh
 * scored attempt. A run backed by durable state resumes instead.
 */
export function restoreRoute(route: AppRoute, topics: Topic[], restoreRun: boolean): AppRoute {
  if (route.kind === 'section') return route

  if (route.kind === 'topic') return safeParent(route, topics)

  const origin = safeParent(route.origin, topics)

  if (route.kind === 'reference') {
    return topics.some((topic) => topic.id === route.topicId)
      ? { ...route, origin }
      : origin
  }

  if (!restoreRun && !resumableRun(route)) return origin
  return route.topicIds.every((id) => topics.some((topic) => topic.id === id))
    ? { ...route, origin }
    : origin
}

export function liveRoute(route: AppRoute, topics: Topic[]): AppRoute {
  if (route.kind === 'run') {
    const origin = safeParent(route.origin, topics)
    return route.topicIds.every((id) => topics.some((topic) => topic.id === id))
      ? { ...route, origin }
      : origin
  }
  return restoreRoute(route, topics, true)
}
