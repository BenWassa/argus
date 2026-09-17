// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { useSync, type SyncableStore } from './useSync'
import { rememberSignedIn } from './session'
import type { SyncBackend, SyncUser } from './backend'
import type { RemoteRecord } from './plan'
import type { CurrentLibrary, Topic } from '../types'

const OWNER: SyncUser = { uid: 'owner-uid', email: 'owner@example.test', displayName: 'Owner' }

function store(): SyncableStore {
  const current: { library: CurrentLibrary } = {
    library: { version: 5, topics: [], catalogDelivered: [] },
  }
  return {
    get topics() {
      return current.library.topics
    },
    get library() {
      return current.library
    },
    upsertTopic(topic: Topic) {
      current.library = { ...current.library, topics: [...current.library.topics, topic] }
    },
    removeTopic(id: string) {
      current.library = { ...current.library, topics: current.library.topics.filter((topic) => topic.id !== id) }
    },
    replaceLibrary(library: CurrentLibrary) {
      current.library = library
    },
  }
}

function backend(): SyncBackend & {
  emitUser: (user: SyncUser | null) => void
  emitRecords: (records: RemoteRecord[]) => void
  emitMeta: (json: string | null) => void
} {
  let userListener: (user: SyncUser | null) => void = () => {}
  let recordListener: (records: RemoteRecord[]) => void = () => {}
  let metaListener: (json: string | null) => void = () => {}
  return {
    configured: true,
    emitUser: (user) => userListener(user),
    emitRecords: (records) => recordListener(records),
    emitMeta: (json) => metaListener(json),
    observeUser(listener) {
      userListener = listener
      return () => {}
    },
    signIn: async () => {},
    signOut: async () => {},
    observeLibrary(_uid, onRecords) {
      recordListener = onRecords
      return () => {}
    },
    pushTopic: async () => {},
    deleteTopic: async () => {},
    observeMeta(_uid, onMeta) {
      metaListener = onMeta
      return () => {}
    },
    pushMeta: async () => {},
  }
}

beforeEach(() => {
  localStorage.clear()
  rememberSignedIn()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('malformed cloud bootstrap', () => {
  it('fails closed instead of hanging or exposing fresh state', async () => {
    const fake = backend()
    const local = store()
    const { result } = renderHook(() => useSync(local, fake))

    act(() => fake.emitUser(OWNER))
    act(() => {
      fake.emitRecords([{ topicId: 'broken', json: '{ definitely-not-json', revision: 1, updatedAtMs: 1 }])
      fake.emitMeta(null)
    })

    await waitFor(() => expect(result.current.state.kind).toBe('error'))
    expect(result.current.state).toMatchObject({
      kind: 'error',
      user: null,
      ready: false,
      message: expect.stringContaining('broken'),
    })
    expect(local.topics).toHaveLength(0)
  })
})
