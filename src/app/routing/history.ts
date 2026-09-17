import { isAppRoute, type AppRoute } from './routes'

/**
 * The browser history entry Argus owns, and the Back policy mounted surfaces
 * register against it.
 *
 * Deliberately separate from the route model in `routes.ts`: that file answers
 * "is this a route, and is it the same one?" and can be reasoned about with no
 * browser at all, while everything here touches `window.history` and module
 * state. Keeping the two apart is what lets the route model be tested as pure
 * data and stops history mechanics leaking into surfaces that only need to say
 * where they are.
 */
export const ARGUS_NAVIGATION_VERSION = 1 as const

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
