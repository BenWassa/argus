import { useState } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { shouldShowSplash, SplashScreen } from '../components/SplashScreen'
import { LibraryProvider } from '../lib/store'
import { Today } from '../features/today/Today'
import { Library } from '../features/library/Library'
import { Progress } from '../features/progress/Progress'
import { Data } from '../features/data/Data'
import { Session } from '../features/test/Session'
import { Learn } from '../features/learn/Learn'
import type { Mode, View } from '../lib/types'

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

interface Run {
  mode: Mode
  topicIds: string[]
}

function Routes() {
  const [view, setView] = useState<View>('today')
  const [run, setRun] = useState<Run | null>(null)
  const [authorOnEntry, setAuthorOnEntry] = useState(false)

  function start(mode: Mode, topicIds: string[]) {
    if (topicIds.length > 0) setRun({ mode, topicIds })
  }

  // A run is a route, not a modal: it owns the whole surface so nothing
  // competes with the material, and leaving it is an explicit act.
  if (run) {
    return (
      <div className="app-shell session-shell">
        <main id="main" tabIndex={-1}>
          {run.mode === 'learn' ? (
            <Learn
              key={run.topicIds.join()}
              topicIds={run.topicIds}
              onExit={() => setRun(null)}
              onTest={(ids) => start('test', ids)}
            />
          ) : (
            <Session
              key={`${run.mode}-${run.topicIds.join()}`}
              topicIds={run.topicIds}
              onExit={() => setRun(null)}
            />
          )}
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
          onStart={start}
          onGoToLibrary={() => {
            setAuthorOnEntry(true)
            setView('library')
          }}
        />
      )}
      {view === 'library' && <Library onStart={start} openFormOnMount={authorOnEntry} />}
      {view === 'progress' && <Progress />}
      {view === 'data' && <Data />}
    </AppShell>
  )
}
