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
}))
vi.mock('../../infrastructure/persistence/indexedLibraryRepository', () => ({
  openIndexedLibraryRepository: async () => ({
    read: async (owner: string) => fixture.records.get(owner) ?? null,
    initialize: async (owner: string, input: { seed: CurrentLibrary; legacy?: { raw: string } }) => {
      if (!fixture.records.has(owner)) {
        const library = input.legacy ? JSON.parse(input.legacy.raw) as CurrentLibrary : input.seed
        fixture.records.set(owner, { owner, revision: 1, library })
        fixture.pending.set(owner, 1)
      }
      return fixture.records.get(owner)!
    },
    update: async (owner: string, change: (library: CurrentLibrary) => CurrentLibrary) => {
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
beforeEach(() => { (globalThis as { __argusIndexedProviderTests?: boolean }).__argusIndexedProviderTests = true; fixture.records.clear(); fixture.pending.clear(); fixture.failNext = false; localStorage.clear() })
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
    fixture.failNext = true
    act(() => hook.result.current.updateTopic(hook.result.current.topics[0].id, (topic) =>
      ({ ...topic, title: 'Unsaved value' })))
    await waitFor(() => expect(document.querySelector('[role="alert"]')?.textContent).toContain('Quota exceeded'))
    expect(hook.result.current.topics[0].title).toBe(original)
    expect(fixture.records.get(ownerKey)?.library.topics[0].title).toBe(original)
    expect(fixture.pending.get(ownerKey)).toBe(1)
  })

  it('keeps UID-owned records isolated when switching accounts', async () => {
    const hook = await mounted()
    const id = hook.result.current.topics[0].id
    act(() => hook.result.current.updateTopic(id, (topic) => ({ ...topic, title: 'Account A' })))
    await waitFor(() => expect(hook.result.current.topics[0].title).toBe('Account A'))
    await act(async () => { await hook.result.current.bindOwner('owner-a') })
    await act(async () => { await hook.result.current.bindOwner('owner-b') })
    expect(hook.result.current.topics[0].title).not.toBe('Account A')
    await act(async () => { await hook.result.current.bindOwner('owner-a') })
    expect(hook.result.current.topics[0].title).toBe('Account A')
    expect(fixture.records.get('owner-b')?.library.topics[0].title).not.toBe('Account A')
  })
})
