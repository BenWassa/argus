import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { clearLibrary, emptyLibrary, loadLibraryWithReport, reconcileLoadedLibrary, saveLibrary } from './storage'
import { NO_RECONCILIATION, type CatalogReconciliation } from './catalog'
import { clearAllLessonSittings } from './morseLessonSittingStorage'
import type { CurrentLibrary, Topic } from './types'

interface LibraryStore {
  topics: Topic[]
  /** The whole durable record, so export stays lossless as the shape grows. */
  library: CurrentLibrary
  /** What catalog reconciliation did the last time a library was loaded. */
  catalogReport: CatalogReconciliation
  upsertTopic: (topic: Topic) => void
  removeTopic: (id: string) => void
  replaceLibrary: (library: CurrentLibrary) => void
  resetLibrary: () => void
}

const Ctx = createContext<LibraryStore | null>(null)

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [loaded] = useState(loadLibraryWithReport)
  const [library, setLibrary] = useState<CurrentLibrary>(loaded.library)
  const [catalogReport, setCatalogReport] = useState<CatalogReconciliation>(loaded.report)

  useEffect(() => {
    saveLibrary(library)
  }, [library])

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

  const removeTopic = useCallback((id: string) => {
    setLibrary((prev) => ({ ...prev, topics: prev.topics.filter((t) => t.id !== id) }))
  }, [])

  const replaceLibrary = useCallback((next: CurrentLibrary) => {
    // An imported library goes through the same migration and catalog-delivery
    // boundary as a stored one, so what is on screen after an import is what
    // would be on screen after a reload. An active local-only Morse sitting
    // belongs to the replaced library and must not leak into the imported one.
    clearAllLessonSittings()
    const reconciled = reconcileLoadedLibrary(next)
    setLibrary(reconciled.library)
    setCatalogReport(reconciled.report)
  }, [])

  const resetLibrary = useCallback(() => {
    clearLibrary()
    clearAllLessonSittings()
    setLibrary(emptyLibrary())
    setCatalogReport(NO_RECONCILIATION)
  }, [])

  const value = useMemo(
    () => ({
      topics: library.topics,
      library,
      catalogReport,
      upsertTopic,
      removeTopic,
      replaceLibrary,
      resetLibrary,
    }),
    [library, catalogReport, upsertTopic, removeTopic, replaceLibrary, resetLibrary],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useLibrary(): LibraryStore {
  const store = useContext(Ctx)
  if (!store) throw new Error('useLibrary must be used inside LibraryProvider')
  return store
}
