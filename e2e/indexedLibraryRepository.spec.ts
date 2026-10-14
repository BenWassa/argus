import { expect, test } from '@playwright/test'
import { build } from 'esbuild'
import { resolve } from 'node:path'
import { seedLibrary } from '../src/domain/library/catalogSeed'

declare global {
  interface Window {
    ArgusIDB: typeof import('../src/infrastructure/persistence/indexedLibraryRepository')
  }
}

let bundle: string
const initial = { ...seedLibrary(), version: 5 as const }
test.beforeAll(async () => {
  // Exercise the actual repository against Chromium's IndexedDB, not a fake.
  const output = await build({
    entryPoints: [resolve('src/infrastructure/persistence/indexedLibraryRepository.ts')],
    bundle: true, format: 'iife', globalName: 'ArgusIDB', write: false,
    define: { 'import.meta.env': '{}' },
  })
  bundle = output.outputFiles[0].text
})
test.beforeEach(async ({ page }) => {
  await page.goto('./')
  await page.addScriptTag({ content: bundle })
})

test('creates and verifies one durable library and sync intent, idempotently', async ({ page }) => {
  const result = await page.evaluate(async (seed) => {
    const repo = await window.ArgusIDB.openIndexedLibraryRepository('creation')
    const first = await repo.initialize('owner-a', { seed })
    const again = await repo.initialize('owner-a', { seed: { version: 5, topics: [] } })
    const pending = await repo.pending('owner-a')
    const marker = await repo.migration('owner-a')
    repo.close()
    return { first, again, pending, marker }
  }, initial)
  expect(result.first).toEqual(result.again)
  expect(result.pending).toMatchObject({ owner: 'owner-a', revision: 1, library: initial, deletedTopicIds: [] })
  expect(result.marker).toMatchObject({ verified: true, sourceKey: null })
})

test('migrates legacy bytes through the parser, keeps the source, and resumes interrupted verification', async ({ page }) => {
  const result = await page.evaluate(async (seed) => {
    const raw = JSON.stringify({ version: 4, topics: seed.topics })
    localStorage.setItem('legacy-library', raw)
    const repo = await window.ArgusIDB.openIndexedLibraryRepository('migration')
    const migrated = await repo.initialize('owner-a', { seed, legacy: { key: 'legacy-library', raw } })
    // A process may die after the canonical commit but before verification.
    const db = await new Promise<IDBDatabase>((resolve) => { const req = indexedDB.open('migration'); req.onsuccess = () => resolve(req.result) })
    await new Promise<void>((resolve) => {
      const tx = db.transaction('migrations', 'readwrite')
      tx.objectStore('migrations').put({ owner: 'owner-a', sourceKey: 'legacy-library', verified: false })
      tx.oncomplete = () => resolve()
    })
    db.close()
    const resumed = await repo.initialize('owner-a', { seed: { version: 5, topics: [] }, legacy: { key: 'legacy-library', raw: '{' } })
    const marker = await repo.migration('owner-a')
    const unchanged = localStorage.getItem('legacy-library') === raw
    repo.close()
    return { migrated, resumed, marker, unchanged }
  }, initial)
  expect(result.migrated.library.version).toBe(5)
  expect(result.resumed).toEqual(result.migrated)
  expect(result.marker?.verified).toBe(true)
  expect(result.unchanged).toBe(true)
})

