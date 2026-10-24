// @vitest-environment jsdom
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { LibraryProvider, useLibrary } from './LibraryProvider'
import { freshSeedLibrary } from '../../infrastructure/persistence/libraryMigrations'
import type { CurrentLibrary } from '../../domain/library/library'

/**
 * Sync re-offers the library's cloud metadata every time the library is
 * published. An offer that changes nothing must cost nothing: no transaction,
 * no re-publish (which would re-run the effect that made the offer).
 */
const fixture = vi.hoisted(() => ({
  records: new Map<string, { owner: string; revision: number; library: CurrentLibrary }>(),
  updates: 0,
}))
vi.mock('../../infrastructure/persistence/indexedLibraryRepository', () => ({
  openIndexedLibraryRepository: async () => ({
    read: async (owner: string) => fixture.records.get(owner) ?? null,
    initialize: async (owner: string, input: { seed: CurrentLibrary }) => {
      if (!fixture.records.has(owner)) fixture.records.set(owner, { owner, revision: 1, library: input.seed })
      return fixture.records.get(owner)!
    },
    update: async (owner: string, change: (library: CurrentLibrary) => CurrentLibrary) => {
      fixture.updates += 1
      await new Promise((resolve) => setTimeout(resolve, 2))
      const before = fixture.records.get(owner)!
      const next = change(before.library)
      // Like the real repository: a no-op returns the stored record, as a copy.
      if (next === before.library || JSON.stringify(next) === JSON.stringify(before.library)) return structuredClone(before)
      const record = { owner, revision: before.revision + 1, library: next }
      fixture.records.set(owner, record)
      return structuredClone(record)
    },
    close: () => {},
  }),
}))

const ownerKey = '__argus_unclaimed_local__'
let store!: ReturnType<typeof useLibrary>
let renders = 0

function Probe() {
  store = useLibrary()
  renders += 1
  useEffect(() => { /* a published library re-renders this probe */ }, [store])
  return <p>ready</p>
}

beforeEach(() => {
  (globalThis as { __argusIndexedProviderTests?: boolean }).__argusIndexedProviderTests = true
  localStorage.clear()
  fixture.updates = 0
  renders = 0
  fixture.records = new Map([[ownerKey, { owner: ownerKey, revision: 1, library: freshSeedLibrary() }]])
})
afterEach(() => {
  cleanup();
  (globalThis as { __argusIndexedProviderTests?: boolean }).__argusIndexedProviderTests = false
})

async function settle() {
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 60)) })
}

describe('writes that change nothing', () => {
  it('cost no transaction and no re-publish', async () => {
    render(<LibraryProvider><Probe /></LibraryProvider>)
    await screen.findByText('ready')
    await settle()
    const updates = fixture.updates
    const rendered = renders

    await act(async () => {
      await store.mergeCatalogDelivered([])
      await store.mergeRoleAwards?.(store.roleAwards ?? [], store.roleAwardGeneration ?? 0)
    })
    await settle()
    expect(fixture.updates).toBe(updates)
    expect(renders).toBe(rendered)
  })

  it('an update that returns the topic unchanged writes nothing and publishes nothing', async () => {
    render(<LibraryProvider><Probe /></LibraryProvider>)
    await screen.findByText('ready')
    await settle()
    const id = store.topics[0].id
    const updates = fixture.updates
    const rendered = renders
    const revision = fixture.records.get(ownerKey)!.revision

    await act(async () => { await store.updateTopic(id, (topic) => topic) })
    await settle()
    expect(fixture.updates).toBe(updates + 1) // still a transaction: it must read to know
    expect(fixture.records.get(ownerKey)!.revision).toBe(revision)
    expect(renders).toBe(rendered)
  })

  it('a real change still commits once and is published', async () => {
    render(<LibraryProvider><Probe /></LibraryProvider>)
    await screen.findByText('ready')
    await settle()
    const id = store.topics[0].id
    const revision = fixture.records.get(ownerKey)!.revision

    await act(async () => { await store.updateTopic(id, (topic) => ({ ...topic, scope: `${topic.scope} (edited)` })) })
    await settle()
    expect(fixture.records.get(ownerKey)!.revision).toBe(revision + 1)
    expect(store.topics.find((topic) => topic.id === id)!.scope).toMatch(/\(edited\)$/)
  })
})
