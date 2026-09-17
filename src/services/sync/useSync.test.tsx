// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, renderHook, waitFor as rawWaitFor } from '@testing-library/react'
import { parseSyncedTopic, useSync, type SyncableStore } from './useSync'
import { rememberSignedIn } from './syncSession'
import { unconfiguredSyncBackend, type SyncBackend, type SyncUser } from './syncBackend'
import { topicJson, type RemoteRecord } from './syncPlanner'
import { seedLibrary } from '../../domain/library/catalogSeed'
import type { Topic } from '../../domain/library/topic'

/**
 * Applying a plan is genuinely asynchronous — a push is awaited before the
 * ledger advances — so these wait on the outcome rather than assuming a single
 * microtask settles it. The default one-second budget is too tight to be
 * reliable when the whole suite is running at once, and a timing-sensitive test
 * that only fails under load is worse than no test.
 *
 * The wiring, not the policy. `plan.test.ts` owns which copy wins; this covers
 * that the hook actually carries a plan out — pushes what is local, puts what is
 * remote into the store, and never lets a record the v5 boundary would refuse
 * through the door.
 */

beforeEach(() => {
  // These cover what happens once a device is signed in, so they start from a
  // device that has been. The deferral itself is covered separately below.
  rememberSignedIn()
})

afterEach(async () => {
  // Applying a plan finishes on a promise chain no assertion here waits for:
  // the ledger is written after the push or adoption the test asserted on. Let
  // that chain land before clearing, or a late `saveLedger` outlives the clear
  // and becomes the *next* test's starting ledger — which reads as "this device
  // already knew that topic and has since deleted it", and the next plan then
  // drops the record instead of adopting it.
  await act(async () => {})
  cleanup()
  localStorage.clear()
})

function realTopic(): Topic {
  return seedLibrary().topics[0]
}

function fakeStore(topics: Topic[]): SyncableStore & { upserted: Topic[]; removed: string[] } {
  const upserted: Topic[] = []
  const removed: string[] = []
  return {
    topics,
    upserted,
    removed,
    upsertTopic: (topic) => upserted.push(topic),
    removeTopic: (id) => removed.push(id),
  }
}

function fakeBackend(overrides: Partial<SyncBackend> = {}): SyncBackend & {
  pushed: { topicId: string; json: string; revision: number }[]
  deleted: string[]
  emitUser: (user: SyncUser | null) => void
  emitRecords: (records: RemoteRecord[]) => void
} {
  const pushed: { topicId: string; json: string; revision: number }[] = []
  const deleted: string[] = []
  let userListener: (user: SyncUser | null) => void = () => {}
  let recordListener: (records: RemoteRecord[]) => void = () => {}
  return {
    configured: true,
    pushed,
    deleted,
    emitUser: (user) => userListener(user),
    emitRecords: (records) => recordListener(records),
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
    pushTopic: async (_uid, topicId, json, revision) => {
      pushed.push({ topicId, json, revision })
    },
    deleteTopic: async (_uid, topicId) => {
      deleted.push(topicId)
    },
    observeMeta: () => () => {},
    pushMeta: async () => {},
    ...overrides,
  }
}

const OWNER: SyncUser = { uid: 'owner-uid', email: 'owner@example.test', displayName: 'Owner' }

function waitFor(assertion: () => void) {
  return rawWaitFor(assertion, { timeout: 5_000 })
}

describe('a build with no Firebase configuration', () => {
  it('reports sync unavailable rather than offering something that cannot work', () => {
    const { result } = renderHook(() => useSync(fakeStore([]), unconfiguredSyncBackend()))
    expect(result.current.state.kind).toBe('unconfigured')
  })
})

