// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { LibraryProvider, useLibrary } from './LibraryProvider'
import { freshSeedLibrary, reconcileLoadedLibrary } from '../../infrastructure/persistence/libraryMigrations'
import { recoveryEntries } from '../../infrastructure/persistence/localLibraryRepository'
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
    pending: async (owner: string) => {
      const row = fixture.records.get(owner)
      return row && fixture.pending.has(owner) ? { ...row, deletedTopicIds: [] } : null
    },
    readLedger: async () => ({}),
    acknowledge: async () => false,
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

  it('migrates, hydrates, updates and re-parks formative Morse recognition (#279) without loss', async () => {
    const recognition = {
      schemaVersion: 1 as const,
      streams: {
        'read/speed': {
          sequence: 4,
          characters: {
            E: { outcomes: [true, true, false], shown: 3, lastShownSequence: 4, lastGradedSequence: 4, recentCorrectMs: [1800, 2400] },
          },
        },
      },
    }
    const old = readyLibrary()
    const withRecognition = { ...old, topics: old.topics.map((topic, index) => index === 0 ? { ...topic, morseRecognition: recognition } : topic) }
    const id = withRecognition.topics[0].id
    localStorage.setItem(key, JSON.stringify(withRecognition))
    const hook = await mounted()
    // Migrated into the canonical record and hydrated into the visible library.
    expect(fixture.records.get(ownerKey)?.library.topics[0].morseRecognition).toEqual(recognition)
    expect(hook.result.current.topics[0].morseRecognition).toEqual(recognition)
    // The write path the practice surface uses, then an unrelated write on top of it.
    const next = { ...recognition, streams: { ...recognition.streams, 'listen/practice@12': { sequence: 1, characters: {} } } }
    await act(async () => {
      expect(await hook.result.current.updateTopic(id, (topic) => ({ ...topic, morseRecognition: next }))).toBe(true)
    })
    await act(async () => {
      expect(await hook.result.current.updateTopic(id, (topic) => ({ ...topic, scope: 'Unrelated' }))).toBe(true)
    })
    expect(fixture.records.get(ownerKey)?.library.topics[0].morseRecognition).toEqual(next)
    // It travels with the account across a switch and back.
    await act(async () => { await hook.result.current.bindOwner('owner-a') })
    await act(async () => { await hook.result.current.bindOwner('owner-b') })
    expect(hook.result.current.topics[0].morseRecognition).toBeUndefined()
    await act(async () => { await hook.result.current.bindOwner('owner-a') })
    expect(hook.result.current.topics[0].morseRecognition).toEqual(next)
    expect(fixture.records.get('owner-a')?.library.topics[0].morseRecognition).toEqual(next)
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

  describe('writes belong to the account that was on screen when they were made', () => {
    async function boundToA() {
      const hook = await mounted()
      await act(async () => { await hook.result.current.bindOwner('owner-a') })
      return hook
    }

    it('rejects a write issued for account A after bindOwner(B) was called but before it published', async () => {
      const hook = await boundToA()
      const id = hook.result.current.topics[0].id
      const stale = hook.result.current
      const releaseB = hold('read', 'owner-b')
      let binding!: Promise<void>
      let write!: Promise<boolean | void>
      act(() => { binding = Promise.resolve(hook.result.current.bindOwner('owner-b')) })
      act(() => { write = Promise.resolve(stale.updateTopic(id, (topic) => ({ ...topic, title: 'Stale write for A' }))) })
      await act(async () => { await new Promise((r) => setTimeout(r, 20)); releaseB(); await binding })
      expect(await write).toBe(false)
      expect(fixture.records.get('owner-b')?.library.topics[0].title).not.toBe('Stale write for A')
      expect(fixture.records.get('owner-a')?.library.topics[0].title).not.toBe('Stale write for A')
      expect(hook.result.current.owner).toBe('owner-b')
    })

    it('refuses a retry from account A\'s screen once account B is active, and never lands it in B', async () => {
      const hook = await boundToA()
      const id = hook.result.current.topics[0].id
      const stale = hook.result.current
      await act(async () => { await hook.result.current.bindOwner('owner-b') })
      const before = JSON.stringify(fixture.records.get('owner-b')?.library)
      await act(async () => {
        expect(await stale.updateTopic(id, (topic) => ({ ...topic, title: 'Late retry for A' }))).toBe(false)
        expect(await stale.upsertTopic({ ...stale.topics[0], title: 'Late upsert for A' })).toBe(false)
      })
      expect(JSON.stringify(fixture.records.get('owner-b')?.library)).toBe(before)
      // The refusal is the caller's to report; it is not a storage failure of B's library.
      expect(document.querySelector('[role="alert"]')).toBeNull()
    })

    it('still commits a write issued for A before the switch to A, ahead of the bind', async () => {
      const hook = await boundToA()
      const id = hook.result.current.topics[0].id
      let write!: Promise<boolean | void>
      let binding!: Promise<void>
      act(() => {
        write = Promise.resolve(hook.result.current.updateTopic(id, (topic) => ({ ...topic, title: 'A edit' })))
        binding = Promise.resolve(hook.result.current.bindOwner('owner-b'))
      })
      await act(async () => { await Promise.all([write, binding]) })
      expect(await write).toBe(true)
      expect(fixture.records.get('owner-a')?.library.topics[0].title).toBe('A edit')
      expect(fixture.records.get('owner-b')?.library.topics[0].title).not.toBe('A edit')
    })
  })

  it('does not leave the unclaimed library claimable by another account when the owner marker cannot be written', async () => {
    const hook = await unclaimedWithProgress()
    const original = Storage.prototype.setItem
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, name: string, value: string) {
      if (name === 'argus.library.owner.v1') throw new Error('QuotaExceededError')
      return original.call(this, name, value)
    })
    await act(async () => { await expect(Promise.resolve(hook.result.current.bindOwner('owner-a'))).rejects.toThrow() })
    spy.mockRestore()
    expect(localStorage.getItem('argus.library.owner.v1')).toBeNull()
    await act(async () => { await hook.result.current.bindOwner('owner-b') })
    expect(titlesHolding(MARKER)).toEqual(['owner-a'])
    expect(hook.result.current.topics[0].title).not.toBe(MARKER)
  })

  it('lets sign-out cancel a bind that has not started writing', async () => {
    const hook = await unclaimedWithProgress()
    const release = hold('read', 'owner-a')
    let binding!: Promise<void>
    act(() => { binding = Promise.resolve(hook.result.current.bindOwner('owner-a')).catch(() => {}) })
    act(() => { hook.result.current.cancelPendingBinds() })
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); release(); await binding })
    expect(hook.result.current.owner).toBeNull()
    expect(fixture.records.has('owner-a')).toBe(false)
    expect(localStorage.getItem('argus.library.owner.v1')).toBeNull()
  })

  it('keeps a recovery copy and starts fresh when the old local library cannot be read', async () => {
    localStorage.setItem(key, '{not json')
    const hook = await mounted()
    expect(hook.result.current.topics.length).toBeGreaterThan(0)
    expect(recoveryEntries()).toHaveLength(1)
    expect(recoveryEntries()[0].raw).toBe('{not json')
    expect(localStorage.getItem(key)).toBe('{not json')
    expect(fixture.records.get(ownerKey)).toBeDefined()
  })

  it('reports the catalog reconciliation of an import, not of the already-reconciled result', async () => {
    const hook = await mounted()
    const next = { version: 5 as const, topics: [], catalogDelivered: [] }
    const expected = reconcileLoadedLibrary(next).report
    await act(async () => { expect(await hook.result.current.replaceLibrary(next)).toBe(true) })
    expect(hook.result.current.catalogReport).toEqual(expected)
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

describe('provisioned offline gate over the production provider', () => {
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

  it('renders the local learner after a bounded auth wait and closes during a different owner bind', async () => {
    const { SyncProvider } = await import('../sync/SyncProvider')
    const { AuthGate } = await import('../../app/gate/AuthGate')
    const { rememberSignedIn } = await import('../sync/syncSession')
    const { render, screen } = await import('@testing-library/react')
    const library = readyLibrary()
    fixture.records.set('a', { owner: 'a', revision: 1, library })
    localStorage.setItem('argus.library.owner.v1', 'a')
    rememberSignedIn()
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    let emit: (user: import('../sync/syncBackend').SyncUser | null) => void = () => {}
    const backend: import('../sync/syncBackend').SyncBackend = {
      configured: true, observeUser: (listener) => { emit = listener; return () => {} },
      signIn: async () => {}, signOut: async () => {}, observeLibrary: vi.fn(() => () => {}),
      observeMeta: () => () => {}, pushTopic: vi.fn(), deleteTopic: vi.fn(), pushMeta: vi.fn(),
    }
    vi.useFakeTimers()
    render(<LibraryProvider><SyncProvider backend={backend}><AuthGate /></SyncProvider></LibraryProvider>)
    await act(async () => { for (let i = 0; i < 40; i++) await Promise.resolve() })
    expect(screen.getByText('Checking your session…')).toBeTruthy()
    await act(async () => { await vi.advanceTimersByTimeAsync(3000) })
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeTruthy()
    expect(backend.observeLibrary).not.toHaveBeenCalled()
    let release!: () => void
    fixture.holds.set('read:b', new Promise<void>((resolve) => { release = resolve }))
    act(() => emit({ uid: 'b', email: null, displayName: null }))
    expect(screen.queryByRole('navigation', { name: 'Sections' })).toBeNull()
    await act(async () => { await vi.advanceTimersByTimeAsync(5000) })
    expect(screen.queryByRole('navigation', { name: 'Sections' })).toBeNull()
    await act(async () => { release(); for (let i = 0; i < 30; i++) await Promise.resolve() })
    expect(screen.getByRole('navigation', { name: 'Sections' })).toBeTruthy()
    expect(fixture.records.get('b')!.library.topics.every((topic) => topic.history.length === 0)).toBe(true)
    expect(fixture.records.get('a')!.library.topics).toEqual(library.topics)
  })

  it('does not provision a fresh seed merely because an owner marker survives missing local data', async () => {
    localStorage.setItem('argus.library.owner.v1', 'missing')
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const { render, screen } = await import('@testing-library/react')
    render(<LibraryProvider><div>learner mounted</div></LibraryProvider>)
    await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('connection'))
    expect(screen.queryByText('learner mounted')).toBeNull()
    expect(fixture.records.has('missing')).toBe(false)
  })

  it('leaves a new offline device behind sign-in without exposing its unclaimed seed', async () => {
    const { SyncProvider } = await import('../sync/SyncProvider')
    const { AuthGate } = await import('../../app/gate/AuthGate')
    const { render, screen } = await import('@testing-library/react')
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const { unconfiguredSyncBackend } = await import('../sync/syncBackend')
    render(<LibraryProvider><SyncProvider backend={{ ...unconfiguredSyncBackend(), configured: true }}><AuthGate /></SyncProvider></LibraryProvider>)
    await waitFor(() => expect(screen.getByRole('button', { name: /continue with google/i })).toBeTruthy())
    expect(screen.queryByRole('navigation', { name: 'Sections' })).toBeNull()
    expect(localStorage.getItem('argus.library.owner.v1')).toBeNull()
  })
})
