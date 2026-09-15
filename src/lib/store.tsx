import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { clearLibrary, emptyLibrary, loadLibraryWithReport, reconcileLoadedLibrary, saveLibrary, type LoadedLibrary } from './storage'
import { NO_RECONCILIATION, type CatalogReconciliation } from './catalog'
import { clearAllLessonSittings } from './morseLessonSittingStorage'
import type { CurrentLibrary, Topic } from './types'

interface LibraryStore {
  topics: Topic[]
  /** The whole durable record, so export stays lossless as the shape grows. */
  library: CurrentLibrary
  /** What catalog reconciliation did the last time a library was loaded. */
  catalogReport: CatalogReconciliation
  /** Whole-object replacement for creation, authoring and explicit import. */
  upsertTopic: (topic: Topic) => void
  /** Functional learner-progress update against the latest topic value. */
  updateTopic: (id: string, update: (current: Topic) => Topic) => void
  removeTopic: (id: string) => void
  replaceLibrary: (library: CurrentLibrary) => void
  resetLibrary: () => void
}

const Ctx = createContext<LibraryStore | null>(null)

interface LibraryProviderProps {
  children: ReactNode
  /** Authenticated bootstrap supplies a fully reconciled per-UID record. */
  initial?: LoadedLibrary
  /** Legacy/local-only mode is retained for unit tests and storage tooling. */
  persistLegacy?: boolean
}

export function LibraryProvider({ children, initial, persistLegacy = initial === undefined }: LibraryProviderProps) {
  const [loaded] = useState<LoadedLibrary>(() => initial ?? loadLibraryWithReport())
  const [library, setLibrary] = useState<CurrentLibrary>(loaded.library)
  const [catalogReport, setCatalogReport] = useState<CatalogReconciliation>(loaded.report)

  useEffect(() => {
    if (persistLegacy) saveLibrary(library)
  }, [library, persistLegacy])

  const upsertTopic = useCallback((topic: Topic) => {
    setLibrary((prev) => {
      const i = prev.topics.findIndex((t) => t.id === topic.id)
      const topics =
        i === -1
          ? [...prev.topics, { ...topic, origin: topic.origin ?? ('user' as const) }]
          : prev.topics.map((t, at) => (at === i ? topic : t))
      return { ...prev, topics }
    })
  }, [])

  const updateTopic = useCallback((id: string, update: (current: Topic) => Topic) => {
    setLibrary((prev) => {
      const at = prev.topics.findIndex((topic) => topic.id === id)
      if (at === -1) return prev
      const next = update(prev.topics[at])
      if (next === prev.topics[at]) return prev
      return { ...prev, topics: prev.topics.map((topic, index) => (index === at ? next : topic)) }
    })
  }, [])

  const removeTopic = useCallback((id: string) => {
    setLibrary((prev) => ({ ...prev, topics: prev.topics.filter((t) => t.id !== id) }))
  }, [])

  const replaceLibrary = useCallback((next: CurrentLibrary) => {
    // Import and remote reconciliation both pass through the same catalog
    // boundary. The retired sidecar can never leak into a replacement record.
    clearAllLessonSittings()
    const reconciled = reconcileLoadedLibrary(next)
    setLibrary(reconciled.library)
    setCatalogReport(reconciled.report)
  }, [])

  const resetLibrary = useCallback(() => {
    if (persistLegacy) clearLibrary()
    clearAllLessonSittings()
    setLibrary(emptyLibrary())
    setCatalogReport(NO_RECONCILIATION)
  }, [persistLegacy])

  const value = useMemo(
    () => ({
      topics: library.topics,
      library,
      catalogReport,
      upsertTopic,
      updateTopic,
      removeTopic,
      replaceLibrary,
      resetLibrary,
    }),
    [library, catalogReport, upsertTopic, updateTopic, removeTopic, replaceLibrary, resetLibrary],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useLibrary(): LibraryStore {
  const store = useContext(Ctx)
  if (!store) throw new Error('useLibrary must be used inside LibraryProvider')
  return store
}
