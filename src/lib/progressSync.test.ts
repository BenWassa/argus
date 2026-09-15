// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from 'vitest'
import {
  CloudRevisionConflictError,
  bootstrapProgress,
  preserveRecovery,
  readUserCache,
  reconcileLibraryCopies,
  recoveryEntryCount,
  synchronizeProgress,
  writeUserCache,
  type CloudLibrarySnapshot,
  type ProgressCloud,
} from './progressSync'
import type { CurrentLibrary, Topic } from './types'

function topic(id: string, overrides: Partial<Topic> = {}): Topic {
  return {
    id,
    title: id,
    scope: `Recall ${id}.`,
    track: 'learning',
    items: [{ id: `${id}-item`, kind: 'forward', prompt: 'Q', answer: 'A' }],
    status: 'unstarted',
    createdAt: '2026-09-01T00:00:00.000Z',
    drilledAt: null,
    learningAt: null,
    completedAt: null,
    lastTestedAt: null,
    spotCheckedAt: null,
    history: [],
    itemEvidence: {},
    lessonProgress: {},
    origin: 'user',
    ...overrides,
  }
}

function library(...topics: Topic[]): CurrentLibrary {
  return { version: 5, topics, catalogDelivered: [] }
}

class MemoryCloud implements ProgressCloud {
  records = new Map<string, CloudLibrarySnapshot>()
  failReads = false
  conflicts = 0

  async read(uid: string) {
    if (this.failReads) throw Object.assign(new Error('offline'), { code: 'unavailable' })
    return this.records.get(uid) ?? null
  }

