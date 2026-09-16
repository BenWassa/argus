import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { syncConfig } from './config'
import { firebaseSyncBackend } from './firebaseSync'
import { unconfiguredSyncBackend, type SyncBackend, type SyncUser } from './backend'
import { loadLedger, saveLedger } from './ledger'
import { forgetSignedIn, hasSignedIn, rememberSignedIn } from './session'
import { nextLedger, planSync, topicJson, type Ledger, type RemoteRecord, type SyncAction } from './plan'
import {
  bindLegacyLibrary,
  clearPending,
  freshLibrary,
  hasPending,
  libraryMetaJson,
  markPending,
  parseLibraryMeta,
  preserveRecovery,
  readLocalLibrary,
  writeLocalLibrary,
  type LocalLibraryCandidate,
} from './local'
import { emptyLibrary, parseLibrary, reconcileLoadedLibrary } from '../storage'
import type { CurrentLibrary, Topic } from '../types'

export type SyncState =
  | { kind: 'unconfigured' }
  /** Firebase is restoring auth or reconciling the authenticated UID before entry. */
  | { kind: 'restoring' }
  | { kind: 'signedOut' }
  | { kind: 'syncing'; user: SyncUser }
  | { kind: 'synced'; user: SyncUser; at: Date; conflicts: string[] }
  | { kind: 'error'; user: SyncUser | null; message: string; ready: boolean }

/** What the hook needs from the library store, so it can be driven by a fake. */
export interface SyncableStore {
  topics: Topic[]
  library: CurrentLibrary
  upsertTopic: (topic: Topic) => void
  removeTopic: (id: string) => void
  replaceLibrary: (library: CurrentLibrary) => void
}

/**
 * A topic arriving from another device goes through the same v5 parse boundary
 * a stored or imported one does. Nothing reaches the library that could not
 * have been loaded from disk.
 */
export function parseSyncedTopic(json: string): Topic | null {
  try {
    const parsed: unknown = JSON.parse(json)
    if (!parsed || typeof parsed !== 'object') return null
    const result = parseLibrary({ version: 5, topics: [parsed] })
    if (!result.ok || result.library.topics.length !== 1) return null
    return result.library.topics[0]
  } catch {
    return null
  }
}

let shared: SyncBackend | null = null

function defaultBackend(): SyncBackend {
  if (shared) return shared
  const configured = syncConfig()
  shared = configured.configured
    ? firebaseSyncBackend(configured.config)
    : unconfiguredSyncBackend()
  return shared
}

function sameLibrary(a: CurrentLibrary, b: CurrentLibrary): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

function remoteLibrary(records: RemoteRecord[], meta: string | null): CurrentLibrary | null {
  if (records.length === 0 && meta === null) return null
  const topics: Topic[] = []
  for (const record of records) {
    const topic = parseSyncedTopic(record.json)
    if (!topic || topic.id !== record.topicId) {
      throw new Error(`Cloud topic ${record.topicId} is not a valid Argus learner record.`)
    }
    topics.push(topic)
  }
  const candidate: CurrentLibrary = {
    version: 5,
    topics,
    ...(meta === null ? {} : { catalogDelivered: parseLibraryMeta(meta) }),
  }
  const parsed = parseLibrary(candidate)
  if (!parsed.ok) throw new Error(parsed.error)
  return reconcileLoadedLibrary(parsed.library).library
}

interface ExecutedPlan {
  library: CurrentLibrary
  ledger: Ledger
  conflicts: string[]
}

