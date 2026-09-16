// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor as rawWaitFor } from '@testing-library/react'
import { parseSyncedTopic, useSync, type SyncableStore } from './useSync'
import { rememberSignedIn } from './session'
import { unconfiguredSyncBackend, type SyncBackend, type SyncUser } from './backend'
import { topicJson, type RemoteRecord } from './plan'
import { recoveryEntryCount, writeLocalLibrary } from './local'
import { parseLibrary } from '../storage'
import { seedLibrary } from '../seed'
import type { CurrentLibrary, Topic } from '../types'

beforeEach(() => {
  localStorage.clear()
  rememberSignedIn()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  localStorage.clear()
})

function waitFor(assertion: () => void) {
  return rawWaitFor(assertion, { timeout: 5_000 })
}

function realTopic(id?: string): Topic {
  const topics = parseLibrary(seedLibrary())
  if (!topics.ok) throw new Error(topics.error)
  if (id) {
    const found = topics.library.topics.find((topic) => topic.id === id)
    if (!found) throw new Error(`Missing fixture topic ${id}`)
    return found
  }
  return topics.library.topics[0]
}

function oneTopicLibrary(topic: Topic): CurrentLibrary {
  return { version: 5, topics: [topic], catalogDelivered: [] }
}

interface MutableStore extends SyncableStore {
  replaced: CurrentLibrary[]
}

function fakeStore(initial: CurrentLibrary = { version: 5, topics: [], catalogDelivered: [] }): MutableStore {
  const replaced: CurrentLibrary[] = []
  const store = {
    library: initial,
    get topics() {
      return store.library.topics
    },
    replaced,
    upsertTopic(topic: Topic) {
      const at = store.library.topics.findIndex((candidate) => candidate.id === topic.id)
      store.library = {
        ...store.library,
        topics: at === -1
          ? [...store.library.topics, topic]
          : store.library.topics.map((candidate, index) => (index === at ? topic : candidate)),
      }
    },
    removeTopic(id: string) {
      store.library = { ...store.library, topics: store.library.topics.filter((topic) => topic.id !== id) }
    },
    replaceLibrary(library: CurrentLibrary) {
      store.library = library
      replaced.push(library)
    },
  }
  return store
}

interface FakeBackend extends SyncBackend {
  pushed: { uid: string; topicId: string; json: string; revision: number }[]
  deleted: { uid: string; topicId: string; revision: number }[]
  metaWrites: { uid: string; json: string; revision: number }[]
  emitUser: (user: SyncUser | null) => void
  emitRecords: (records: RemoteRecord[]) => void
  emitMeta: (json: string | null) => void
}

function fakeBackend(overrides: Partial<SyncBackend> = {}): FakeBackend {
  const pushed: FakeBackend['pushed'] = []
  const deleted: FakeBackend['deleted'] = []
  const metaWrites: FakeBackend['metaWrites'] = []
  let userListener: (user: SyncUser | null) => void = () => {}
  let recordListener: (records: RemoteRecord[]) => void = () => {}
  let metaListener: (json: string | null) => void = () => {}

  const backend: FakeBackend = {
    configured: true,
    pushed,
    deleted,
    metaWrites,
    emitUser: (user) => userListener(user),
    emitRecords: (records) => recordListener(records),
    emitMeta: (json) => metaListener(json),
    observeUser: (listener) => {
      userListener = listener
      return () => {}
    },
    signIn: async () => {},
    signOut: async () => {},
    observeLibrary: (_uid, onRecords) => {
      recordListener = onRecords
      return () => {}
    },
    pushTopic: async (uid, topicId, json, revision) => {
      pushed.push({ uid, topicId, json, revision })
    },
    deleteTopic: async (uid, topicId, revision) => {
      deleted.push({ uid, topicId, revision })
    },
    observeMeta: (_uid, onMeta) => {
      metaListener = onMeta
      return () => {}
    },
    pushMeta: async (uid, json, revision) => {
      metaWrites.push({ uid, json, revision })
    },
    ...overrides,
  }
  return backend
}

const OWNER: SyncUser = { uid: 'owner-uid', email: 'owner@example.test', displayName: 'Owner' }
const OTHER: SyncUser = { uid: 'other-uid', email: 'other@example.test', displayName: 'Other' }

function emitCloud(backend: FakeBackend, records: RemoteRecord[], meta: string | null = null) {
  act(() => {
    backend.emitRecords(records)
    backend.emitMeta(meta)
  })
}

