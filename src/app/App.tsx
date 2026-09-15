import { useEffect, useRef, useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { shouldShowSplash, SplashScreen } from '../components/SplashScreen'
import { AuthEntry } from '../components/AuthEntry'
import { AuthenticatedRoot } from '../components/AuthenticatedRoot'
import { useAuthSession } from '../lib/auth'
import { useLibrary } from '../lib/store'
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
  const auth = useAuthSession()
  const [showSplash, setShowSplash] = useState(shouldShowSplash)

  function finishSplash() {
    setShowSplash(false)
    window.requestAnimationFrame(() => document.getElementById('main')?.focus())
  }

  // The first-visit brand treatment remains intact, but learner routes are not
  // mounted behind it. Auth restoration can run while the intro plays.
  if (showSplash) return <SplashScreen onComplete={finishSplash} />

  if (auth.status === 'loading') return <AuthEntry state="loading" />
  if (auth.status === 'signed-out') {
    return <AuthEntry state="signed-out" onSignIn={() => void auth.signIn()} />
  }
  if (auth.status === 'error') {
    return <AuthEntry state="error" message={auth.error} onRetry={auth.retry} />
  }

  const accountLabel = auth.user.displayName ?? auth.user.email ?? 'Google account'
  return (
    <AuthenticatedRoot user={auth.user} onSignOut={() => void auth.signOut()}>
      <Routes accountLabel={accountLabel} onSignOut={() => void auth.signOut()} />
    </AuthenticatedRoot>
  )
}

function safeParent(route: ParentRoute, topics: Topic[]): ParentRoute {
  if (route.kind === 'section') return route
  return topics.some((topic) => topic.id === route.topicId)
    ? route
    : { kind: 'section', view: 'library' }
}

/** True for a run whose position is durable rather than held in memory. */
function resumableRun(route: Extract<AppRoute, { kind: 'run' }>): boolean {
  return route.mode === 'learn' && (route.target?.kind ?? 'lesson') === 'lesson'
}

/** Validate identifiers against the live reconciled library. */
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

  if (previous.kind === 'topic' && next.view === 'library') return
  window.requestAnimationFrame(() => document.getElementById('main')?.focus())
}

interface RoutesProps {
  accountLabel: string
  onSignOut: () => void
}

function Routes({ accountLabel, onSignOut }: RoutesProps) {
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
    replaceNavigationState(routeRef.current, historyIndex.current)

    function onPopState(event: PopStateEvent) {
      const state = readNavigationState(event.state)
      if (!state) return

      if (blockedBackBounce.current && state.index === historyIndex.current) {
        blockedBackBounce.current = false
        return
      }

      const direction = Math.sign(state.index - historyIndex.current)

      if (direction < 0 && consumeBackBlocker()) {
        blockedBackBounce.current = true
        window.history.forward()
        return
      }

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

  useEffect(() => {
    const current = routeRef.current
    if (current.kind === 'topic' && !topics.some((topic) => topic.id === current.topicId)) {
      backNavigation()
      return
    }

    const next = liveRoute(current, topics)
    if (sameRoute(next, current)) return
    replaceNavigationState(next, historyIndex.current)
    routeRef.current = next
    setRoute(next)
  }, [topics])

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
      {view === 'data' && <Data onBack={goBack} accountLabel={accountLabel} onSignOut={onSignOut} />}
    </AppShell>
  )
}
