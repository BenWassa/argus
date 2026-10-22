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
  adoptLegacyLessonSittings,
  emptyLibrary,
  freshSeedLibrary,
  reconcileLoadedLibrary,
} from '../../infrastructure/persistence/libraryMigrations'
import {
  clearLibrary,
  libraryOwner,
  loadLibraryWithReport,
  saveLibrary,
  switchLibraryOwner,
} from '../../infrastructure/persistence/localLibraryRepository'
import { openIndexedLibraryRepository, type IndexedLibraryRepository } from '../../infrastructure/persistence/indexedLibraryRepository'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'
import { isDemoBuild } from '../../demo/demoMode'
import { demoLibraryWithReport } from '../../demo/demoLibrary'
import type { CatalogReconciliation } from '../../domain/library/catalog'
import { clearAllLessonSittings } from '../../domain/morse/curriculum/lessonSittingStorage'
import { journeyFor } from '../../domain/study/journey'
import type { Topic } from '../../domain/library/topic'
import type { CurrentLibrary } from '../../domain/library/library'
import { captureRoleAwards, mergeRoleAwards, type RoleAward } from '../../domain/roles/awards'

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
  upsertTopic: (topic: Topic) => void | Promise<boolean>
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
  updateTopic: (id: string, update: (current: Topic) => Topic) => void | Promise<boolean>
  removeTopic: (id: string) => void | Promise<boolean>
  replaceLibrary: (library: CurrentLibrary) => void | Promise<boolean>
  resetLibrary: () => void | Promise<boolean>
  /** Catalog topics this library has been offered, for sync's library-level record. */
  catalogDelivered: readonly string[] | undefined
  /** The account this library belongs to, or null before any has signed in. */
  owner: string | null
  /**
   * Make the library on screen the signed-in account's own, parking another
   * account's. Throws when that cannot be done safely; see `switchLibraryOwner`.
   */
  bindOwner: (uid: string) => void | Promise<void>
  /**
   * Record catalog topics another device has already delivered. The set only
   * grows, so taking the union is the whole merge.
   */
  mergeCatalogDelivered: (ids: readonly string[]) => void
  roleAwards: readonly RoleAward[] | undefined
  roleAwardGeneration: number | undefined
  mergeRoleAwards: (awards: readonly RoleAward[], generation: number) => void
}

const Ctx = createContext<LibraryStore | null>(null)

