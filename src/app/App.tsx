import { useEffect, useRef, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { shouldShowSplash, SplashScreen } from '../components/SplashScreen'
import { LibraryProvider, useLibrary } from '../lib/store'
import { SyncProvider } from '../lib/sync/SyncProvider'
import { Today } from '../features/today/Today'
import { Library } from '../features/library/Library'
import { Data } from '../features/data/Data'
import { Session } from '../features/test/Session'
import { LessonRun } from '../features/learn/LessonRun'
import { PracticeRun } from '../features/practice/PracticeRun'
import { MorseReference } from '../features/learn/MorseReference'
import {
  backNavigation,
  consumeBackBlocker,
  pushNavigationState,
  readNavigationState,
  replaceNavigationState,
  sameRoute,
  type AppRoute,
  type ParentRoute,
} from '../lib/navigation'
import type { Mode, Topic, View } from '../lib/types'
import type { RunTarget } from '../lib/navigation'

const ROOT_ROUTE: ParentRoute = { kind: 'section', view: 'today' }

export function App() {
  const [showSplash, setShowSplash] = useState(shouldShowSplash)

  function finishSplash() {
    setShowSplash(false)
    window.requestAnimationFrame(() => document.getElementById('main')?.focus())
  }

  return (
    <LibraryProvider>
      <SyncProvider>
        <div className="app-runtime" aria-hidden={showSplash || undefined}>
          <Routes />
        </div>
        {showSplash && <SplashScreen onComplete={finishSplash} />}
      </SyncProvider>
    </LibraryProvider>
  )
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
function restoreRoute(route: AppRoute, topics: Topic[], restoreRun: boolean): AppRoute {
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

function liveRoute(route: AppRoute, topics: Topic[]): AppRoute {
  if (route.kind === 'run') {
    const origin = safeParent(route.origin, topics)
    return route.topicIds.every((id) => topics.some((topic) => topic.id === id))
      ? { ...route, origin }
      : origin
  }
  return restoreRoute(route, topics, true)
}

function parentFor(route: AppRoute): ParentRoute {
  if (route.kind === 'section' || route.kind === 'topic') return route
  return route.origin
}

function focusAfterTraversal(previous: AppRoute, next: AppRoute) {
  if (sameRoute(previous, next)) return
  if (next.kind !== 'section') return

  // Topic -> Library has a stronger target: Library restores the row that
  // launched the Topic, with #main as its own fallback when that row vanished.
  if (previous.kind === 'topic' && next.view === 'library') return

  window.requestAnimationFrame(() => document.getElementById('main')?.focus())
}

function Routes() {
  const { topics } = useLibrary()
  const [initialHistory] = useState(readNavigationState)
  const [route, setRoute] = useState<AppRoute>(() =>
    restoreRoute(initialHistory?.route ?? ROOT_ROUTE, topics, false),
  )
  const [authorOnEntry, setAuthorOnEntry] = useState(false)

  const routeRef = useRef(route)
  routeRef.current = route
  const topicsRef = useRef(topics)
  topicsRef.current = topics
  const historyIndex = useRef(initialHistory?.index ?? 0)
  const blockedBackBounce = useRef(false)

  useEffect(() => {
    // Seed/normalise the existing document entry. Never push a synthetic root:
    // Today must remain the final Argus boundary before browser/platform exit.
    replaceNavigationState(routeRef.current, historyIndex.current)

    function onPopState(event: PopStateEvent) {
      const state = readNavigationState(event.state)
      if (!state) {
        // This is not an Argus-owned entry. Do not trap it or repush Today; the
        // browser/OS owns traversal beyond the Argus root.
        return
      }

      // A guarded Back has already moved the browser cursor to the prior entry.
      // `history.forward()` returns it to the route that never actually left;
      // this popstate is only that cursor correction, not a route restoration.
      if (blockedBackBounce.current && state.index === historyIndex.current) {
        blockedBackBounce.current = false
        return
      }

      const direction = Math.sign(state.index - historyIndex.current)

      if (direction < 0 && consumeBackBlocker()) {
        blockedBackBounce.current = true
        // The browser cursor already moved when popstate fired. Bounce to the
        // still-current Argus entry without applying the target route; the
        // blocker has reused the surface's existing close/confirmation policy.
        window.history.forward()
        return
      }

      // A completed/exited run has no persistent in-progress state to restore.
      // Forward into its old entry is therefore declined rather than replaying
      // Learn/Test side effects or creating a fresh scored attempt.
      if (direction > 0 && state.route.kind === 'run') {
        window.history.back()
        return
      }

      const previous = routeRef.current
      const next = restoreRoute(state.route, topicsRef.current, false)
      if (!sameRoute(next, state.route)) replaceNavigationState(next, state.index)

      historyIndex.current = state.index
      routeRef.current = next
      setAuthorOnEntry(false)
      setRoute(next)
      focusAfterTraversal(previous, next)
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Topic deletion is itself a meaningful return to Library. Use the existing
  // previous Library entry instead of replacing the Topic entry with a second
  // consecutive Library stop that would require an extra system Back.
  useEffect(() => {
    const current = routeRef.current
    if (current.kind === 'topic' && !topics.some((topic) => topic.id === current.topicId)) {
      backNavigation()
      return
    }

    // Other live-library changes can invalidate a run/reference origin. Replace
    // those in place so stale history degrades safely without a phantom stop.
    const next = liveRoute(current, topics)
    if (sameRoute(next, current)) return
    replaceNavigationState(next, historyIndex.current)
    routeRef.current = next
    setRoute(next)
  }, [topics])

  // Today -> Library authoring is intentionally one-shot UI state. History
  // Forward can restore Library, but must not replay opening the form.
  useEffect(() => {
    if (!authorOnEntry) return
    if (route.kind === 'section' && route.view === 'library') setAuthorOnEntry(false)
  }, [authorOnEntry, route])

  function navigate(next: AppRoute, replace = false) {
    if (sameRoute(next, routeRef.current)) return

    if (replace) replaceNavigationState(next, historyIndex.current)
    else historyIndex.current = pushNavigationState(next, historyIndex.current)

    routeRef.current = next
    setRoute(next)
  }

  function goBack() {
    backNavigation()
  }

  function start(mode: Mode, topicIds: string[], target?: RunTarget, replace = false) {
    if (topicIds.length === 0) return
    const current = routeRef.current
    const origin = replace && current.kind === 'run' ? current.origin : parentFor(current)
    navigate({ kind: 'run', mode, topicIds, origin, target }, replace)
  }

  /**
   * The alphabet, and then back to whatever asked for it.
   *
   * This used to rewrite history: it replaced the running Learn entry with a
   * Topic entry and pushed the reference above that, because a Back into a run
   * entry always fell through to the run's origin and would have abandoned the
   * lesson. A canonical lesson is now restorable from its durable sitting, so
   * the reference is simply pushed and Back lands on the surface it was opened
   * from, lesson included. The reference itself still writes nothing.
   */
  function openReference(topicId: string) {
    const current = routeRef.current
    const origin: ParentRoute =
      current.kind === 'section' || current.kind === 'topic' ? current : current.origin
    navigate({ kind: 'reference', topicId, origin })
  }

  function navigateSection(next: View) {
    const current = routeRef.current
    setAuthorOnEntry(false)

    if (current.kind === 'section' && current.view === next) return
    // Library is already the active section while a Topic page or the Data
    // utility is open. Its nav button therefore behaves like that page's visible
    // Back control rather than pushing a duplicate Library stop.
    if (next === 'library') {
      if (current.kind === 'topic') {
        goBack()
        return
      }
      if (current.kind === 'section' && current.view === 'data') {
        goBack()
        return
      }
    }

    navigate({ kind: 'section', view: next })
  }

  if (route.kind === 'run') {
    // Practice is the one run that takes a whole Topic rather than an id, so it
    // gets its own branch. `restoreRoute`/`liveRoute` already drop a run naming
    // a topic the library no longer holds, which makes the missing case belt
    // and braces — but a non-null assertion would be the wrong way to say so.
    if (route.mode === 'learn' && route.target?.kind === 'practice') {
      const practiceTopic = topics.find((candidate) => candidate.id === route.topicIds[0])
      if (!practiceTopic) return null
      const practiceItems = route.target.itemIds
      return (
        <div className="app-shell session-shell">
          <main id="main" tabIndex={-1}>
            <PracticeRun
              key={`practice-${practiceTopic.id}-${practiceItems?.join() ?? 'derived'}`}
              topic={practiceTopic}
              itemIds={practiceItems}
              onExit={goBack}
              onCheck={() => start('test', route.topicIds, undefined, true)}
            />
          </main>
        </div>
      )
    }

    return (
      <div className="app-shell session-shell">
        <main id="main" tabIndex={-1}>
          {route.mode === 'learn' ? (
            <LessonRun
              key={`${route.topicIds[0]}-${route.target?.kind ?? 'lesson'}`}
              topicId={route.topicIds[0]}
              target={route.target ?? { kind: 'lesson' }}
              onExit={goBack}
              onCheck={() => start('test', route.topicIds, undefined, true)}
              onReference={() => openReference(route.topicIds[0])}
            />
          ) : (
            <Session
              key={`${route.mode}-${route.topicIds.join()}`}
              topicIds={route.topicIds}
              onExit={goBack}
              // Replaces the finished check in history rather than stacking on
              // top of it: Back from practice should reach whatever launched
              // the check, not a completed run that would restart on entry.
              onPractice={(topicId, itemIds) =>
                start('learn', [topicId], { kind: 'practice', itemIds }, true)
              }
            />
          )}
        </main>
      </div>
    )
  }

  if (route.kind === 'reference') {
    return (
      <div className="app-shell session-shell">
        <main id="main" tabIndex={-1}>
          <MorseReference onExit={goBack} />
        </main>
      </div>
    )
  }

  const view: View = route.kind === 'topic' ? 'library' : route.view
  const topicId = route.kind === 'topic' ? route.topicId : null
  // Topic and Data are both children of Library, so both mark Library current.
  // The bar names where you are in the app, not which component is mounted.
  const navView = view === 'data' ? 'library' : view

  return (
    <AppShell view={navView} onNavigate={navigateSection}>
      {view === 'today' && (
        <Today
          onStart={start}
          onOpenTopic={(id) => navigate({ kind: 'topic', topicId: id })}
          onGoToLibrary={() => {
            setAuthorOnEntry(true)
            navigate({ kind: 'section', view: 'library' })
          }}
        />
      )}
      {view === 'library' && (
        <Library
          onStart={start}
          onReference={openReference}
          openFormOnMount={authorOnEntry}
          openTopicOnMount={topicId}
          onOpenTopic={(id) => navigate({ kind: 'topic', topicId: id })}
          onCloseTopic={goBack}
          onOpenData={() => navigate({ kind: 'section', view: 'data' })}
        />
      )}
      {view === 'data' && <Data onBack={goBack} />}
    </AppShell>
  )
}