  async write(uid: string, expectedRevision: number | null, nextLibrary: CurrentLibrary, mutationId: string) {
    if (this.conflicts > 0) {
      this.conflicts -= 1
      throw new CloudRevisionConflictError()
    }
    const current = this.records.get(uid) ?? null
    if ((current?.revision ?? null) !== expectedRevision) throw new CloudRevisionConflictError()
    const next = {
      revision: (current?.revision ?? 0) + 1,
      library: nextLibrary,
      lastMutationId: mutationId,
    }
    this.records.set(uid, next)
    return next
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe('conservative reconciliation', () => {
  it('composes independent whole-topic changes against a shared base', () => {
    const base = library(topic('a'), topic('b'))
    const local = library(topic('a', { status: 'learning', learningAt: '2026-09-02T00:00:00.000Z' }), topic('b'))
    const cloud = library(topic('a'), topic('b', { status: 'drilled', drilledAt: '2026-09-03T00:00:00.000Z' }))

    const result = reconcileLibraryCopies(local, cloud, base)
    expect(result.kind).toBe('merged')
    if (result.kind !== 'merged') return
    expect(result.library.topics.find((value) => value.id === 'a')?.status).toBe('learning')
    expect(result.library.topics.find((value) => value.id === 'b')?.status).toBe('drilled')
  })

  it('refuses to guess when the same topic diverged', () => {
    const base = library(topic('a'))
    const local = library(topic('a', { status: 'learning', learningAt: '2026-09-02T00:00:00.000Z' }))
    const cloud = library(topic('a', { title: 'Edited elsewhere' }))

    expect(reconcileLibraryCopies(local, cloud, base)).toEqual({ kind: 'conflict', topicIds: ['a'] })
  })

  it('preserves unique user-authored topics on both sides without a shared base', () => {
    const result = reconcileLibraryCopies(library(topic('local-only')), library(topic('cloud-only')), null)
    expect(result.kind).toBe('merged')
    if (result.kind !== 'merged') return
    expect(result.library.topics.map((value) => value.id)).toEqual(['local-only', 'cloud-only'])
  })

  it('does not let an unrelated fresh/default copy overwrite recoverable cloud progress', () => {
    const local = library(topic('same'))
    const cloud = library(topic('same', { status: 'completed', completedAt: '2026-09-05T00:00:00.000Z' }))
    expect(reconcileLibraryCopies(local, cloud, null)).toEqual({ kind: 'conflict', topicIds: ['same'] })
  })
})

describe('authenticated bootstrap', () => {
  it('seeds cloud from an existing valid local-only library without losing Morse durable state', async () => {
    const morse = topic('morse', {
      lessonProgress: { 'morse-item': 'settled' },
      lessonSitting: { retrievals: 6, correct: 5, revisitItemIds: ['morse-item'], listeningSuppressed: true },
      morseReview: {
        sittings: 4,
        items: {
          'morse-item': {
            introducedIn: 1,
            lastSeenIn: 4,
            laterCorrect: 2,
            printed: 7,
            heard: 3,
            heardCorrect: 2,
          },
        },
      },
    })
    localStorage.setItem('argus.library.v5', JSON.stringify(library(morse)))
    const cloud = new MemoryCloud()

    const result = await bootstrapProgress('account-a', cloud, new Date('2026-09-15T12:00:00Z'))
    expect(result.kind).toBe('ready')
    const stored = cloud.records.get('account-a')
    expect(stored?.library.topics.find((value) => value.id === 'morse')?.morseReview?.sittings).toBe(4)
    expect(stored?.library.topics.find((value) => value.id === 'morse')?.lessonSitting?.retrievals).toBe(6)
  })

  it('restores valid cloud when the local account cache is missing', async () => {
    const cloud = new MemoryCloud()
    cloud.records.set('account-a', {
      revision: 3,
      library: library(topic('restored', { status: 'completed', completedAt: '2026-09-10T00:00:00.000Z' })),
      lastMutationId: 'remote-3',
    })

    const result = await bootstrapProgress('account-a', cloud)
    expect(result.kind).toBe('ready')
    if (result.kind !== 'ready') return
    expect(result.restoredFrom).toBe('cloud')
    expect(result.library.topics.some((value) => value.id === 'restored')).toBe(true)
    expect(readUserCache('account-a').kind).toBe('valid')
  })

  it('preserves corrupt per-UID bytes before restoring cloud', async () => {
    localStorage.setItem('argus.library.sync.v1.account-a', '{ definitely not json')
    const cloud = new MemoryCloud()
    cloud.records.set('account-a', {
      revision: 1,
      library: library(topic('safe-cloud')),
      lastMutationId: 'remote-1',
    })

    const result = await bootstrapProgress('account-a', cloud)
    expect(result.kind).toBe('ready')
    expect(recoveryEntryCount('account-a')).toBe(1)
  })

  it('allows offline relaunch only from an already validated UID cache', async () => {
    const cached = library(topic('offline-work', { status: 'learning', learningAt: '2026-09-11T00:00:00.000Z' }))
    writeUserCache('account-a', cached, { revision: 2, base: cached })
    const cloud = new MemoryCloud()
    cloud.failReads = true

    const result = await bootstrapProgress('account-a', cloud)
    expect(result.kind).toBe('ready')
    if (result.kind !== 'ready') return
    expect(result.connectivity).toBe('offline')
    expect(result.library.topics.some((value) => value.id === 'offline-work')).toBe(true)
  })

  it('keeps account A and B local caches isolated across switching', () => {
    writeUserCache('account-a', library(topic('only-a')), { revision: 1, base: library(topic('only-a')) })
    expect(readUserCache('account-a').kind).toBe('valid')
    expect(readUserCache('account-b')).toEqual({ kind: 'missing' })
    writeUserCache('account-b', library(topic('only-b')), { revision: 1, base: library(topic('only-b')) })
    const a = readUserCache('account-a')
    expect(a.kind === 'valid' && a.cache.library.topics[0].id).toBe('only-a')
  })
})

describe('reconnect and interruption safety', () => {
  it('uploads offline local work when the remote base is unchanged', async () => {
    const base = library(topic('a'))
    const local = library(topic('a', { status: 'learning', learningAt: '2026-09-15T00:00:00.000Z' }))
    const cloud = new MemoryCloud()
    cloud.records.set('account-a', { revision: 2, library: base, lastMutationId: 'base' })

    const result = await synchronizeProgress('account-a', local, { revision: 2, base }, cloud)
    expect(result.kind).toBe('ready')
    expect(cloud.records.get('account-a')?.revision).toBe(3)
    expect(cloud.records.get('account-a')?.library.topics[0].status).toBe('learning')
  })

  it('retries a transaction revision race instead of falling back to timestamp wins', async () => {
    const base = library(topic('a'))
    const local = library(topic('a', { status: 'learning', learningAt: '2026-09-15T00:00:00.000Z' }))
    const cloud = new MemoryCloud()
    cloud.records.set('account-a', { revision: 1, library: base, lastMutationId: 'base' })
    cloud.conflicts = 1

    const result = await synchronizeProgress('account-a', local, { revision: 1, base }, cloud)
    expect(result.kind).toBe('ready')
    expect(cloud.records.get('account-a')?.library.topics[0].status).toBe('learning')
  })

  it('preserves an explicit pre-import recovery copy', () => {
    preserveRecovery('account-a', 'pre-import-library', JSON.stringify(library(topic('stronger'))))
    expect(recoveryEntryCount('account-a')).toBe(1)
  })
})