describe('carrying out a plan', () => {
  it('pushes what this device holds and the server does not', async () => {
    const topic = realTopic()
    const backend = fakeBackend()
    renderHook(() => useSync(fakeStore([topic]), backend))

    act(() => backend.emitUser(OWNER))
    act(() => backend.emitRecords([]))

    await waitFor(() => expect(backend.pushed).toHaveLength(1))
    expect(backend.pushed[0]).toMatchObject({ topicId: topic.id, revision: 1 })
    expect(JSON.parse(backend.pushed[0].json).id).toBe(topic.id)
  })

  it('puts a topic from another device into the local store', async () => {
    const topic = realTopic()
    const store = fakeStore([])
    const backend = fakeBackend()
    renderHook(() => useSync(store, backend))

    act(() => backend.emitUser(OWNER))
    act(() =>
      backend.emitRecords([
        { topicId: topic.id, json: topicJson(topic), revision: 4, updatedAtMs: 1_000 },
      ]),
    )

    await waitFor(() => expect(store.upserted).toHaveLength(1))
    expect(store.upserted[0].id).toBe(topic.id)
    expect(backend.pushed).toHaveLength(0)
  })

  it('refuses a remote record the v5 boundary would not accept, and keeps the local copy', async () => {
    // The evidence contract is defined by the parse boundary, so a device that
    // cannot parse a record must not adopt it — and must not delete its own.
    const store = fakeStore([])
    const backend = fakeBackend()
    const { result } = renderHook(() => useSync(store, backend))

    act(() => backend.emitUser(OWNER))
    act(() =>
      backend.emitRecords([
        { topicId: 'bogus', json: '{"id":"bogus","status":"not-a-status"}', revision: 1, updatedAtMs: 1 },
      ]),
    )

    // Waiting for the pass to finish is the point: asserting "nothing was
    // adopted" before it has run would pass without proving anything.
    await waitFor(() => expect(result.current.state.kind).toBe('synced'))
    expect(store.upserted).toEqual([])
    expect(store.removed).toEqual([])
  })

  it('reports an error without disturbing the local library', async () => {
    const topic = realTopic()
    const store = fakeStore([topic])
    const backend = fakeBackend({
      pushTopic: async () => {
        throw new Error('permission-denied')
      },
    })
    const { result } = renderHook(() => useSync(store, backend))

    act(() => backend.emitUser(OWNER))
    act(() => backend.emitRecords([]))

    await waitFor(() => expect(result.current.state.kind).toBe('error'))
    expect(store.removed).toEqual([])
    expect(store.upserted).toEqual([])
  })

  it('signs out without touching the record on this device', async () => {
    const signOut = vi.fn(async () => {})
    const store = fakeStore([realTopic()])
    const backend = fakeBackend({ signOut })
    const { result } = renderHook(() => useSync(store, backend))

    act(() => backend.emitUser(OWNER))
    await act(async () => {
      await result.current.signOut()
    })

    expect(signOut).toHaveBeenCalled()
    expect(store.removed).toEqual([])
  })
})

describe('what the ledger records', () => {
  it('settles after adopting, rather than pushing the record straight back', async () => {
    // The ledger has to hold what the library will serialize, not the text that
    // arrived. If the parser normalizes anything at all, recording the arriving
    // text would make the very next pass see a local change and push it back.
    const topic = realTopic()
    const store = fakeStore([])
    const backend = fakeBackend()
    const { result, rerender } = renderHook(({ s }) => useSync(s, backend), {
      initialProps: { s: store },
    })

    act(() => backend.emitUser(OWNER))
    act(() =>
      backend.emitRecords([
        // Deliberately not byte-identical to what the parser will produce: the
        // same topic, re-serialized with its keys in a different order.
        {
          topicId: topic.id,
          json: JSON.stringify(Object.fromEntries(Object.entries(topic).reverse())),
          revision: 2,
          updatedAtMs: 1_000,
        },
      ]),
    )

    await waitFor(() => expect(store.upserted).toHaveLength(1))

    // The library now holds the adopted topic; replan against the same remote.
    const settled = fakeStore(store.upserted.slice())
    rerender({ s: settled })
    await waitFor(() => expect(result.current.state.kind).toBe('synced'))
    expect(backend.pushed).toEqual([])
  })
})

describe('parsing a record that arrived from another device', () => {
  it('accepts a real topic', () => {
    const topic = realTopic()
    expect(parseSyncedTopic(topicJson(topic))?.id).toBe(topic.id)
  })

  it('refuses malformed JSON, a non-object, and a topic the boundary rejects', () => {
    expect(parseSyncedTopic('{ not json')).toBeNull()
    expect(parseSyncedTopic('"a string"')).toBeNull()
    expect(parseSyncedTopic('{"id":"x","status":"invented"}')).toBeNull()
  })
})


describe('a device that has never signed in', () => {
  it('does not load Firebase or contact Google on boot', () => {
    // The cost of the Auth SDK and its round trip is paid by everybody, on
    // every load, if this observer is armed unconditionally — and answers "no"
    // every time for a device that has never signed in.
    localStorage.clear()
    let observed = false
    const backend = fakeBackend({
      observeUser: () => {
        observed = true
        return () => {}
      },
    })
    const { result } = renderHook(() => useSync(fakeStore([]), backend))
    expect(observed).toBe(false)
    expect(result.current.state.kind).toBe('signedOut')
  })

  it('arms the observer as soon as sign-in is asked for', async () => {
    localStorage.clear()
    let observed = false
    const backend = fakeBackend({
      observeUser: () => {
        observed = true
        return () => {}
      },
    })
    const { result } = renderHook(() => useSync(fakeStore([]), backend))
    await act(async () => {
      await result.current.signIn()
    })
    expect(observed).toBe(true)
  })

  it('watches from boot once a device has signed in before', () => {
    rememberSignedIn()
    let observed = false
    const backend = fakeBackend({
      observeUser: () => {
        observed = true
        return () => {}
      },
    })
    renderHook(() => useSync(fakeStore([]), backend))
    expect(observed).toBe(true)
  })
})