async function executePlan(
  uid: string,
  library: CurrentLibrary,
  records: RemoteRecord[],
  remoteMeta: string | null,
  ledger: Ledger,
  backend: SyncBackend,
): Promise<ExecutedPlan> {
  const plan = planSync(library.topics, records, ledger)
  const order = library.topics.map((topic) => topic.id)
  const topics = new Map(library.topics.map((topic) => [topic.id, topic]))
  const applied: SyncAction[] = []

  for (const action of plan.actions) {
    switch (action.kind) {
      case 'push':
        await backend.pushTopic(uid, action.topicId, action.json, action.revision)
        applied.push(action)
        break
      case 'deleteRemote':
        await backend.deleteTopic(uid, action.topicId)
        applied.push(action)
        break
      case 'adopt': {
        const topic = parseSyncedTopic(action.json)
        if (!topic || topic.id !== action.topicId) break
        topics.set(topic.id, topic)
        if (!order.includes(topic.id)) order.push(topic.id)
        applied.push({ ...action, json: topicJson(topic) })
        break
      }
      case 'dropLocal':
        topics.delete(action.topicId)
        applied.push(action)
        break
    }
  }

  const delivered = [
    ...new Set([...(library.catalogDelivered ?? []), ...parseLibraryMeta(remoteMeta)]),
  ].sort()
  const next: CurrentLibrary = {
    version: 5,
    topics: order.flatMap((id) => {
      const topic = topics.get(id)
      return topic ? [topic] : []
    }),
    catalogDelivered: delivered,
  }

  // Library-level delivery metadata is monotonic set-union state. It can be
  // composed safely without timestamp winner selection.
  const canonicalMeta = libraryMetaJson(next)
  const remoteCanonical = JSON.stringify({
    version: 5,
    catalogDelivered: parseLibraryMeta(remoteMeta),
  })
  if (canonicalMeta !== remoteCanonical) await backend.pushMeta(uid, canonicalMeta, 1)

  return {
    library: next,
    ledger: nextLedger(ledger, applied, Date.now()),
    conflicts: plan.conflicts,
  }
}

/**
 * Mirror the local library to Firestore, and take what other devices have done.
 *
 * The gate does not open until the authenticated UID has been reconciled once.
 * After that, mutations remain local-first: the UID cache is written immediately
 * and cloud work is coalesced/retried in the background.
 */
