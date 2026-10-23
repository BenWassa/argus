// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { LibraryProvider, useLibrary } from './LibraryProvider'
import { freshSeedLibrary } from '../../infrastructure/persistence/libraryMigrations'
import { COMMUNICATOR } from '../../domain/roles/definitions'
import type { CurrentLibrary } from '../../domain/library/library'

const fixture = vi.hoisted(() => ({
  records: new Map<string, { owner: string; revision: number; library: CurrentLibrary }>(),
  pending: new Map<string, number>(),
  failNext: false,
  /** Deferred repository calls, keyed `${operation}:${owner}`; a test resolves them in any order. */
  holds: new Map<string, Promise<void>>(),
  calls: [] as string[],
}))
async function held(operation: string, owner: string) {
  fixture.calls.push(`${operation}:${owner}`)
  await fixture.holds.get(`${operation}:${owner}`)
}
vi.mock('../../infrastructure/persistence/indexedLibraryRepository', () => ({
  openIndexedLibraryRepository: async () => ({
    read: async (owner: string) => { await held('read', owner); return fixture.records.get(owner) ?? null },
    initialize: async (owner: string, input: { seed: CurrentLibrary; legacy?: { raw: string } }) => {
      await held('initialize', owner)
      if (!fixture.records.has(owner)) {
        const library = input.legacy ? JSON.parse(input.legacy.raw) as CurrentLibrary : input.seed
        fixture.records.set(owner, { owner, revision: 1, library })
        fixture.pending.set(owner, 1)
      }
      return fixture.records.get(owner)!
    },
    update: async (owner: string, change: (library: CurrentLibrary) => CurrentLibrary) => {
      await held('update', owner)
      if (fixture.failNext) { fixture.failNext = false; throw new Error('Quota exceeded') }
      const before = fixture.records.get(owner)!
      const next = change(before.library)
      if (JSON.stringify(next) === JSON.stringify(before.library)) return before
      const record = { owner, revision: before.revision + 1, library: next }
      fixture.records.set(owner, record)
      fixture.pending.set(owner, record.revision)
      return record
    },
    close: () => {},
  }),
}))
const now = new Date('2026-10-13T15:00:00Z')
const ids = COMMUNICATOR.pathways.flatMap((path) => [...path.topicIds])
const key = 'argus.library.v5'
const ownerKey = '__argus_unclaimed_local__'
beforeEach(() => { (globalThis as { __argusIndexedProviderTests?: boolean }).__argusIndexedProviderTests = true; fixture.records.clear(); fixture.pending.clear(); fixture.failNext = false; fixture.holds.clear(); fixture.calls = []; localStorage.clear() })
afterEach(() => { cleanup(); (globalThis as { __argusIndexedProviderTests?: boolean }).__argusIndexedProviderTests = false })

function readyLibrary() {
  const library = freshSeedLibrary(now)
  return { ...library, topics: library.topics.map((topic) =>
    ids.includes(topic.id as typeof ids[number])
      ? { ...topic, completedAt: now.toISOString(), status: 'completed' as const } : topic) }
}

async function mounted() {
  const hook = renderHook(useLibrary, { wrapper: LibraryProvider })
  await waitFor(() => expect(hook.result.current?.topics).toBeDefined())
  return hook
}