test('refuses malformed legacy or canonical data without replacing either with a seed', async ({ page }) => {
  const result = await page.evaluate(async (seed) => {
    const repo = await window.ArgusIDB.openIndexedLibraryRepository('corruption')
    localStorage.setItem('damaged-library', '{')
    let failed = false
    try { await repo.initialize('owner-a', { seed, legacy: { key: 'damaged-library', raw: '{' } }) } catch { failed = true }
    const absent = await repo.read('owner-a')
    await repo.initialize('owner-b', { seed })
    const db = await new Promise<IDBDatabase>((resolve) => { const req = indexedDB.open('corruption'); req.onsuccess = () => resolve(req.result) })
    await new Promise<void>((resolve) => {
      const tx = db.transaction('libraries', 'readwrite')
      tx.objectStore('libraries').put({ owner: 'owner-b', revision: 1, library: { version: 999 } })
      tx.oncomplete = () => resolve()
    })
    db.close()
    let canonicalFailed = false
    try { await repo.initialize('owner-b', { seed }) } catch { canonicalFailed = true }
    repo.close()
    return { failed, absent, canonicalFailed, original: localStorage.getItem('damaged-library') }
  }, initial)
  expect(result).toEqual({ failed: true, absent: null, canonicalFailed: true, original: '{' })
})

test('composes concurrent functional updates and commits the cumulative snapshot with intent', async ({ page }) => {
  const result = await page.evaluate(async (seed) => {
    const repo = await window.ArgusIDB.openIndexedLibraryRepository('composition')
    await repo.initialize('owner-a', { seed })
    await Promise.all([
      repo.update('owner-a', (library) => ({ ...library, topics: library.topics.map((topic, i) => i === 0 ? { ...topic, learningAt: '2026-10-13T13:00:00.000Z' } : topic) })),
      repo.update('owner-a', (library) => ({ ...library, topics: library.topics.map((topic, i) => i === 0 ? { ...topic, completedAt: '2026-10-13T14:00:00.000Z' } : topic) })),
    ])
    const saved = await repo.read('owner-a')
    const pending = await repo.pending('owner-a')
    repo.close()
    return { saved, pending }
  }, initial)
  expect(result.saved?.revision).toBe(3)
  expect(result.saved?.library.topics[0]).toMatchObject({ learningAt: '2026-10-13T13:00:00.000Z', completedAt: '2026-10-13T14:00:00.000Z' })
  expect(result.pending?.library).toEqual(result.saved?.library)
  expect(result.pending?.revision).toBe(3)
})

test('a failed outbox write aborts the learner write, with no false saved state', async ({ page }) => {
  const result = await page.evaluate(async (seed) => {
    const repo = await window.ArgusIDB.openIndexedLibraryRepository('atomic-abort')
    const before = await repo.initialize('owner-a', { seed })
    const put = IDBObjectStore.prototype.put
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === 'outbox') throw new DOMException('Simulated full storage', 'QuotaExceededError')
      return put.apply(this, args)
    }
    let rejected = false
    try { await repo.update('owner-a', (library) => ({ ...library, topics: [] })) } catch { rejected = true }
    finally { IDBObjectStore.prototype.put = put }
    const after = await repo.read('owner-a')
    const pending = await repo.pending('owner-a')
    repo.close()
    return { before, after, pending, rejected }
  }, initial)
  expect(result.rejected).toBe(true)
  expect(result.after).toEqual(result.before)
  expect(result.pending?.revision).toBe(1)
})

test('deletion intent and progress survive page reload offline; owners remain separate', async ({ page }) => {
  await page.evaluate(async (seed) => {
    const repo = await window.ArgusIDB.openIndexedLibraryRepository('restart')
    await repo.initialize('owner-a', { seed })
    await repo.initialize('owner-b', { seed: { version: 5, topics: [] } })
    await repo.update('owner-a', (library) => ({ ...library, topics: library.topics.slice(1) }))
    repo.close()
  }, initial)
  // Reload the document first, then test the persistence boundary with no network.
  // The production offline shell is a separate #113 lane, not claimed here.
  await page.reload()
  await page.addScriptTag({ content: bundle })
  await page.context().setOffline(true)
  const result = await page.evaluate(async () => {
    const repo = await window.ArgusIDB.openIndexedLibraryRepository('restart')
    const a = await repo.read('owner-a')
    const b = await repo.read('owner-b')
    const pending = await repo.pending('owner-a')
    repo.close()
    return { a, b, pending }
  })
  expect(result.a?.library.topics).toHaveLength(initial.topics.length - 1)
  expect(result.b?.library.topics).toHaveLength(0)
  expect(result.pending?.deletedTopicIds).toEqual([initial.topics[0].id])
})