function DemoLibraryProvider({ children }: { children: ReactNode }) {
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
      return captureRoleAwards({ ...prev, topics })
    })
  }, [])

  const updateTopic = useCallback((id: string, update: (current: Topic) => Topic) => {
    setLibrary((prev) => {
      const at = prev.topics.findIndex((topic) => topic.id === id)
      if (at === -1) return prev
      const written = update(prev.topics[at])
      if (written === prev.topics[at]) return prev
      const next = normalizeWrittenTopic(written)
      return captureRoleAwards({ ...prev, topics: prev.topics.map((topic, index) => (index === at ? next : topic)) })
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
    // Import replaces topics, but cannot revoke awards already earned here.
    setLibrary((prev) => captureRoleAwards({
      ...reconciled.library,
      roleAwards: mergeRoleAwards(prev.roleAwards ?? [], reconciled.library.roleAwards ?? []),
      roleAwardGeneration: prev.roleAwardGeneration ?? 0,
    }))
    setCatalogReport(reconciled.report)
  }, [])

  const resetLibrary = useCallback(() => {
    clearLibrary()
    clearAllLessonSittings()
    // Reset in a demo means back to the sample the visitor arrived at.
    const reset = isDemoBuild() ? demoLibraryWithReport() : reconcileLoadedLibrary(emptyLibrary())
    setLibrary({ ...reset.library, roleAwards: [], roleAwardGeneration: (current.current.roleAwardGeneration ?? 0) + 1 })
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

  const mergeAwards = useCallback((awards: readonly RoleAward[], generation: number) => {
    setLibrary((prev) => {
      const localGeneration = prev.roleAwardGeneration ?? 0
      if (generation < localGeneration) return prev
      const merged = generation > localGeneration ? mergeRoleAwards(awards) : mergeRoleAwards(prev.roleAwards ?? [], awards)
      if (generation === localGeneration && JSON.stringify(merged) === JSON.stringify(prev.roleAwards ?? [])) return prev
      return { ...prev, roleAwards: merged, roleAwardGeneration: generation }
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
      roleAwards: library.roleAwards,
      roleAwardGeneration: library.roleAwardGeneration,
      mergeRoleAwards: mergeAwards,
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
      mergeAwards,
    ],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}


/** Owner-scoped migration inputs are read only. Legacy bytes are never deleted
 * until a separate, explicitly verified cleanup is introduced. */
function legacyFor(owner: string, previousOwner: string | null): { key: string; raw: string } | undefined {
  if (previousOwner !== null && previousOwner !== owner) {
    const key = `argus.library.parked.v1.${owner}`
    const raw = localStorage.getItem(key)
    return raw === null ? undefined : { key, raw }
  }
  for (const key of ['argus.library.v5', 'argus.library.v4', 'argus.library.v3', 'argus.library.v2']) {
    const raw = localStorage.getItem(key)
    if (raw !== null) return { key, raw }
  }
  return undefined
}

function migrationSeed(legacy: { key: string; raw: string } | undefined): CurrentLibrary {
  if (!legacy) return freshSeedLibrary()
  // Do not call the old localStorage loader: it promotes and overwrites bytes,
  // and silently seeds after a parse failure.
  let value: unknown
  try { value = JSON.parse(legacy.raw) }
  catch { throw new Error(`Cannot migrate ${legacy.key}; original data was preserved.`) }
  const parsed = parseLibrary(value)
  if (!parsed.ok) throw new Error(`Cannot migrate ${legacy.key}: ${parsed.error}. Original data was preserved.`)
  return reconcileLoadedLibrary(parsed.library).library
}

/** Production: committed IndexedDB state is the only published learner state. */
function IndexedLibraryProvider({ children }: { children: ReactNode }) {
  const [library, setLibrary] = useState<CurrentLibrary>(() => freshSeedLibrary())
  const [catalogReport, setCatalogReport] = useState<CatalogReconciliation>(
    () => reconcileLoadedLibrary(freshSeedLibrary()).report,
  )
  const [owner, setOwner] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const repository = useRef<IndexedLibraryRepository | null>(null)
  const activeOwner = useRef<string | null>(null)
  const queue = useRef<Promise<unknown>>(Promise.resolve())
  const current = useRef(library)
  current.current = library
  // An unclaimed library stays separate from all UID namespaces.
  const localOwner = '__argus_unclaimed_local__'

  const install = useCallback((next: CurrentLibrary) => {
    const reconciled = reconcileLoadedLibrary(next)
    current.current = reconciled.library
    setLibrary(reconciled.library)
    setCatalogReport(reconciled.report)
  }, [])

  useEffect(() => {
    let cancelled = false
    let connection: IndexedLibraryRepository | null = null
    void (async () => {
      try {
        const db = await openIndexedLibraryRepository()
        connection = db
        if (cancelled) { db.close(); return }
        repository.current = db
        const previous = libraryOwner()
        const key = previous ?? localOwner
        const existing = await db.read(key)
        const legacy = existing ? undefined : legacyFor(key, previous)
        await db.initialize(key, { seed: existing?.library ?? migrationSeed(legacy), legacy })
        // Reconciliation and retired sitting adoption must be durable before
        // any recovered topic is exposed. No old bytes are removed on failure.
        const row = await db.update(key, (library) =>
          reconcileLoadedLibrary(adoptLegacyLessonSittings(library)).library)
        if (cancelled) return
        clearAllLessonSittings()
        activeOwner.current = key
        setOwner(previous)
        install(row.library)
        setReady(true)
      } catch (error) {
        if (!cancelled) setFailure(error instanceof Error ? error.message : 'Local storage could not be opened.')
      }
    })()
    return () => {
      cancelled = true
      // Do not close the database during a pending transaction.
      void queue.current.finally(() => {
        connection?.close()
        if (repository.current === connection) repository.current = null
      })
    }
  }, [install])

  /** Serialize against IndexedDB, not a render-time snapshot. A rejected
   * transaction never updates the visible library or outbox. */
  const transact = useCallback((change: (previous: CurrentLibrary) => CurrentLibrary) => {
    const run = async () => {
      const db = repository.current
      const key = activeOwner.current
      if (!db || !key) throw new Error('Local storage is not ready.')
      const row = await db.update(key, change)
      if (activeOwner.current === key) install(row.library)
      setFailure(null)
    }
    const result = queue.current.then(run).then(() => true, (error: unknown) => {
      setFailure(error instanceof Error ? error.message : 'This change could not be saved.')
      return false
    })
    queue.current = result
    return result
  }, [install])

  const upsertTopic = useCallback((written: Topic) => {
    const topic = normalizeWrittenTopic(written)
    return transact((prev) => {
      const i = prev.topics.findIndex((t) => t.id === topic.id)
      const topics = i < 0
        ? [...prev.topics, { ...topic, origin: topic.origin ?? ('user' as const) }]
        : prev.topics.map((t, at) => at === i ? topic : t)
      return captureRoleAwards({ ...prev, topics })
    })
  }, [transact])

  const updateTopic = useCallback((id: string, update: (current: Topic) => Topic) => {
    return transact((prev) => {
      const at = prev.topics.findIndex((topic) => topic.id === id)
      if (at < 0) return prev
      const next = update(prev.topics[at])
      if (next === prev.topics[at]) return prev
      return captureRoleAwards({
        ...prev, topics: prev.topics.map((t, i) => i === at ? normalizeWrittenTopic(next) : t),
      })
    })
  }, [transact])

  const removeTopic = useCallback((id: string) => {
    return transact((prev) => ({ ...prev, topics: prev.topics.filter((t) => t.id !== id) }))
  }, [transact])

  const replaceLibrary = useCallback((next: CurrentLibrary) => {
    const reconciled = reconcileLoadedLibrary(next)
    return transact((prev) => captureRoleAwards({
      ...reconciled.library,
      roleAwards: mergeRoleAwards(prev.roleAwards ?? [], reconciled.library.roleAwards ?? []),
      roleAwardGeneration: prev.roleAwardGeneration ?? 0,
    })).then((saved) => { if (saved) clearAllLessonSittings(); return saved })
    // Sidecar is retired only after the canonical transaction succeeds.
  }, [transact])

  const resetLibrary = useCallback(() => {
    return transact((prev) => ({
      ...reconcileLoadedLibrary(emptyLibrary()).library,
      roleAwards: [],
      roleAwardGeneration: (prev.roleAwardGeneration ?? 0) + 1,
    })).then((saved) => { if (saved) clearAllLessonSittings(); return saved })
  }, [transact])

  const bindOwner = useCallback(async (uid: string) => {
    if (!uid || uid.length > 256) throw new Error('Invalid account identifier.')
    await queue.current
    const db = repository.current
    const previousKey = activeOwner.current
    if (!db || !previousKey) throw new Error('Local storage is unavailable.')
    if (previousKey === uid) { setOwner(uid); return }
    const previous = libraryOwner()
    // An unclaimed local library is claimable exactly once; a library already
    // assigned to another UID never becomes a seed for this UID.
    const local = previous === null ? await db.read(previousKey) : null
    const existing = await db.read(uid)
    const legacy = existing || local ? undefined : legacyFor(uid, previous)
    const seed = existing?.library ?? local?.library ?? migrationSeed(legacy)
    await db.initialize(uid, { seed, ...(legacy ? { legacy } : {}) })
    const row = await db.update(uid, (library) => reconcileLoadedLibrary(library).library)
    // A failed owner marker is a failed account switch; never publish the new
    // account using an ambiguous owner marker.
    localStorage.setItem('argus.library.owner.v1', uid)
    activeOwner.current = uid
    clearAllLessonSittings()
    install(row.library)
    setOwner(uid)
    setFailure(null)
  }, [install])

  const mergeCatalogDelivered = useCallback((ids: readonly string[]) => {
    return transact((prev) => {
      const known = new Set(prev.catalogDelivered ?? [])
      if (ids.every((id) => known.has(id))) return prev
      return { ...prev, catalogDelivered: [...new Set([...known, ...ids])].sort() }
    })
  }, [transact])

  const mergeAwards = useCallback((awards: readonly RoleAward[], generation: number) => {
    return transact((prev) => {
      const localGeneration = prev.roleAwardGeneration ?? 0
      if (generation < localGeneration) return prev
      const merged = generation > localGeneration
        ? mergeRoleAwards(awards)
        : mergeRoleAwards(prev.roleAwards ?? [], awards)
      if (generation === localGeneration && JSON.stringify(merged) === JSON.stringify(prev.roleAwards ?? [])) return prev
      return { ...prev, roleAwards: merged, roleAwardGeneration: generation }
    })
  }, [transact])

  const value = useMemo<LibraryStore>(() => ({
    topics: library.topics, library, catalogReport, upsertTopic, updateTopic,
    removeTopic, replaceLibrary, resetLibrary, catalogDelivered: library.catalogDelivered,
    owner, bindOwner, mergeCatalogDelivered, roleAwards: library.roleAwards,
    roleAwardGeneration: library.roleAwardGeneration, mergeRoleAwards: mergeAwards,
  }), [library, catalogReport, upsertTopic, updateTopic, removeTopic, replaceLibrary,
    resetLibrary, owner, bindOwner, mergeCatalogDelivered, mergeAwards])

  if (failure && !ready) return <main role="alert">
    <p>Argus cannot open the local learner library. Existing data has not been replaced.</p>
    <p>{failure}</p>
    <button onClick={() => window.location.reload()}>Retry</button>
  </main>
  if (!ready) return <main role="status">Opening your local library…</main>
  return <Ctx.Provider value={value}>
    {failure && <div role="alert" aria-live="assertive">
      Progress was not saved on this device: {failure}
    </div>}
    {children}
  </Ctx.Provider>
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  // Existing synchronous JSDOM fixtures test domain/UI behavior against the
  // legacy repository. Dedicated transaction tests explicitly opt into the
  // production provider; browser builds always use IndexedDB.
  const useLegacyFixture = import.meta.env.MODE === 'test'
    && !(globalThis as { __argusIndexedProviderTests?: boolean }).__argusIndexedProviderTests
  return isDemoBuild() || useLegacyFixture
    ? <DemoLibraryProvider>{children}</DemoLibraryProvider>
    : <IndexedLibraryProvider>{children}</IndexedLibraryProvider>
}

export function useLibrary(): LibraryStore {
  const store = useContext(Ctx)
  if (!store) throw new Error('useLibrary must be used inside LibraryProvider')
  return store
}
