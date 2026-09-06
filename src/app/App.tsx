import { useEffect, useRef, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { shouldShowSplash, SplashScreen } from '../components/SplashScreen'
import { LibraryProvider, useLibrary } from '../lib/store'
import { Today } from '../features/today/Today'
import { Library } from '../features/library/Library'
import { Progress } from '../features/progress/Progress'
import { Data } from '../features/data/Data'
import { Session } from '../features/test/Session'
import { Learn } from '../features/learn/Learn'
import { MorseReference } from '../features/learn/MorseReference'
import {
  consumeBackBlocker,
  pushNavigationState,
  readNavigationState,
  replaceNavigationState,
  sameRoute,
  type AppRoute,
  type ParentRoute,
} from '../lib/navigation'
import type { Mode, Topic, View } from '../lib/types'

const ROOT_ROUTE: ParentRoute = { kind: 'section', view: 'today' }

export function App() {
  const [showSplash, setShowSplash] = useState(shouldShowSplash)

  function finishSplash() {
    setShowSplash(false)
    window.requestAnimationFrame(() => document.getElementById('main')?.focus())
  }

  return (
    <LibraryProvider>
      <div className="app-runtime" aria-hidden={showSplash || undefined}>
        <Routes />
      </div>
      {showSplash && <SplashScreen onComplete={finishSplash} />}
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
 * Validate identifiers against the live library. A restored run is deliberately
 * not reconstructed: Test/Learn session state is in memory, not history, so a
 * reload/Forward traversal falls back to the route that launched it rather than
 * silently starting a fresh scored attempt.
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

  if (!restoreRun) return origin
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

      const direction = Math.sign(state.index - historyIndex.current)

      if (direction < 0 && consumeBackBlocker()) {
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

      const next = restoreRoute(state.route, topicsRef.current, false)
      if (!sameRoute(next, state.route)) replaceNavigationState(next, state.index)

      historyIndex.current = state.index
      routeRef.current = next
      setAuthorOnEntry(false)
      setRoute(next)
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Topic deletion or another live-library change can invalidate the route
  // currently on screen. Replace it in place so stale history degrades safely
  // without adding a phantom Back stop.
  useEffect(() => {
    const next = liveRoute(routeRef.current, topics)
    if (sameRoute(next, routeRef.current)) return
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
    window.history.back()
  }

  function start(mode: Mode, topicIds: string[], replace = false) {
    if (topicIds.length === 0) return
    const current = routeRef.current
    const origin = replace && current.kind === 'run' ? current.origin : parentFor(current)
    navigate({ kind: 'run', mode, topicIds, origin }, replace)
  }

  function openReference(topicId: string, replace = false) {
    const current = routeRef.current
    const origin = replace && current.kind === 'run' ? current.origin : parentFor(current)
    navigate({ kind: 'reference', topicId, origin }, replace)
  }

  function navigateSection(next: View) {
    const current = routeRef.current
    setAuthorOnEntry(false)

    if (current.kind === 'section' && current.view === next) return
    // Library is already the active section while a Topic page is open. Its
    // nav button therefore behaves like the page's visible Back control rather
    // than pushing a duplicate Library stop.
    if (current.kind === 'topic' && next === 'library') {
      goBack()
      return
    }

    navigate({ kind: 'section', view: next })
  }

  if (route.kind === 'run') {
    return (
      <div className="app-shell session-shell">
        <main id="main" tabIndex={-1}>
          {route.mode === 'learn' ? (
            <Learn
              key={route.topicIds.join()}
              topicIds={route.topicIds}
              onExit={goBack}
              onTest={(ids) => start('test', ids, true)}
              onReference={(topicId) => openReference(topicId, true)}
            />
          ) : (
            <Session
              key={`${route.mode}-${route.topicIds.join()}`}
              topicIds={route.topicIds}
              onExit={goBack}
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

  return (
    <AppShell view={view} onNavigate={navigateSection}>
      {view === 'today' && (
        <Today
          onStart={start}
          onGoToLibrary={() => {
            setAuthorOnEntry(true)
            navigate({ kind: 'section', view: 'library' })
          }}
        />
      )}
      {view === 'library' && (
        <Library
          onStart={start}
          onOpenReference={(id) => openReference(id)}
          openFormOnMount={authorOnEntry}
          openTopicOnMount={topicId}
          onOpenTopic={(id) => navigate({ kind: 'topic', topicId: id })}
          onCloseTopic={goBack}
        />
      )}
      {view === 'progress' && <Progress />}
      {view === 'data' && <Data />}
    </AppShell>
  )
}
