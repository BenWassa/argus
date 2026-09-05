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
import { MorseReference } from '../features/learn/MorseReference'
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
  /**
   * The Morse alphabet reference (#48). It is a surface, not a third product
   * mode: `Mode` stays `learn | test`, the scheduler never routes to it, and it
   * writes nothing. It owns the whole screen the way Learn and Test do, so its
   * identity is held here rather than inside Library, and it is held as a plain
   * serializable topic id so #45 can turn it into a history route without
   * changing anything about this state.
   */
  const [reference, setReference] = useState<string | null>(null)
  const [authorOnEntry, setAuthorOnEntry] = useState(false)
  const [topicOnEntry, setTopicOnEntry] = useState<string | null>(null)

  function start(mode: Mode, topicIds: string[]) {
    if (topicIds.length > 0) setRun({ mode, topicIds })
  }

  function openReference(topicId: string) {
    setRun(null)
    setReference(topicId)
  }

  /** Closing the reference restores the topic it was opened from. */
  function closeReference() {
    const from = reference
    setReference(null)
    setTopicOnEntry(from)
    setView('library')
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
              onReference={openReference}
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

  if (reference) {
    return (
      <div className="app-shell session-shell">
        <main id="main" tabIndex={-1}>
          <MorseReference onExit={closeReference} />
        </main>
      </div>
    )
  }

  return (
    <AppShell
      view={view}
      onNavigate={(next) => {
        setAuthorOnEntry(false)
        setTopicOnEntry(null)
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
      {view === 'library' && (
        <Library
          onStart={start}
          onOpenReference={openReference}
          openFormOnMount={authorOnEntry}
          openTopicOnMount={topicOnEntry}
        />
      )}
      {view === 'progress' && <Progress />}
      {view === 'data' && <Data />}
    </AppShell>
  )
}