describe('production IndexedDB provider integration', () => {
  it('migrates old data without overwriting its bytes, preserving awards and topic evidence', async () => {
    const old = readyLibrary()
    localStorage.setItem(key, JSON.stringify(old))
    const hook = await mounted()
    await waitFor(() => expect(hook.result.current.roleAwards).toHaveLength(1))
    expect(localStorage.getItem(key)).toBe(JSON.stringify(old))
    expect(fixture.records.get(ownerKey)?.library.topics).toHaveLength(old.topics.length)
    expect(fixture.pending.get(ownerKey)).toBe(fixture.records.get(ownerKey)?.revision)
    hook.unmount()
  })

  it('commits sequential functional updates and outbox before publishing state', async () => {
    const hook = await mounted()
    const id = hook.result.current.topics[0].id
    const previous = hook.result.current.topics[0]
    const baselineRevision = fixture.records.get(ownerKey)!.revision
    act(() => {
      hook.result.current.updateTopic(id, (topic) => ({ ...topic, title: 'First title' }))
      hook.result.current.updateTopic(id, (topic) => ({ ...topic, scope: 'Second scope' }))
    })
    await waitFor(() => expect(hook.result.current.topics[0].scope).toBe('Second scope'))
    expect(hook.result.current.topics[0]).toMatchObject({ title: 'First title', scope: 'Second scope' })
    expect(fixture.records.get(ownerKey)?.library.topics[0].title).toBe('First title')
    expect(fixture.pending.get(ownerKey)).toBe(baselineRevision + 2)
    expect(previous.title).not.toBe('First title')
  })

  it('does not publish failed commits; warns the learner and keeps the durable previous record', async () => {
    const hook = await mounted()
    const original = hook.result.current.topics[0].title
    const baselineRevision = fixture.pending.get(ownerKey)
    fixture.failNext = true
    act(() => { void hook.result.current.updateTopic(hook.result.current.topics[0].id, (topic) =>
      ({ ...topic, title: 'Unsaved value' })) })
    await waitFor(() => expect(document.querySelector('[role="alert"]')?.textContent).toContain('Quota exceeded'))
    expect(hook.result.current.topics[0].title).toBe(original)
    expect(fixture.records.get(ownerKey)?.library.topics[0].title).toBe(original)
    expect(fixture.pending.get(ownerKey)).toBe(baselineRevision)
  })

  it('keeps UID-owned records isolated when switching accounts', async () => {
    const hook = await mounted()
    const id = hook.result.current.topics[0].id
    act(() => { void hook.result.current.updateTopic(id, (topic) => ({ ...topic, title: 'Account A' })) })
    await waitFor(() => expect(hook.result.current.topics[0].title).toBe('Account A'))
    await act(async () => { await hook.result.current.bindOwner('owner-a') })
    await act(async () => { await hook.result.current.bindOwner('owner-b') })
    expect(hook.result.current.topics[0].title).not.toBe('Account A')
    await act(async () => { await hook.result.current.bindOwner('owner-a') })
    expect(hook.result.current.topics[0].title).toBe('Account A')
    expect(fixture.records.get('owner-b')?.library.topics[0].title).not.toBe('Account A')
  })

  /** A deferred repository operation that the test releases explicitly. */
  function hold(operation: string, owner: string) {
    let release!: () => void
    fixture.holds.set(`${operation}:${owner}`, new Promise<void>((resolve) => { release = resolve }))
    return release
  }
  const MARKER = 'Unclaimed progress'
  function titlesHolding(title: string) {
    return [...fixture.records.values()].filter((record) => record.owner !== ownerKey && record.library.topics.some((t) => t.title === title))
      .map((record) => record.owner)
  }
  async function unclaimedWithProgress() {
    const hook = await mounted()
    await act(async () => {
      await hook.result.current.updateTopic(hook.result.current.topics[0].id, (topic) => ({ ...topic, title: MARKER }))
    })
    expect(fixture.records.get(ownerKey)?.library.topics[0].title).toBe(MARKER)
    return hook
  }

  it('lets a superseded bind neither claim the unclaimed library nor publish over the newer account', async () => {
    const hook = await unclaimedWithProgress()
    const releaseA = hold('read', 'owner-a')
    let a!: Promise<void>, b!: Promise<void>
    act(() => {
      a = Promise.resolve(hook.result.current.bindOwner('owner-a')).catch(() => {})
      b = Promise.resolve(hook.result.current.bindOwner('owner-b')).catch(() => {})
    })
    // The newer account's calls may run first; the older one resolves last.
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); releaseA(); await Promise.all([a, b]) })
    expect(hook.result.current.owner).toBe('owner-b')
    expect(localStorage.getItem('argus.library.owner.v1')).toBe('owner-b')
    expect(hook.result.current.topics[0].title).toBe(MARKER)
    // The unclaimed library is claimed exactly once, by the account that is current.
    expect(titlesHolding(MARKER)).toEqual(['owner-b'])
    expect(fixture.records.has('owner-a')).toBe(false)
  })

  it('claims the unclaimed library once when an overlapping bind starts after the first committed', async () => {
    const hook = await unclaimedWithProgress()
    const releaseUpdate = hold('update', 'owner-a')
    let a!: Promise<void>, b!: Promise<void>
    act(() => { a = Promise.resolve(hook.result.current.bindOwner('owner-a')).catch(() => {}) })
    await waitFor(() => expect(fixture.calls).toContain('update:owner-a'))
    act(() => { b = Promise.resolve(hook.result.current.bindOwner('owner-b')).catch(() => {}) })
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); releaseUpdate(); await Promise.all([a, b]) })
    expect(hook.result.current.owner).toBe('owner-b')
    expect(localStorage.getItem('argus.library.owner.v1')).toBe('owner-b')
    expect(titlesHolding(MARKER)).toHaveLength(1)
    expect(fixture.records.get('owner-b')?.library.topics[0].title).not.toBe(MARKER)
    expect(hook.result.current.topics[0].title).not.toBe(MARKER)
  })

  it('never lets an obsolete bind restore its account after A to B to A overlap', async () => {
    const hook = await mounted()
    const release = hold('read', 'owner-a')
    let all!: Promise<unknown>
    act(() => {
      all = Promise.all(['owner-a', 'owner-b', 'owner-c'].map((uid) =>
        Promise.resolve(hook.result.current.bindOwner(uid)).catch(() => {})))
    })
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); release(); await all })
    expect(hook.result.current.owner).toBe('owner-c')
    expect(localStorage.getItem('argus.library.owner.v1')).toBe('owner-c')
  })

  it('preserves the committed learner record and outbox when import or reset fails', async () => {
    const hook = await mounted()
    const previous = fixture.records.get(ownerKey)!.library
    const pending = fixture.pending.get(ownerKey)
    fixture.failNext = true
    await act(async () => {
      expect(await hook.result.current.replaceLibrary({ version: 5, topics: [], catalogDelivered: [] })).toBe(false)
    })
    expect(fixture.records.get(ownerKey)?.library).toEqual(previous)
    expect(fixture.pending.get(ownerKey)).toBe(pending)
    expect(hook.result.current.topics).toEqual(previous.topics)
    fixture.failNext = true
    await act(async () => {
      expect(await hook.result.current.resetLibrary()).toBe(false)
    })
    expect(fixture.records.get(ownerKey)?.library).toEqual(previous)
    expect(fixture.pending.get(ownerKey)).toBe(pending)
    expect(hook.result.current.topics).toEqual(previous.topics)
  })
})
