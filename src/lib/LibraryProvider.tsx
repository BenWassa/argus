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
  /**
   * Whole-object replacement. Correct for creation, authoring and import, where
   * replacing the record *is* the intent.
   */
  upsertTopic: (topic: Topic) => void
  /**
   * Functional update, and the primitive independent learner-progress writes
   * should use (#62).
   *
   * Several systems now mutate sibling fields of the same topic — the scheduler,
   * Test cue evidence, Learn support, the finite sitting — and a component that
   * captured a topic when it mounted no longer holds a current one by the time
   * it saves. `upsertTopic(stale)` then quietly reinstates every sibling field
   * as it looked at capture time. Passing an updater instead means the change is
   * applied to whatever the topic is *now*, so two independent writes compose
   * rather than the later one erasing the earlier.
   *
   * The store owns composition only. Domain policy — what a lesson answer means,
   * when a gap is satisfied, which evidence counts — stays in the domain modules
   * and is handed here as a pure `current => next` function. An updater for a
   * topic that no longer exists is dropped rather than recreating it.
   */
  updateTopic: (id: string, update: (current: Topic) => Topic) => void
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
