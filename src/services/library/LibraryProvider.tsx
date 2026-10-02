import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  emptyLibrary,
  reconcileLoadedLibrary,
} from '../../infrastructure/persistence/libraryMigrations'
import {
  clearLibrary,
  libraryOwner,
  loadLibraryWithReport,
  saveLibrary,
  switchLibraryOwner,
} from '../../infrastructure/persistence/localLibraryRepository'
import { isDemoBuild } from '../../demo/demoMode'
import { demoLibraryWithReport } from '../../demo/demoLibrary'
import type { CatalogReconciliation } from '../../domain/library/catalog'
import { clearAllLessonSittings } from '../../domain/morse/curriculum/lessonSittingStorage'
import { journeyFor } from '../../domain/study/journey'
import type { Topic } from '../../domain/library/topic'
import type { CurrentLibrary } from '../../domain/library/library'

/** Normalize legacy ordinary progress only as part of an explicit topic write. */
function normalizeWrittenTopic(topic: Topic): Topic {
  if (topic.status !== 'drilled' || journeyFor(topic).acquisition.progressive) return topic
  return { ...topic, status: 'completed', completedAt: topic.completedAt ?? topic.drilledAt ?? topic.lastTestedAt ?? topic.createdAt }
}

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
  /** Catalog topics this library has been offered, for sync's library-level record. */
  catalogDelivered: readonly string[] | undefined
  /** The account this library belongs to, or null before any has signed in. */
  owner: string | null
  /**
   * Make the library on screen the signed-in account's own, parking another
   * account's. Throws when that cannot be done safely; see `switchLibraryOwner`.
   */
  bindOwner: (uid: string) => void
  /**
   * Record catalog topics another device has already delivered. The set only
   * grows, so taking the union is the whole merge.
   */
  mergeCatalogDelivered: (ids: readonly string[]) => void
}

const Ctx = createContext<LibraryStore | null>(null)

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [loaded] = useState(loadLibraryWithReport)
  const [library, setLibrary] = useState<CurrentLibrary>(loaded.library)
  const [catalogReport, setCatalogReport] = useState<CatalogReconciliation>(loaded.report)
  const [owner, setOwner] = useState<string | null>(libraryOwner)
  // The switch must park exactly the library that is on screen, including a
  // write that has not re-rendered yet.
  const current = useRef(library)
  current.current = library

  useEffect(() => {
    saveLibrary(library)
  }, [library])

  const upsertTopic = useCallback((written: Topic) => {
    const topic = normalizeWrittenTopic(written)
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
      const written = update(prev.topics[at])
      if (written === prev.topics[at]) return prev
      const next = normalizeWrittenTopic(written)
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
    // Reset in a demo means back to the sample the visitor arrived at.
    const reset = isDemoBuild() ? demoLibraryWithReport() : reconcileLoadedLibrary(emptyLibrary())
    setLibrary(reset.library)
    setCatalogReport(reset.report)
  }, [])

  const bindOwner = useCallback((uid: string) => {
    const switched = switchLibraryOwner(uid, current.current)
    if (switched) {
      // A sitting in progress belongs to the account that started it.
      clearAllLessonSittings()
      current.current = switched.library
      setLibrary(switched.library)
      setCatalogReport(switched.report)
    }
    setOwner(uid)
  }, [])

  const mergeCatalogDelivered = useCallback((ids: readonly string[]) => {
    setLibrary((prev) => {
      const known = new Set(prev.catalogDelivered ?? [])
      if (ids.every((id) => known.has(id))) return prev
      return { ...prev, catalogDelivered: [...new Set([...known, ...ids])].sort() }
    })
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
      catalogDelivered: library.catalogDelivered,
      owner,
      bindOwner,
      mergeCatalogDelivered,
    }),
    [
      library,
      catalogReport,
      upsertTopic,
      updateTopic,
      removeTopic,
      replaceLibrary,
      resetLibrary,
      owner,
      bindOwner,
      mergeCatalogDelivered,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useLibrary(): LibraryStore {
  const store = useContext(Ctx)
  if (!store) throw new Error('useLibrary must be used inside LibraryProvider')
  return store
}
