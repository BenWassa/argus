// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useDurableSync } from './useDurableSync'
import { freshSeedLibrary } from '../../infrastructure/persistence/libraryMigrations'
import type { PendingLibrarySync, IndexedLibraryRepository } from '../../infrastructure/persistence/indexedLibraryRepository'
import type { SyncBackend } from './syncBackend'
import type { Ledger, RemoteRecord } from './syncPlanner'
import { topicJson } from './syncPlanner'

const user = { uid: 'a', email: null, displayName: null }
function fixture() {
  const library = freshSeedLibrary()
  library.topics = library.topics.slice(0, 2)
  let pending: PendingLibrarySync | null = { owner: 'a', revision: 1, library, deletedTopicIds: [] }
  let ledger: Ledger = {}
  const repository = {
    pending: vi.fn(async () => pending),
    readLedger: async () => ledger,
    acknowledge: vi.fn(async (_owner: string, revision: number, next: Ledger, keepPending = false) => {
      if (keepPending) { ledger = next; return false }
      if (pending?.revision !== revision) return false
      ledger = next
      pending = null
      return true
    }),
  } satisfies Pick<IndexedLibraryRepository, 'pending' | 'readLedger' | 'acknowledge'>
  let records: (records: RemoteRecord[]) => void = () => {}
  const backend = {
    observeLibrary: vi.fn((_uid, listener) => { records = listener; return () => {} }),
    observeMeta: vi.fn((_uid, listener) => { listener(null); return () => {} }),
    pushTopic: vi.fn(async () => {}), deleteTopic: vi.fn(async () => {}), pushMeta: vi.fn(async () => {}),
  } satisfies Pick<SyncBackend, 'observeLibrary' | 'observeMeta' | 'pushTopic' | 'deleteTopic' | 'pushMeta'>
  const store = { owner: 'a', topics: library.topics, catalogDelivered: [], bindOwner: () => {}, upsertTopic: vi.fn(), removeTopic: vi.fn(), mergeCatalogDelivered: vi.fn(), syncRepository: repository }
  return { store, backend, emit: () => records([]), pending: () => pending, change: () => { pending = { owner: 'a', revision: 2, library, deletedTopicIds: [] } }, ledger: () => ledger }
}
async function flush() { await act(async () => { for (let i = 0; i < 40; i++) await Promise.resolve() }) }
afterEach(() => { cleanup(); vi.useRealTimers() })
it('retains failed intent across restart and drains after the owner binds', async () => {
  const f = fixture()
  f.backend.pushTopic.mockRejectedValueOnce(new Error('unavailable'))
  const first = renderHook(() => useDurableSync(f.store, f.backend, user, true))
  act(f.emit); await flush()
  expect(f.pending()).not.toBeNull()
  first.unmount()
  renderHook(() => useDurableSync(f.store, f.backend, user, true))
  act(f.emit); await flush()
  expect(f.pending()).toBeNull()
  expect(Object.keys(f.ledger())).toHaveLength(2)
})
it('reconnect resubscribes and retries without a local edit', async () => {
  const f = fixture()
  f.backend.pushTopic.mockRejectedValueOnce(new Error('unavailable'))
  renderHook(() => useDurableSync(f.store, f.backend, user, true))
  act(f.emit); await flush()
  act(() => window.dispatchEvent(new Event('online')))
  act(f.emit); await flush()
  expect(f.backend.observeLibrary).toHaveBeenCalledTimes(2)
  expect(f.pending()).toBeNull()
})
it('does not clear a newer intent when the sent revision completes', async () => {
  const f = fixture()
  f.backend.pushTopic.mockImplementationOnce(async () => { f.change() })
  renderHook(() => useDurableSync(f.store, f.backend, user, true))
  act(f.emit); await flush()
  expect(f.pending()?.revision).toBe(2)
  expect(f.store.syncRepository.acknowledge).toHaveBeenCalledWith('a', 1, expect.any(Object))
})
it('backs off exponentially with a 60 second ceiling', async () => {
  vi.useFakeTimers()
  const f = fixture()
  f.backend.pushTopic.mockRejectedValue(new Error('unavailable'))
  renderHook(() => useDurableSync(f.store, f.backend, user, true))
  act(f.emit); await flush()
  for (const delay of [1000, 2000, 4000, 8000, 16000, 32000, 60000, 60000]) {
    const calls = f.backend.observeLibrary.mock.calls.length
    await act(async () => { await vi.advanceTimersByTimeAsync(delay - 1) })
    expect(f.backend.observeLibrary).toHaveBeenCalledTimes(calls)
    await act(async () => { await vi.advanceTimersByTimeAsync(1) })
    expect(f.backend.observeLibrary).toHaveBeenCalledTimes(calls + 1)
    act(f.emit); await flush()
  }
})
it('checkpoints successful topics before a later failure', async () => {
  const f = fixture()
  f.backend.pushTopic.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('unavailable'))
  renderHook(() => useDurableSync(f.store, f.backend, user, true))
  act(f.emit); await flush()
  expect(Object.keys(f.ledger())).toHaveLength(1)
  expect(f.pending()).not.toBeNull()
})
it('retains conflicts, continues unrelated work and never acknowledges the snapshot', async () => {
  const f = fixture()
  const topic = f.store.topics[0]
  await f.store.syncRepository.acknowledge('a', 1, { [topic.id]: { revision: 1, json: topicJson({ ...topic, title: 'baseline' }), changedAtMs: 0 } }, true)
  f.backend.observeLibrary.mockImplementationOnce((_uid, listener) => {
    listener([{ topicId: topic.id, json: topicJson({ ...topic, title: 'remote' }), revision: 2, updatedAtMs: 1 }])
    return () => {}
  })
  const hook = renderHook(() => useDurableSync(f.store, f.backend, user, true))
  await flush()
  expect(hook.result.current.conflicts).toEqual([topic.id])
  expect(f.backend.pushTopic).toHaveBeenCalledTimes(1)
  expect(f.pending()).not.toBeNull()
})
it('never starts subscriptions against another owner’s local library', async () => {
  const f = fixture()
  renderHook(() => useDurableSync({ ...f.store, owner: 'b' }, f.backend, user, true))
  await flush()
  expect(f.backend.observeLibrary).not.toHaveBeenCalled()
  expect(f.backend.pushTopic).not.toHaveBeenCalled()
})
it('does not let local edits bypass an active failure backoff', async () => {
  vi.useFakeTimers()
  const f = fixture()
  f.backend.pushTopic.mockRejectedValue(new Error('unavailable'))
  const hook = renderHook(({ store }) => useDurableSync(store, f.backend, user, true), { initialProps: { store: f.store } })
  act(f.emit); await flush()
  const calls = f.backend.pushTopic.mock.calls.length
  hook.rerender({ store: { ...f.store, topics: [...f.store.topics] } })
  await flush()
  expect(f.backend.pushTopic).toHaveBeenCalledTimes(calls)
})
it('preserves an unbaselined deletion as a conflict rather than adopting the remote topic', async () => {
  const f = fixture()
  const pending = f.pending()!
  const removed = pending.library.topics.shift()!
  pending.deletedTopicIds.push(removed.id)
  f.backend.observeLibrary.mockImplementationOnce((_uid, listener) => {
    listener([{ topicId: removed.id, json: topicJson(removed), revision: 2, updatedAtMs: 1 }])
    return () => {}
  })
  const hook = renderHook(() => useDurableSync(f.store, f.backend, user, true))
  await flush()
  expect(f.store.upsertTopic).not.toHaveBeenCalled()
  expect(f.backend.deleteTopic).not.toHaveBeenCalled()
  expect(hook.result.current.conflicts).toContain(removed.id)
  expect(f.pending()).not.toBeNull()
})
it('stops an in-flight pass on owner switch before any acknowledgement or further push', async () => {
  const f = fixture()
  let release!: () => void
  f.backend.pushTopic.mockImplementationOnce(() => new Promise<void>((resolve) => { release = resolve }))
  const hook = renderHook(({ store, owner }) => useDurableSync(store, f.backend, owner, true), { initialProps: { store: f.store, owner: user } })
  act(f.emit); await flush()
  expect(f.backend.pushTopic).toHaveBeenCalledTimes(1)
  hook.rerender({ store: { ...f.store, owner: 'b' }, owner: { ...user, uid: 'b' } })
  await act(async () => { release() })
  expect(f.backend.pushTopic).toHaveBeenCalledTimes(1)
  expect(f.store.syncRepository.acknowledge).not.toHaveBeenCalled()
  expect(f.pending()).not.toBeNull()
})
it('does not revive a retired localStorage ledger when IndexedDB holds an empty ledger', async () => {
  const f = fixture()
  const topic = f.store.topics[0]
  localStorage.setItem('argus.sync.ledger.v1.a', JSON.stringify({ [topic.id]: { revision: 20, json: topicJson(topic), changedAtMs: 0 } }))
  renderHook(() => useDurableSync(f.store, f.backend, user, true))
  act(f.emit); await flush()
  expect(f.backend.pushTopic).toHaveBeenCalledWith('a', topic.id, topicJson(topic), 1)
  localStorage.clear()
})
it('still reports a detected conflict when unrelated remote work fails', async () => {
  const f = fixture()
  const topic = f.store.topics[0]
  await f.store.syncRepository.acknowledge('a', 1, { [topic.id]: { revision: 1, json: topicJson({ ...topic, title: 'baseline' }), changedAtMs: 0 } }, true)
  f.backend.observeLibrary.mockImplementationOnce((_uid, listener) => {
    listener([{ topicId: topic.id, json: topicJson({ ...topic, title: 'remote' }), revision: 2, updatedAtMs: 1 }])
    return () => {}
  })
  f.backend.pushTopic.mockRejectedValue(new Error('unavailable'))
  const hook = renderHook(() => useDurableSync(f.store, f.backend, user, true))
  await flush()
  expect(hook.result.current.error).toBe('unavailable')
  expect(hook.result.current.conflicts).toContain(topic.id)
})
