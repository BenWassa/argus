import { useEffect, useRef, useState } from 'react'
import type { IndexedLibraryRepository } from '../../infrastructure/persistence/indexedLibraryRepository'
import type { SyncBackend, SyncUser } from './syncBackend'
import type { SyncableStore } from './useSync'
import { loadLedger } from './syncLedger'
import {
  libraryMetaJson,
  mergeLibraryMetaJson,
  nextLedger,
  parseLibraryMeta,
  parseRoleMeta,
  planSync,
  topicJson,
  type Ledger,
  type RemoteRecord,
} from './syncPlanner'
import { parseSyncedTopic } from './syncTopic'

type Backend = Pick<SyncBackend, 'observeLibrary' | 'observeMeta' | 'pushTopic' | 'deleteTopic' | 'pushMeta'>
export type SyncRepository = Pick<IndexedLibraryRepository, 'pending' | 'readLedger' | 'acknowledge'>
export interface DurableSyncStatus {
  pending: boolean | null
  conflicts: string[]
  error: string | null
  syncing: boolean
}
const initial: DurableSyncStatus = { pending: null, conflicts: [], error: null, syncing: true }

/** One foreground worker over the repository's cumulative intent, never a second queue. */
export function useDurableSync(store: SyncableStore, backend: Backend, user: SyncUser | null, online: boolean) {
  const [status, setStatus] = useState<DurableSyncStatus & { owner: string | null }>({ ...initial, owner: null })
  const [retry, setRetry] = useState(0)
  const failures = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latest = useRef({ store, user })
  latest.current = { store, user }
  const kick = useRef<(() => void) | null>(null)
  const repository = store.syncRepository

  useEffect(() => {
    const reconnect = () => {
      failures.current = 0
      if (timer.current) clearTimeout(timer.current)
      setRetry((n) => n + 1)
    }
    window.addEventListener('online', reconnect)
    return () => {
      window.removeEventListener('online', reconnect)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  useEffect(() => {
    if (!repository || !store.owner) return
    let active = true
    void repository.pending(store.owner).then((pending) => {
      if (active) setStatus((s) => ({ ...(s.owner === store.owner ? s : initial), owner: store.owner, pending: pending !== null }))
    }).catch((error: unknown) => {
      if (active) setStatus((s) => ({ ...s, error: error instanceof Error ? error.message : 'Local sync intent could not be read.' }))
    })
    return () => { active = false }
  }, [repository, store.owner, store.topics, store.catalogDelivered, store.roleAwards, retry])

  useEffect(() => {
    if (!repository || !user || store.owner !== user.uid || !online) return
    let active = true
    let running = false
    let requested = false
    let records: RemoteRecord[] | null = null
    let meta: { json: string; revision: number } | null | undefined
    let known: Ledger | null = null
    const stale = () => !active || latest.current.user !== user || latest.current.store.owner !== user.uid
    const fail = (error: unknown) => {
      if (stale()) return
      setStatus((s) => ({ ...(s.owner === user.uid ? s : initial), owner: user.uid, syncing: false, error: error instanceof Error ? error.message : String(error) }))
      if (timer.current) clearTimeout(timer.current)
      const delay = Math.min(60_000, 1000 * 2 ** Math.min(failures.current++, 6))
      timer.current = setTimeout(() => { timer.current = null; setRetry((n) => n + 1) }, delay)
    }
    const run = async () => {
      if (running) { requested = true; return }
      if (stale() || records === null || meta === undefined || timer.current) return
      running = true
      requested = false
      try {
        setStatus((s) => ({ ...(s.owner === user.uid ? s : initial), owner: user.uid, syncing: true, error: null }))
        if (!known) {
          // The repository imports legacy bytes only when no IndexedDB ledger exists.
          known = await repository.readLedger(user.uid, loadLedger(user.uid)) as Ledger
        }
        const pending = await repository.pending(user.uid)
        if (stale()) return
        const current = latest.current.store
        const local = pending?.library
        const plan = planSync(local?.topics ?? current.topics, records, known)
        const conflicts = [...plan.conflicts]
        const reportConflicts = () => setStatus((s) => ({ ...s, conflicts: [...conflicts] }))
        reportConflicts()
        const deleted = new Set(pending?.deletedTopicIds ?? [])
        const revision = pending?.revision ?? 1
        for (const action of plan.actions) {
          if (stale()) return
          let applied = action
          switch (action.kind) {
            case 'push':
              await backend.pushTopic(user.uid, action.topicId, action.json, action.revision)
              if (!records.some((record) => record.topicId === action.topicId && record.revision > action.revision)) {
                records = [...records.filter((record) => record.topicId !== action.topicId), { ...action, updatedAtMs: null }]
              }
              break
            case 'deleteRemote':
              await backend.deleteTopic(user.uid, action.topicId)
              records = records.filter((record) => record.topicId !== action.topicId)
              break
            case 'adopt': {
              if (deleted.has(action.topicId)) { conflicts.push(action.topicId); reportConflicts(); continue }
              const topic = parseSyncedTopic(action.json, action.topicId)
              if (!topic) { conflicts.push(action.topicId); reportConflicts(); continue }
              if (await current.upsertTopic(topic) === false) throw new Error('The adopted topic could not be saved locally.')
              applied = { ...action, json: topicJson(topic) }
              break
            }
            case 'dropLocal':
              if (await current.removeTopic(action.topicId) === false) throw new Error('The local deletion could not be saved.')
          }
          if (stale()) return
          const next = nextLedger(known, [applied], Date.now())
          // Partial success must survive restart even when another topic conflicts or fails.
          await repository.acknowledge(user.uid, revision, next, true)
          known = next
        }
        if (stale()) return
        const json = libraryMetaJson(local?.catalogDelivered ?? current.catalogDelivered,
          local?.roleAwards ?? current.roleAwards, local?.roleAwardGeneration ?? current.roleAwardGeneration)
        const canonical = mergeLibraryMetaJson(json, meta?.json ?? null)
        await current.mergeCatalogDelivered(parseLibraryMeta(canonical)!)
        const roles = parseRoleMeta(canonical)!
        await current.mergeRoleAwards?.(roles.awards, roles.generation)
        if (stale()) return
        if (canonical !== meta?.json) await backend.pushMeta(user.uid, canonical, (meta?.revision ?? 0) + 1)
        if (stale()) return
        if (pending && conflicts.length === 0) await repository.acknowledge(user.uid, pending.revision, known)
        const remaining = await repository.pending(user.uid)
        if (stale()) return
        failures.current = 0
        setStatus({ owner: user.uid, pending: remaining !== null, conflicts, error: null, syncing: false })
      } catch (error) { fail(error) }
      finally {
        running = false
        if (requested && active && !timer.current) void run()
      }
    }
    kick.current = () => { void run() }
    const stopLibrary = backend.observeLibrary(user.uid, (next) => { records = next; void run() }, fail)
    const stopMeta = backend.observeMeta(user.uid, (next) => { meta = next; void run() }, fail)
    return () => {
      active = false
      kick.current = null
      stopLibrary()
      stopMeta()
      if (timer.current) { clearTimeout(timer.current); timer.current = null }
    }
  }, [repository, backend, user, store.owner, online, retry])

  useEffect(() => { kick.current?.() }, [store.topics, store.catalogDelivered, store.roleAwards, store.roleAwardGeneration])
  return status.owner === store.owner ? status : initial
}
