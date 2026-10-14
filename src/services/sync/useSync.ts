import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { syncConfig } from './syncConfig'
import { firebaseSyncBackend } from './firebaseSyncBackend'
import { unconfiguredSyncBackend, type SyncBackend, type SyncUser } from './syncBackend'
import { loadLedger, saveLedger } from './syncLedger'
import { forgetSignedIn, hasSignedIn, rememberSignedIn } from './syncSession'
import {
  libraryMetaJson,
  nextLedger,
  parseLibraryMeta,
  parseRoleMeta,
  planSync,
  topicJson,
  type Ledger,
  type RemoteRecord,
  type SyncAction,
} from './syncPlanner'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'
import type { Topic } from '../../domain/library/topic'
import { mergeRoleAwards, type RoleAward } from '../../domain/roles/awards'

export type SyncState =
  | { kind: 'unconfigured' }
  /**
   * A device that has signed in before, while Firebase works out whether that
   * session is still good. It is distinct from `signedOut` because the gate
   * must not show a sign-in screen to somebody who is already signed in, and
   * must not show the library to somebody who turns out not to be.
   */
  | { kind: 'restoring' }
  | { kind: 'signedOut' }
  | { kind: 'syncing'; user: SyncUser }
  | { kind: 'synced'; user: SyncUser; at: Date; conflicts: string[] }
  | { kind: 'error'; user: SyncUser | null; message: string }

/** What the hook needs from the library store, so it can be driven by a fake. */
export interface SyncableStore {
  topics: Topic[]
  upsertTopic: (topic: Topic) => void
  removeTopic: (id: string) => void
  /** The account the local library belongs to; see `LibraryProvider`. */
  owner: string | null
  bindOwner: (uid: string) => void | Promise<void>
  catalogDelivered: readonly string[] | undefined
  mergeCatalogDelivered: (ids: readonly string[]) => void
  roleAwards?: readonly RoleAward[]
  roleAwardGeneration?: number
  mergeRoleAwards?: (awards: readonly RoleAward[], generation: number) => void
}

/** What a remote library-meta document holds, as the backend reports it. */
type RemoteMeta = { json: string; revision: number } | null

/**
 * A topic arriving from another device goes through the same v5 parse boundary
 * a stored or imported one does. Nothing reaches the library that could not
 * have been loaded from disk, so sync cannot widen what a topic is allowed to
 * be — which is the whole reason the record travels as its own JSON.
 */
