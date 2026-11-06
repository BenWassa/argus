import { afterEach, expect, it, vi } from 'vitest'
import { openIndexedLibraryRepository } from './indexedLibraryRepository'

/** A request/transaction boundary fake; browser tests own native IndexedDB durability. */
function database() {
  const stores = new Map<string, Map<string, unknown>>()
  for (const name of ['outbox', 'ledgers']) stores.set(name, new Map())
  const db = {
    close: () => {},
    transaction: () => {
      const tx = {
        oncomplete: null as (() => void) | null,
        onabort: null as (() => void) | null,
        onerror: null as (() => void) | null,
        abort: () => tx.onabort?.(),
        objectStore: (name: string) => {
          const rows = stores.get(name)!
          return {
            get: (owner: string) => {
              const request = { result: undefined as unknown, onsuccess: null as (() => void) | null }
              queueMicrotask(() => {
                request.result = rows.get(owner)
                request.onsuccess?.()
                setTimeout(() => tx.oncomplete?.(), 0)
              })
              return request
            },
            put: (row: { owner: string }) => { rows.set(row.owner, row) },
            delete: (owner: string) => { rows.delete(owner) },
          }
        },
      }
      return tx
    },
  }
  vi.stubGlobal('indexedDB', {
    open: () => {
      const request = { result: db, onsuccess: null as (() => void) | null }
      queueMicrotask(() => request.onsuccess?.())
      return request
    },
  })
  return stores
}
afterEach(() => { vi.unstubAllGlobals() })
it('a stale acknowledgement cannot clear or change the newer intent and ledger', async () => {
  const stores = database()
  stores.get('outbox')!.set('a', { owner: 'a', revision: 2 })
  stores.get('ledgers')!.set('a', { owner: 'a', ledger: { agreed: true } })
  const repository = await openIndexedLibraryRepository()
  expect(await repository.acknowledge('a', 1, { stale: true })).toBe(false)
  expect(stores.get('outbox')!.get('a')).toEqual({ owner: 'a', revision: 2 })
  expect(await repository.readLedger('a')).toEqual({ agreed: true })
})
it('checkpoints partial remote success without removing newer intent, then clears only its matching revision', async () => {
  const stores = database()
  stores.get('outbox')!.set('a', { owner: 'a', revision: 2 })
  stores.get('outbox')!.set('b', { owner: 'b', revision: 1 })
  const repository = await openIndexedLibraryRepository()
  await repository.acknowledge('a', 1, { topic: 'acknowledged' }, true)
  expect(await repository.readLedger('a')).toEqual({ topic: 'acknowledged' })
  expect(stores.get('outbox')!.has('a')).toBe(true)
  expect(await repository.acknowledge('a', 2, { topic: 'latest' })).toBe(true)
  expect(stores.get('outbox')!.has('a')).toBe(false)
  expect(stores.get('outbox')!.has('b')).toBe(true)
})
it('imports a legacy ledger once and preserves an authoritative empty IndexedDB ledger on restart', async () => {
  database()
  const first = await openIndexedLibraryRepository()
  expect(await first.readLedger('a', { old: 'baseline' })).toEqual({ old: 'baseline' })
  await first.acknowledge('a', 1, {}, true)
  first.close()
  const restarted = await openIndexedLibraryRepository()
  expect(await restarted.readLedger('a', { old: 'baseline' })).toEqual({})
  expect(await restarted.readLedger('b', { separate: true })).toEqual({ separate: true })
})
