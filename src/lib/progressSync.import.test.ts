// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { parseLibrary } from './storage'
import {
  CloudRevisionConflictError,
  synchronizeProgress,
  type CloudLibrarySnapshot,
  type ProgressCloud,
} from './progressSync'
import type { CurrentLibrary, Topic } from './types'

function topic(overrides: Partial<Topic> = {}): Topic {
  return {
    id: 'imported-topic',
    title: 'Imported topic',
    scope: 'One imported item.',
    track: 'learning',
    items: [{ id: 'imported-item', kind: 'forward', prompt: 'Q', answer: 'A' }],
    status: 'learning',
    createdAt: '2026-09-01T00:00:00.000Z',
    drilledAt: null,
    learningAt: '2026-09-02T00:00:00.000Z',
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

function library(value: Topic): CurrentLibrary {
  return { version: 5, topics: [value], catalogDelivered: [] }
}

class MemoryCloud implements ProgressCloud {
  constructor(public record: CloudLibrarySnapshot | null) {}

  async read() {
    return this.record
  }

  async write(_uid: string, expectedRevision: number | null, next: CurrentLibrary, mutationId: string) {
    if ((this.record?.revision ?? null) !== expectedRevision) throw new CloudRevisionConflictError()
    this.record = {
      revision: (this.record?.revision ?? 0) + 1,
      library: next,
      lastMutationId: mutationId,
    }
    return this.record
  }
}

describe('JSON import followed by sync', () => {
  it('validates the exported/imported v5 payload and deliberately advances an unchanged cloud base', async () => {
    const base = library(topic())
    const importedRaw = JSON.stringify(
      library(
        topic({
          status: 'completed',
          drilledAt: '2026-09-10T00:00:00.000Z',
          completedAt: '2026-09-15T00:00:00.000Z',
          lastTestedAt: '2026-09-15T00:00:00.000Z',
          history: [{ at: '2026-09-15T00:00:00.000Z', correct: 1, total: 1, resolvedTo: 'completed' }],
        }),
      ),
    )
    const parsed = parseLibrary(JSON.parse(importedRaw))
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    const cloud = new MemoryCloud({ revision: 4, library: base, lastMutationId: 'before-import' })
    const result = await synchronizeProgress(
      'account-a',
      parsed.library,
      { revision: 4, base },
      cloud,
      new Date('2026-09-15T12:00:00Z'),
    )

    expect(result.kind).toBe('ready')
    expect(cloud.record?.revision).toBe(5)
    expect(cloud.record?.library.topics[0].status).toBe('completed')
    expect(cloud.record?.library.topics[0].history).toHaveLength(1)
  })

  it('protects both copies if cloud progress diverged after the import base', async () => {
    const base = library(topic())
    const imported = library(topic({ title: 'Edited in imported file' }))
    const cloudChanged = library(
      topic({
        status: 'drilled',
        drilledAt: '2026-09-12T00:00:00.000Z',
        lastTestedAt: '2026-09-12T00:00:00.000Z',
        history: [{ at: '2026-09-12T00:00:00.000Z', correct: 1, total: 1, resolvedTo: 'drilled' }],
      }),
    )
    const cloud = new MemoryCloud({ revision: 5, library: cloudChanged, lastMutationId: 'other-device' })

    const result = await synchronizeProgress(
      'account-a',
      imported,
      { revision: 4, base },
      cloud,
      new Date('2026-09-15T12:00:00Z'),
    )

    expect(result.kind).toBe('conflict')
    if (result.kind !== 'conflict') return
    expect(result.conflict.topicIds).toEqual(['imported-topic'])
    expect(cloud.record?.revision).toBe(5)
    expect(cloud.record?.library.topics[0].status).toBe('drilled')
  })
})
