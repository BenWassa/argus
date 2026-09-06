import type { Mode, View } from './types'

export const ARGUS_NAVIGATION_VERSION = 1 as const

export type ParentRoute =
  | { kind: 'section'; view: View }
  | { kind: 'topic'; topicId: string }

export type AppRoute =
  | ParentRoute
  | { kind: 'run'; mode: Mode; topicIds: string[]; origin: ParentRoute }
  | { kind: 'reference'; topicId: string; origin: ParentRoute }

export interface ArgusHistoryState {
  argusNavigation: typeof ARGUS_NAVIGATION_VERSION
  index: number
  route: AppRoute
}

type BackBlocker = () => boolean

const backBlockers: { token: symbol; handle: BackBlocker }[] = []
let bypassNextBackBlocker = false

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isView(value: unknown): value is View {
  return value === 'today' || value === 'library' || value === 'progress' || value === 'data'
}

function isMode(value: unknown): value is Mode {
  return value === 'learn' || value === 'test'
}

function isTopicIds(value: unknown): value is string[] {
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
    return isMode(value.mode) && isTopicIds(value.topicIds) && isParentRoute(value.origin)
  }

  if (value.kind === 'reference') {
    return typeof value.topicId === 'string' && value.topicId.length > 0 && isParentRoute(value.origin)
  }

  return false
}

export function readNavigationState(value: unknown = window.history.state): ArgusHistoryState | null {
  if (!isRecord(value)) return null
  if (value.argusNavigation !== ARGUS_NAVIGATION_VERSION) return null
  if (!Number.isInteger(value.index) || (value.index as number) < 0) return null
  if (!isAppRoute(value.route)) return null

  return {
    argusNavigation: ARGUS_NAVIGATION_VERSION,
    index: value.index as number,
    route: value.route,
  }
}

function stateFor(route: AppRoute, index: number): ArgusHistoryState {
  return { argusNavigation: ARGUS_NAVIGATION_VERSION, index, route }
}

export function replaceNavigationState(route: AppRoute, index: number) {
  window.history.replaceState(stateFor(route, index), '')
}

export function pushNavigationState(route: AppRoute, currentIndex: number): number {
  const nextIndex = currentIndex + 1
  window.history.pushState(stateFor(route, nextIndex), '')
  return nextIndex
}

/**
 * Visible Argus Back/Close actions already passed their own product safeguards.
 * Mark exactly the resulting traversal so a Test/dialog blocker does not ask a
 * second time when the browser emits popstate for that deliberate history.back.
 */
export function backNavigation() {
  bypassNextBackBlocker = true
  window.history.back()
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
      left.topicIds.length === right.topicIds.length &&
      left.topicIds.every((id, index) => id === right.topicIds[index]) &&
      sameParent(left.origin, right.origin)
    )
  }

  return false
}

function sameParent(left: ParentRoute, right: ParentRoute): boolean {
  if (left.kind !== right.kind) return false
  return left.kind === 'section' && right.kind === 'section'
    ? left.view === right.view
    : left.kind === 'topic' && right.kind === 'topic' && left.topicId === right.topicId
}

/**
 * Registers a synchronous Back policy for the currently mounted surface.
 * The newest mounted blocker wins, so a dialog naturally takes precedence over
 * the route behind it. Returning true means the caller consumed this Back.
 */
export function registerBackBlocker(handle: BackBlocker): () => void {
  const token = Symbol('argus-back-blocker')
  backBlockers.push({ token, handle })

  return () => {
    const index = backBlockers.findIndex((entry) => entry.token === token)
    if (index >= 0) backBlockers.splice(index, 1)
  }
}

export function consumeBackBlocker(): boolean {
  if (bypassNextBackBlocker) {
    bypassNextBackBlocker = false
    return false
  }
  const blocker = backBlockers[backBlockers.length - 1]
  return blocker ? blocker.handle() : false
}

/** Test-only reset for module-global blocker state. */
export function clearBackBlockersForTests() {
  backBlockers.splice(0, backBlockers.length)
  bypassNextBackBlocker = false
}
