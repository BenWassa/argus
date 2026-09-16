import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { syncConfig } from './config'
import { firebaseSyncBackend } from './firebaseSync'
import { unconfiguredSyncBackend, type SyncBackend, type SyncUser } from './backend'
import { loadLedger, saveLedger } from './ledger'
import { nextLedger, planSync, topicJson, type Ledger, type RemoteRecord } from './plan'
import { parseLibrary } from '../storage'
import type { Topic } from '../types'

export type SyncState =
  | { kind: 'unconfigured' }
  | { kind: 'signedOut' }
  | { kind: 'syncing'; user: SyncUser }
  | { kind: 'synced'; user: SyncUser; at: Date; conflicts: string[] }
  | { kind: 'error'; user: SyncUser | null; message: string }

/** What the hook needs from the library store, so it can be driven by a fake. */
export interface SyncableStore {
  topics: Topic[]
  upsertTopic: (topic: Topic) => void
  removeTopic: (id: string) => void
}

/**
 * A topic arriving from another device goes through the same v5 parse boundary
 * a stored or imported one does. Nothing reaches the library that could not
 * have been loaded from disk, so sync cannot widen what a topic is allowed to
 * be — which is the whole reason the record travels as its own JSON.
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

/**
 * Mirror the local library to Firestore, and take what other devices have done.
 *
 * Local storage stays the authority for what is on screen: every read and every
 * write the app already makes is untouched, so Argus works exactly as before
 * with no network and no account. Sync is a mirror laid over that, and the one
 * decision it makes — which copy wins — is `planSync`, tested on its own.
 */
export function useSync(store: SyncableStore, backend: SyncBackend = defaultBackend()) {
  const [user, setUser] = useState<SyncUser | null>(null)
  const [records, setRecords] = useState<RemoteRecord[] | null>(null)
  const [state, setState] = useState<SyncState>(
    backend.configured ? { kind: 'signedOut' } : { kind: 'unconfigured' },
  )
  const ledger = useRef<Ledger>({})
  const applying = useRef(false)

  useEffect(() => {
    if (!backend.configured) return
    return backend.observeUser((next) => {
      setUser(next)
      setRecords(null)
      ledger.current = next ? loadLedger(next.uid) : {}
      setState(next ? { kind: 'syncing', user: next } : { kind: 'signedOut' })
    })
  }, [backend])

  useEffect(() => {
    if (!user) return
    return backend.observeLibrary(
      user.uid,
      setRecords,
      (message) => setState({ kind: 'error', user, message }),
    )
  }, [backend, user])

  useEffect(() => {
    if (!user || records === null || applying.current) return
    const plan = planSync(store.topics, records, ledger.current)
    if (plan.actions.length === 0) {
      setState({ kind: 'synced', user, at: new Date(), conflicts: plan.conflicts })
      return
    }

    applying.current = true
    const run = async () => {
      for (const action of plan.actions) {
        switch (action.kind) {
          case 'push':
            await backend.pushTopic(user.uid, action.topicId, action.json, action.revision)
            break
          case 'deleteRemote':
            await backend.deleteTopic(user.uid, action.topicId)
            break
          case 'adopt': {
            // A record this device cannot parse is left alone rather than
            // dropped: refusing it keeps the local copy, and the ledger is not
            // advanced, so a later build that understands it can still take it.
            const topic = parseSyncedTopic(action.json)
            if (topic) store.upsertTopic(topic)
            break
          }
          case 'dropLocal':
            store.removeTopic(action.topicId)
            break
        }
      }
      ledger.current = nextLedger(ledger.current, plan.actions, Date.now())
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
      await backend.signIn()
    } catch (error: unknown) {
      setState({
        kind: 'error',
        user: null,
        message: error instanceof Error ? error.message : 'Could not sign in.',
      })
    }
  }, [backend])

  const signOut = useCallback(async () => {
    // The local library is untouched by signing out. It was never the copy that
    // depended on an account.
    await backend.signOut()
  }, [backend])

  return useMemo(() => ({ state, signIn, signOut }), [state, signIn, signOut])
}

export { topicJson }