export function parseSyncedTopic(json: string, topicId?: string): Topic | null {
  try {
    const parsed: unknown = JSON.parse(json)
    if (!parsed || typeof parsed !== 'object') return null
    const result = parseLibrary({ version: 5, topics: [parsed] })
    if (!result.ok || result.library.topics.length !== 1) return null
    const topic = result.library.topics[0]
    // A document filed under one topic that holds another is damaged, and
    // taking it would overwrite the wrong topic.
    if (topicId !== undefined && topic.id !== topicId) return null
    return topic
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

/**
 * Mirror the local library to Firestore, and take what other devices have done.
 *
 * Local storage stays the authority for what is on screen: every read and every
 * write the app already makes is untouched, so Argus works exactly as before
 * with no network and no account. Sync is a mirror laid over that, and the one
 * decision it makes — which copy wins — is `planSync`, tested on its own.
 */
export function useSync(store: SyncableStore, injected?: SyncBackend) {
  const backend = injected ?? defaultBackend()
  const [user, setUser] = useState<SyncUser | null>(null)
  const [records, setRecords] = useState<RemoteRecord[] | null>(null)
  const [state, setState] = useState<SyncState>(() => {
    if (!backend.configured) return { kind: 'unconfigured' }
    return hasSignedIn() ? { kind: 'restoring' } : { kind: 'signedOut' }
  })
  /** `undefined` until the meta document has been heard from at all. */
  const [meta, setMeta] = useState<RemoteMeta | undefined>(undefined)
  const ledger = useRef<Ledger>({})
  const applying = useRef(false)
  const pushedMeta = useRef<string | null>(null)
  // The user subscription outlives any one render of the store it binds.
  const storeRef = useRef(store)
  storeRef.current = store
  /**
   * Firebase is not loaded, and Google is not contacted, until there is a
   * reason. A device that has never signed in has no reason on load, and the
   * button below supplies one the moment it is pressed.
   */
  const [watching, setWatching] = useState(() => backend.configured && hasSignedIn())

  useEffect(() => {
    if (!backend.configured || !watching) return
    let active = true
    let sequence = 0
    const unsubscribe = backend.observeUser((next) => {
      const generation = ++sequence
      if (!next) {
        pushedMeta.current = null
        setUser(null)
        setRecords(null)
        ledger.current = {}
        setState({ kind: 'signedOut' })
        return
      }
      // Auth callbacks must not open the gate or start remote subscriptions
      // until the durable UID-bound local library has been loaded.
      setUser(null)
      setRecords(null)
      setState({ kind: 'restoring' })
      void Promise.resolve()
        .then(() => storeRef.current.bindOwner(next.uid))
        .then(() => {
          if (!active || generation !== sequence) return
          rememberSignedIn()
          pushedMeta.current = null
          ledger.current = loadLedger(next.uid)
          setUser(next)
          setState({ kind: 'syncing', user: next })
        })
        .catch((error: unknown) => {
          if (!active || generation !== sequence) return
          setUser(null)
          setRecords(null)
          ledger.current = {}
          setState({
            kind: 'error',
            user: null,
            message: error instanceof Error ? error.message : 'The local library could not be opened for this account.',
          })
        })
    })
    return () => { active = false; ++sequence; unsubscribe() }
  }, [backend, watching])

  useEffect(() => {
    if (!user) return
    return backend.observeLibrary(
      user.uid,
      setRecords,
      (message) => setState({ kind: 'error', user, message }),
    )
  }, [backend, user])

  useEffect(() => {
    if (!user) return
    setMeta(undefined)
    return backend.observeMeta(
      user.uid,
      setMeta,
      (message) => setState({ kind: 'error', user, message }),
    )
  }, [backend, user])

  useEffect(() => {
    if (!user || meta === undefined || store.owner !== user.uid) return
    const remote = meta ? parseLibraryMeta(meta.json) : []
    const remoteRoles = meta ? parseRoleMeta(meta.json) : { awards: [], generation: 0 }
    // Unreadable library-level state is left alone for a build that can read it.
    if (remote === null || remoteRoles === null) return
    store.mergeCatalogDelivered(remote)
    const localGeneration = store.roleAwardGeneration ?? 0
    const generation = Math.max(localGeneration, remoteRoles.generation)
    const awards = localGeneration === remoteRoles.generation
      ? mergeRoleAwards(store.roleAwards ?? [], remoteRoles.awards)
      : generation === localGeneration ? [...(store.roleAwards ?? [])] : remoteRoles.awards
    store.mergeRoleAwards?.(awards, generation)
    const carriesAwards = store.roleAwards !== undefined || store.roleAwardGeneration !== undefined || remoteRoles.generation > 0
      || (meta !== null && meta !== undefined && JSON.parse(meta.json).roleAwards !== undefined)
    const canonical = libraryMetaJson([...(store.catalogDelivered ?? []), ...remote], carriesAwards ? awards : undefined, carriesAwards ? generation : undefined)
    if (meta?.json === canonical || pushedMeta.current === canonical) return
    pushedMeta.current = canonical
    backend.pushMeta(user.uid, canonical, (meta?.revision ?? 0) + 1).catch((error: unknown) => {
      pushedMeta.current = null
      setState({
        kind: 'error',
        user,
        message: error instanceof Error ? error.message : 'Sync failed.',
      })
    })
  }, [backend, user, meta, store])

  useEffect(() => {
    // Wait for the library on screen to be this account's before comparing it
    // with this account's cloud copy.
    if (!user || records === null || applying.current || store.owner !== user.uid) return
    const plan = planSync(store.topics, records, ledger.current)
    if (plan.actions.length === 0) {
      setState({ kind: 'synced', user, at: new Date(), conflicts: plan.conflicts })
      return
    }

    applying.current = true
    const run = async () => {
      // What the ledger records is what actually happened, which is not always
      // what was planned: a record that would not parse is not adopted, and an
      // adopted one is recorded as the library will serialize it rather than as
      // it arrived. Storing the arriving text instead would leave the ledger
      // disagreeing with the local copy the moment the parser normalized
      // anything, and every later pass would push a needless revision.
      const applied: SyncAction[] = []
      for (const action of plan.actions) {
        switch (action.kind) {
          case 'push':
            await backend.pushTopic(user.uid, action.topicId, action.json, action.revision)
            applied.push(action)
            break
          case 'deleteRemote':
            await backend.deleteTopic(user.uid, action.topicId)
            applied.push(action)
            break
          case 'adopt': {
            // A record this device cannot parse is left alone rather than
            // dropped: refusing it keeps the local copy, and the ledger is not
            // advanced, so a later build that understands it can still take it.
            const topic = parseSyncedTopic(action.json, action.topicId)
            if (!topic) break
            store.upsertTopic(topic)
            applied.push({ ...action, json: topicJson(topic) })
            break
          }
          case 'dropLocal':
            store.removeTopic(action.topicId)
            applied.push(action)
            break
        }
      }
      ledger.current = nextLedger(ledger.current, applied, Date.now())
      saveLedger(user.uid, ledger.current)
      setState({ kind: 'synced', user, at: new Date(), conflicts: plan.conflicts })
    }

    void run()
      .catch((error: unknown) => {
        setState({
          kind: 'error',
          user,
          message: error instanceof Error ? error.message : 'Sync failed.',
        })
      })
      .finally(() => {
        applying.current = false
      })
  }, [backend, user, records, store])

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
      })
    }
  }, [backend])

  const signOut = useCallback(async () => {
    // The local library stays, still bound to this account. If a different
    // account signs in next, `bindOwner` parks it before anything else happens.
    await backend.signOut()
    forgetSignedIn()
  }, [backend])

  return useMemo(() => ({ state, signIn, signOut }), [state, signIn, signOut])
}

export { topicJson }