describe('configured entry recovery', () => {
  it('restores valid cloud state when the local account cache is missing', async () => {
    const topic = realTopic()
    const store = fakeStore()
    const backend = fakeBackend()
    const { result } = renderHook(() => useSync(store, backend))

    act(() => backend.emitUser(OWNER))
    expect(result.current.state.kind).toBe('restoring')
    emitCloud(backend, [{ topicId: topic.id, json: topicJson(topic), revision: 4, updatedAtMs: 1 }])

    await waitFor(() => expect(result.current.state.kind).toBe('synced'))
    expect(store.library.topics.some((candidate) => candidate.id === topic.id)).toBe(true)
  })

  it('quarantines corrupt local bytes and restores the valid cloud copy', async () => {
    const topic = realTopic()
    localStorage.setItem('argus.library.sync.v1.owner-uid', '{ definitely-not-json')
    const store = fakeStore()
    const backend = fakeBackend()
    const { result } = renderHook(() => useSync(store, backend))

    act(() => backend.emitUser(OWNER))
    emitCloud(backend, [{ topicId: topic.id, json: topicJson(topic), revision: 2, updatedAtMs: 1 }])

    await waitFor(() => expect(result.current.state.kind).toBe('synced'))
    expect(recoveryEntryCount(OWNER.uid)).toBe(1)
    expect(store.library.topics.some((candidate) => candidate.id === topic.id)).toBe(true)
  })

  it('seeds an empty cloud namespace from an existing validated legacy learner library', async () => {
    const topic = realTopic()
    localStorage.setItem('argus.library.v5', JSON.stringify(oneTopicLibrary(topic)))
    const store = fakeStore()
    const backend = fakeBackend()
    const { result } = renderHook(() => useSync(store, backend))

    act(() => backend.emitUser(OWNER))
    emitCloud(backend, [])

    await waitFor(() => expect(result.current.state.kind).toBe('synced'))
    expect(backend.pushed.some((write) => write.topicId === topic.id)).toBe(true)
    expect(store.library.topics.some((candidate) => candidate.id === topic.id)).toBe(true)
  })

  it('creates fresh state only after both local and cloud are confirmed absent', async () => {
    const store = fakeStore()
    const backend = fakeBackend()
    const { result } = renderHook(() => useSync(store, backend))

    act(() => backend.emitUser(OWNER))
    expect(store.library.topics).toHaveLength(0)
    expect(result.current.state.kind).toBe('restoring')

    emitCloud(backend, [])
    await waitFor(() => expect(result.current.state.kind).toBe('synced'))
    expect(store.library.topics.length).toBeGreaterThan(0)
    expect(backend.pushed.length).toBeGreaterThan(0)
  })

  it('does not enter on a legacy/fresh copy when first cloud verification fails', async () => {
    let failLibrary: (message: string) => void = () => {}
    const backend = fakeBackend({
      observeLibrary: (_uid, _records, onError) => {
        failLibrary = onError
        return () => {}
      },
    })
    const store = fakeStore()
    const { result } = renderHook(() => useSync(store, backend))

    act(() => backend.emitUser(OWNER))
    act(() => failLibrary('network unavailable'))

    await waitFor(() => expect(result.current.state.kind).toBe('error'))
    expect(result.current.state).toMatchObject({ kind: 'error', user: null, ready: false })
    expect(store.library.topics).toHaveLength(0)
  })
})

describe('local-first writes and retry', () => {
  it('keeps an authenticated UID cache usable offline after it has been established', async () => {
    const topic = realTopic()
    writeLocalLibrary(OWNER.uid, oneTopicLibrary(topic))
    let failLibrary: (message: string) => void = () => {}
    const backend = fakeBackend({
      observeLibrary: (_uid, _records, onError) => {
        failLibrary = onError
        return () => {}
      },
    })
    const store = fakeStore()
    const { result } = renderHook(() => useSync(store, backend))

    act(() => backend.emitUser(OWNER))
    act(() => failLibrary('offline'))

    await waitFor(() => expect(result.current.state.kind).toBe('error'))
    expect(result.current.state).toMatchObject({ kind: 'error', user: OWNER, ready: true })
    expect(store.library.topics.some((candidate) => candidate.id === topic.id)).toBe(true)
  })

  it('coalesces a local change, survives a failed write, and retries it', async () => {
    vi.useFakeTimers()
    const topic = realTopic()
    writeLocalLibrary(OWNER.uid, oneTopicLibrary(topic))
    let attempts = 0
    const backend = fakeBackend({
      pushTopic: async (_uid, _topicId, _json, _revision) => {
        attempts += 1
        if (attempts === 1) throw new Error('network unavailable')
      },
    })
    const store = fakeStore()
    const { result, rerender } = renderHook(() => useSync(store, backend))

    act(() => backend.emitUser(OWNER))
    emitCloud(backend, [{ topicId: topic.id, json: topicJson(topic), revision: 1, updatedAtMs: 1 }], JSON.stringify({ version: 5, catalogDelivered: [] }))
    await act(async () => { await vi.runAllTimersAsync() })
    expect(result.current.state.kind).toBe('synced')

    const changed = { ...store.library.topics.find((candidate) => candidate.id === topic.id)!, status: 'learning' as const }
    store.library = {
      ...store.library,
      topics: store.library.topics.map((candidate) => candidate.id === topic.id ? changed : candidate),
    }
    rerender()

    await act(async () => { await vi.advanceTimersByTimeAsync(700) })
    expect(attempts).toBe(1)
    expect(result.current.state.kind).toBe('error')
    expect(localStorage.getItem(`argus.library.sync.pending.v1.${OWNER.uid}`)).toBe('1')

    await act(async () => { await vi.advanceTimersByTimeAsync(2_100) })
    expect(attempts).toBeGreaterThanOrEqual(2)
    expect(result.current.state.kind).toBe('synced')
  })

  it('synchronizes a deliberate imported replacement', async () => {
    vi.useFakeTimers()
    const topic = realTopic()
    writeLocalLibrary(OWNER.uid, oneTopicLibrary(topic))
    const backend = fakeBackend()
    const store = fakeStore()
    const { result, rerender } = renderHook(() => useSync(store, backend))

    act(() => backend.emitUser(OWNER))
    emitCloud(backend, [{ topicId: topic.id, json: topicJson(topic), revision: 1, updatedAtMs: 1 }], JSON.stringify({ version: 5, catalogDelivered: [] }))
    await act(async () => { await vi.runAllTimersAsync() })
    expect(result.current.state.kind).toBe('synced')

    const imported = { ...topic, title: `${topic.title} imported` }
    store.library = { ...store.library, topics: [imported] }
    rerender()
    await act(async () => { await vi.advanceTimersByTimeAsync(700) })

    expect(backend.pushed.some((write) => JSON.parse(write.json).title === imported.title)).toBe(true)
  })
})

