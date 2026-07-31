import { useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { shouldShowSplash, SplashScreen } from '../components/SplashScreen'
import { LibraryProvider } from '../lib/store'
import { Today } from '../features/today/Today'
import { Library } from '../features/library/Library'
import { Progress } from '../features/progress/Progress'
import { Data } from '../features/data/Data'
import { Session } from '../features/practice/Session'
import type { View } from '../lib/types'

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

function Routes() {
  const [view, setView] = useState<View>('today')
  const [session, setSession] = useState<string[] | null>(null)
  const [authorOnEntry, setAuthorOnEntry] = useState(false)

  function startSession(topicIds: string[]) {
    if (topicIds.length > 0) setSession(topicIds)
  }

  // A session is a route, not a modal: it owns the whole surface so nothing
  // competes with the prompt, and leaving it is an explicit act.
  if (session) {
    return (
      <div className="app-shell session-shell">
        <main id="main" tabIndex={-1}>
          <Session topicIds={session} onExit={() => setSession(null)} />
        </main>
      </div>
    )
  }

  return (
    <AppShell
      view={view}
      onNavigate={(next) => {
        setAuthorOnEntry(false)
        setView(next)
      }}
    >
      {view === 'today' && (
        <Today
          onStart={startSession}
          onGoToLibrary={() => {
            setAuthorOnEntry(true)
            setView('library')
          }}
        />
      )}
      {view === 'library' && <Library onPractise={startSession} openFormOnMount={authorOnEntry} />}
      {view === 'progress' && <Progress />}
      {view === 'data' && <Data />}
    </AppShell>
  )
}