export function useSync(store: SyncableStore, injected?: SyncBackend) {
  const backend = injected ?? defaultBackend()
  const [user, setUser] = useState<SyncUser | null>(null)
  const [records, setRecords] = useState<RemoteRecord[] | null>(null)
  const [meta, setMeta] = useState<string | null | undefined>(undefined)
  const [state, setState] = useState<SyncState>(() => {
    if (!backend.configured) return { kind: 'unconfigured' }
    return hasSignedIn() ? { kind: 'restoring' } : { kind: 'signedOut' }
  })
  const ledger = useRef<Ledger>({})
  const candidate = useRef<LocalLibraryCandidate>({ kind: 'missing' })
  const bootstrappedUid = useRef<string | null>(null)
  const bootstrapInFlight = useRef(false)
  const inFlight = useRef(false)
  const rerun = useRef(false)
  const coalesceTimer = useRef<number | null>(null)
  const retryTimer = useRef<number | null>(null)
  const retryAttempt = useRef(0)
  const lastLocalJson = useRef(JSON.stringify(store.library))
  const storeRef = useRef(store)
  const userRef = useRef(user)
  const recordsRef = useRef(records)
  const metaRef = useRef(meta)
  storeRef.current = store
  userRef.current = user
  recordsRef.current = records
  metaRef.current = meta

  /** Firebase is not loaded until there is a reason. */
  const [watching, setWatching] = useState(() => backend.configured && hasSignedIn())

  const openValidatedCacheOffline = useCallback((next: SyncUser, message: string): boolean => {
    const local = candidate.current
    if (local.kind !== 'valid' || local.source !== 'uid') return false
    ledger.current = loadLedger(next.uid)
    writeLocalLibrary(next.uid, local.library)
    lastLocalJson.current = JSON.stringify(local.library)
    bootstrappedUid.current = next.uid
    storeRef.current.replaceLibrary(local.library)
    setState({ kind: 'error', user: next, message, ready: true })
    return true
  }, [])

  useEffect(() => {
    if (!backend.configured || !watching) return
    return backend.observeUser((next) => {
      if (next) rememberSignedIn()
      setUser(next)
      setRecords(null)
      setMeta(undefined)
      bootstrapInFlight.current = false
      bootstrappedUid.current = null
      retryAttempt.current = 0
      if (coalesceTimer.current !== null) window.clearTimeout(coalesceTimer.current)
      if (retryTimer.current !== null) window.clearTimeout(retryTimer.current)

      if (!next) {
        ledger.current = {}
        candidate.current = { kind: 'missing' }
        lastLocalJson.current = JSON.stringify(emptyLibrary())
        storeRef.current.replaceLibrary(emptyLibrary())
        setState({ kind: 'signedOut' })
        return
      }

      ledger.current = loadLedger(next.uid)
      candidate.current = readLocalLibrary(next.uid)
      if (candidate.current.kind === 'invalid') {
        preserveRecovery(
          next.uid,
          `invalid-${candidate.current.source}-library`,
          candidate.current.raw,
        )
      }

      const hiddenLocal = candidate.current.kind === 'valid'
        ? candidate.current.library
        : emptyLibrary()
      lastLocalJson.current = JSON.stringify(hiddenLocal)
      storeRef.current.replaceLibrary(hiddenLocal)
      // Reuse the existing closed-door state so returning users see the normal
      // restoring treatment until both local identity and cloud recovery resolve.
      setState({ kind: 'restoring' })
    })
  }, [backend, watching])

  useEffect(() => {
    if (!user) return
    const fail = (message: string) => {
      if (bootstrappedUid.current === user.uid) {
        setState({ kind: 'error', user, message, ready: true })
        return
      }
      if (!openValidatedCacheOffline(user, message)) {
        // `user: null` intentionally keeps the existing app gate closed. First
        // binding cannot enter on an unverified legacy/fresh copy when cloud is
        // unreachable, because a recoverable remote library may still exist.
        setState({ kind: 'error', user: null, message: `${message} First setup needs one successful cloud check.`, ready: false })
      }
    }
    const stopLibrary = backend.observeLibrary(user.uid, setRecords, fail)
    const stopMeta = backend.observeMeta(user.uid, setMeta, fail)
    return () => {
      stopLibrary()
      stopMeta()
    }
  }, [backend, openValidatedCacheOffline, user])

  useEffect(() => {
    if (!user || records === null || meta === undefined) return
    if (bootstrappedUid.current === user.uid || bootstrapInFlight.current) return
    bootstrapInFlight.current = true

    const run = async () => {
      const remote = remoteLibrary(records, meta)
      const local = candidate.current
      const base = local.kind === 'valid'
        ? local.library
        : remote ?? freshLibrary()

      try {
        const executed = await executePlan(user.uid, base, records, meta, ledger.current, backend)
        ledger.current = executed.ledger
        saveLedger(user.uid, ledger.current)
        writeLocalLibrary(user.uid, executed.library)
        if (local.kind === 'valid' && local.source === 'legacy') bindLegacyLibrary(user.uid)
        lastLocalJson.current = JSON.stringify(executed.library)
        storeRef.current.replaceLibrary(executed.library)
        bootstrappedUid.current = user.uid
        clearPending(user.uid)
        retryAttempt.current = 0
        setState({ kind: 'synced', user, at: new Date(), conflicts: executed.conflicts })
      } catch (error) {
        // We already completed the authoritative cloud read. Opening the chosen
        // local/base copy is therefore safe; any failed cloud mutation is a
        // durable pending write, not a reason to roll back learning.
        writeLocalLibrary(user.uid, base)
        markPending(user.uid)
        lastLocalJson.current = JSON.stringify(base)
        storeRef.current.replaceLibrary(base)
        bootstrappedUid.current = user.uid
        setState({
          kind: 'error',
          user,
          message: error instanceof Error ? error.message : 'Sync failed.',
          ready: true,
        })
      } finally {
        bootstrapInFlight.current = false
      }
    }

    void run()
  }, [backend, meta, records, user])

  const runSync = useCallback(async () => {
    const currentUser = userRef.current
    const currentRecords = recordsRef.current
    const currentMeta = metaRef.current
    if (
      !currentUser ||
      bootstrappedUid.current !== currentUser.uid ||
      currentRecords === null ||
      currentMeta === undefined
    ) return

    if (inFlight.current) {
      rerun.current = true
      return
    }

    inFlight.current = true
    rerun.current = false
    setState({ kind: 'syncing', user: currentUser })

    try {
      const started = storeRef.current.library
      const executed = await executePlan(
        currentUser.uid,
        started,
        currentRecords,
        currentMeta,
        ledger.current,
        backend,
      )
      ledger.current = executed.ledger
      saveLedger(currentUser.uid, ledger.current)
      writeLocalLibrary(currentUser.uid, executed.library)
      lastLocalJson.current = JSON.stringify(executed.library)
      if (!sameLibrary(executed.library, storeRef.current.library)) {
        storeRef.current.replaceLibrary(executed.library)
      }
      clearPending(currentUser.uid)
      retryAttempt.current = 0
      setState({ kind: 'synced', user: currentUser, at: new Date(), conflicts: executed.conflicts })
    } catch (error) {
      markPending(currentUser.uid)
      const message = error instanceof Error ? error.message : 'Sync failed.'
      setState({ kind: 'error', user: currentUser, message, ready: true })
      const delay = Math.min(30_000, 1_000 * 2 ** Math.min(retryAttempt.current, 5))
      retryAttempt.current += 1
      if (retryTimer.current !== null) window.clearTimeout(retryTimer.current)
      retryTimer.current = window.setTimeout(() => void runSync(), delay)
    } finally {
      inFlight.current = false
      if (rerun.current) {
        rerun.current = false
        window.setTimeout(() => void runSync(), 0)
      }
    }
  }, [backend])

  useEffect(() => {
    if (!user || bootstrappedUid.current !== user.uid) return
    const json = JSON.stringify(store.library)
    if (json === lastLocalJson.current) return
    lastLocalJson.current = json
    writeLocalLibrary(user.uid, store.library)
    markPending(user.uid)
    setState({ kind: 'syncing', user })
    if (coalesceTimer.current !== null) window.clearTimeout(coalesceTimer.current)
    coalesceTimer.current = window.setTimeout(() => void runSync(), 650)
    return () => {
      if (coalesceTimer.current !== null) window.clearTimeout(coalesceTimer.current)
    }
  }, [runSync, store.library, user])

  useEffect(() => {
    if (!user || bootstrappedUid.current !== user.uid || records === null || meta === undefined) return
    // Every remote snapshot is a reconciliation trigger. This catches work from
    // another device, and also drains a durable pending marker after reconnect.
    if (coalesceTimer.current !== null) window.clearTimeout(coalesceTimer.current)
    coalesceTimer.current = window.setTimeout(() => void runSync(), hasPending(user.uid) ? 0 : 50)
  }, [meta, records, runSync, user])

  useEffect(() => {
    const reconnect = () => void runSync()
    window.addEventListener('online', reconnect)
    return () => window.removeEventListener('online', reconnect)
  }, [runSync])

  useEffect(() => () => {
    if (coalesceTimer.current !== null) window.clearTimeout(coalesceTimer.current)
    if (retryTimer.current !== null) window.clearTimeout(retryTimer.current)
  }, [])

  const signIn = useCallback(async () => {
    try {
      setWatching(true)
      await backend.signIn()
      rememberSignedIn()
    } catch (error: unknown) {
      setState({
        kind: 'error',
        user: null,
        message: error instanceof Error ? error.message : 'Could not sign in.',
        ready: false,
      })
    }
  }, [backend])

  const signOut = useCallback(async () => {
    // Signing out removes nothing from the UID-scoped cache or cloud. The auth
    // observer clears only the in-memory library so another account can never
    // see this account's record during its own bootstrap.
    await backend.signOut()
    forgetSignedIn()
  }, [backend])

  return useMemo(() => ({ state, signIn, signOut }), [state, signIn, signOut])
}

export { topicJson }