describe('identity and portable learner state', () => {
  it('never exposes account A cache after switching to account B', async () => {
    const a = { ...realTopic(), id: 'account-a-topic', title: 'Account A' }
    const b = { ...realTopic(), id: 'account-b-topic', title: 'Account B' }
    writeLocalLibrary(OWNER.uid, oneTopicLibrary(a))
    writeLocalLibrary(OTHER.uid, oneTopicLibrary(b))
    const backend = fakeBackend()
    const store = fakeStore()
    const { result } = renderHook(() => useSync(store, backend))

    act(() => backend.emitUser(OWNER))
    emitCloud(backend, [])
    await waitFor(() => expect(result.current.state.kind).toBe('synced'))
    expect(store.library.topics.some((topic) => topic.id === a.id)).toBe(true)

    act(() => backend.emitUser(OTHER))
    expect(result.current.state.kind).toBe('restoring')
    expect(store.library.topics.some((topic) => topic.id === a.id)).toBe(false)
    emitCloud(backend, [])
    await waitFor(() => expect(result.current.state.kind).toBe('synced'))
    expect(store.library.topics.some((topic) => topic.id === b.id)).toBe(true)
    expect(store.library.topics.some((topic) => topic.id === a.id)).toBe(false)
  })

  it('round-trips Morse lessonSitting with history and evidence through cloud JSON', async () => {
    const morse = realTopic('international-morse-letters-printed')
    const itemId = morse.items[0].id
    if (!itemId) throw new Error('Morse fixture item needs a durable id.')
    const portable: Topic = {
      ...morse,
      history: [{ at: '2026-09-15T12:00:00.000Z', correct: 1, total: 1, resolvedTo: 'learning' }],
      lessonSitting: {
        retrievals: 2,
        correct: 1,
        revisitItemIds: [itemId],
        listeningSuppressed: true,
      },
    }
    const json = topicJson(portable)
    const parsed = parseSyncedTopic(json)
    expect(parsed?.lessonSitting).toEqual(portable.lessonSitting)
    expect(parsed?.history).toEqual(portable.history)

    const store = fakeStore()
    const backend = fakeBackend()
    const { result } = renderHook(() => useSync(store, backend))
    act(() => backend.emitUser(OWNER))
    emitCloud(backend, [{ topicId: portable.id, json, revision: 7, updatedAtMs: 1 }])
    await waitFor(() => expect(result.current.state.kind).toBe('synced'))
    expect(store.library.topics.find((topic) => topic.id === portable.id)?.lessonSitting).toEqual(portable.lessonSitting)
  })
})

describe('parsing and optional configuration', () => {
  it('refuses malformed remote records at the v5 boundary', () => {
    expect(parseSyncedTopic('{ not json')).toBeNull()
    expect(parseSyncedTopic('"a string"')).toBeNull()
    expect(parseSyncedTopic('{"id":"x","status":"invented"}')).toBeNull()
  })

  it('reports sync unavailable in a build with no Firebase configuration', () => {
    const store = fakeStore()
    const { result } = renderHook(() => useSync(store, unconfiguredSyncBackend()))
    expect(result.current.state.kind).toBe('unconfigured')
  })
})