test('acknowledgement cannot erase a newer pending mutation or another owner queue', async ({ page }) => {
  const result = await page.evaluate(async (seed) => {
    const repo = await window.ArgusIDB.openIndexedLibraryRepository('acknowledgements')
    await repo.initialize('owner-a', { seed })
    await repo.initialize('owner-b', { seed })
    await repo.update('owner-a', (library) => ({ ...library, topics: library.topics.slice(1) }))
    const stale = await repo.acknowledge('owner-a', 1, { obsolete: true })
    const newer = await repo.pending('owner-a')
    const ack = await repo.acknowledge('owner-a', 2, { agreed: true })
    const cleared = await repo.pending('owner-a')
    const ledger = await repo.readLedger('owner-a')
    const other = await repo.pending('owner-b')
    repo.close()
    return { stale, newer, ack, cleared, ledger, other }
  }, initial)
  expect(result.stale).toBe(false)
  expect(result.newer?.revision).toBe(2)
  expect(result.ack).toBe(true)
  expect(result.cleared).toBeNull()
  expect(result.ledger).toEqual({ agreed: true })
  expect(result.other?.revision).toBe(1)
})

test('a failed ledger acknowledgement keeps pending work and the previous ledger', async ({ page }) => {
  const result = await page.evaluate(async (seed) => {
    const repo = await window.ArgusIDB.openIndexedLibraryRepository('ack-abort')
    await repo.initialize('owner-a', { seed })
    let failed = false
    try { await repo.acknowledge('owner-a', 1, { cannotClone: () => {} }) } catch { failed = true }
    const pending = await repo.pending('owner-a')
    const ledger = await repo.readLedger('owner-a')
    repo.close()
    return { failed, pending, ledger }
  }, initial)
  expect(result.failed).toBe(true)
  expect(result.pending?.revision).toBe(1)
  expect(result.ledger).toEqual({})
})

test('re-adding a topic clears its pending deletion and no-op writes do not create sync work', async ({ page }) => {
  const result = await page.evaluate(async (seed) => {
    const repo = await window.ArgusIDB.openIndexedLibraryRepository('recreate')
    await repo.initialize('owner-a', { seed })
    await repo.update('owner-a', (library) => ({ ...library, topics: library.topics.slice(1) }))
    await repo.update('owner-a', (library) => ({ ...library, topics: [seed.topics[0], ...library.topics] }))
    const recreated = await repo.pending('owner-a')
    await repo.acknowledge('owner-a', 3, {})
    const noop = await repo.update('owner-a', (library) => library)
    const pending = await repo.pending('owner-a')
    repo.close()
    return { recreated, noop, pending }
  }, initial)
  expect(result.recreated?.deletedTopicIds).toEqual([])
  expect(result.noop.revision).toBe(3)
  expect(result.pending).toBeNull()
})

test('closes on schema upgrade and refuses to downgrade a newer database', async ({ page }) => {
  const result = await page.evaluate(async (seed) => {
    const repo = await window.ArgusIDB.openIndexedLibraryRepository('upgrade')
    await repo.initialize('owner-a', { seed })
    const newer = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('upgrade', 2)
      req.onupgradeneeded = () => req.result.createObjectStore('future-records')
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    const saved = await new Promise<unknown>((resolve) => {
      const req = newer.transaction('libraries').objectStore('libraries').get('owner-a')
      req.onsuccess = () => resolve(req.result)
    })
    newer.close()
    let refused = false
    try { await window.ArgusIDB.openIndexedLibraryRepository('upgrade') } catch { refused = true }
    return { saved, refused }
  }, initial)
  expect(result.refused).toBe(true)
  expect(result.saved).toMatchObject({ owner: 'owner-a', revision: 1, library: initial })
})
