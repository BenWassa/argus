import { describe, expect, it } from 'vitest'
import {
  SHIPPED_CATALOG_TOPIC_IDS,
  catalogDefinition,
  catalogDefinitions,
  collisions,
  freshCatalogTopic,
  inferredOrigin,
  reconcileCatalog,
} from './catalog'
import { parseLibrary } from './storage'
import { seedLibrary } from './seed'
import type { CurrentLibrary, Topic } from './types'

const NOW = new Date('2026-09-05T10:00:00.000Z')

function shipped(id: string): Topic {
  const definition = catalogDefinition(id)
  if (!definition) throw new Error(`Not a shipped catalog id: ${id}`)
  return definition
}

/** A shipped topic the learner has already worked through. */
function worked(id: string): Topic {
  const topic = shipped(id)
  return {
    ...topic,
    origin: 'catalog',
    status: 'completed',
    createdAt: '2025-01-01T00:00:00.000Z',
    learningAt: '2025-01-02T00:00:00.000Z',
    drilledAt: '2025-01-03T00:00:00.000Z',
    completedAt: '2025-02-10T00:00:00.000Z',
    lastTestedAt: '2025-02-10T00:00:00.000Z',
    spotCheckedAt: '2025-05-11T00:00:00.000Z',
    history: [
      { at: '2025-01-03T00:00:00.000Z', correct: topic.items.length, total: topic.items.length, resolvedTo: 'drilled' },
      { at: '2025-02-10T00:00:00.000Z', correct: topic.items.length, total: topic.items.length, resolvedTo: 'completed' },
    ],
    itemEvidence: {
      [topic.items[0].id as string]: {
        cue: 'free',
        directions: {
          'prompt-to-answer': { attempts: 9, correct: 8, unassistedCorrect: 3, consecutiveCorrect: 4, lastAt: '2025-02-10T00:00:00.000Z', lastLatencyMs: 1200 },
        },
      },
    },
  }
}

function libraryOf(topics: Topic[], catalogDelivered?: string[]): CurrentLibrary {
  return { version: 5, topics, ...(catalogDelivered ? { catalogDelivered } : {}) }
}

describe('shipped catalog manifest', () => {
  it('names exactly the topics the seed defines', () => {
    expect([...SHIPPED_CATALOG_TOPIC_IDS].sort()).toEqual(
      seedLibrary().topics.map((topic) => topic.id).sort(),
    )
    expect(catalogDefinitions().map((topic) => topic.id)).toEqual([...SHIPPED_CATALOG_TOPIC_IDS])
  })

  it('delivers a catalog topic with content but no learner state', () => {
    const definition = shipped('cardinal-bearings')
    const delivered = freshCatalogTopic(definition, NOW)

    expect(delivered.items).toEqual(definition.items)
    expect(delivered.learn).toEqual(definition.learn)
    expect(delivered.scope).toBe(definition.scope)
    expect(delivered.origin).toBe('catalog')
    expect(delivered.status).toBe('unstarted')
    expect(delivered.createdAt).toBe(NOW.toISOString())
    expect(delivered.history).toEqual([])
    expect(delivered.itemEvidence).toEqual({})
    expect([
      delivered.drilledAt,
      delivered.learningAt,
      delivered.completedAt,
      delivered.lastTestedAt,
      delivered.spotCheckedAt,
    ]).toEqual([null, null, null, null, null])
    // The seed carries demonstration progress for a first-run library. Delivery
    // into an existing library must never carry it across.
    expect(definition.status).not.toBe('unstarted')
  })
})

describe('catalog reconciliation', () => {
  it('adds a missing shipped topic as unstarted without touching what is there', () => {
    const kept = worked('nato-phonetic')
    const before = libraryOf([kept], ['nato-phonetic'])

    const { library, report } = reconcileCatalog(before, NOW)

    expect(report.added).toContain('cardinal-bearings')
    expect(report.withheld).toEqual([])
    // Every durable learner-owned field survives byte for byte.
    expect(library.topics.find((topic) => topic.id === 'nato-phonetic')).toEqual(kept)

    const arrived = library.topics.find((topic) => topic.id === 'cardinal-bearings')
    expect(arrived?.status).toBe('unstarted')
    expect(arrived?.history).toEqual([])
    expect(arrived?.origin).toBe('catalog')
    expect(library.catalogDelivered).toEqual([...SHIPPED_CATALOG_TOPIC_IDS].sort())
  })

  it('never overwrites a user-authored topic that collides with a shipped id', () => {
    const mine: Topic = {
      id: 'cardinal-bearings',
      title: 'My own bearings deck',
      scope: 'The two bearings I actually use.',
      track: 'tradecraft',
      items: [
        { id: 'mine-1', kind: 'forward', prompt: 'North', answer: '0' },
        { id: 'mine-2', kind: 'forward', prompt: 'South', answer: '180' },
      ],
      status: 'drilled',
      createdAt: '2025-03-01T00:00:00.000Z',
      drilledAt: '2025-03-05T00:00:00.000Z',
      learningAt: '2025-03-02T00:00:00.000Z',
      completedAt: null,
      lastTestedAt: '2025-03-05T00:00:00.000Z',
      spotCheckedAt: null,
      history: [{ at: '2025-03-05T00:00:00.000Z', correct: 2, total: 2, resolvedTo: 'drilled' }],
      itemEvidence: {},
      origin: 'user',
    }

    const { library, report } = reconcileCatalog(libraryOf([mine]), NOW)

    expect(library.topics.filter((topic) => topic.id === 'cardinal-bearings')).toEqual([mine])
    expect(collisions(report)).toEqual(['cardinal-bearings'])
    expect(report.added).not.toContain('cardinal-bearings')
    // A withheld collision is not recorded as delivered, so it keeps being
    // reported rather than quietly disappearing.
    expect(library.catalogDelivered).not.toContain('cardinal-bearings')
  })

  it('treats an unmarked topic that no longer matches the catalog as the learner’s', () => {
    const edited: Topic = {
      ...shipped('cardinal-bearings'),
      items: shipped('cardinal-bearings').items.slice(0, 3),
    }
    delete edited.origin

    expect(inferredOrigin(edited)).toBe('user')
    expect(inferredOrigin({ ...shipped('nato-phonetic'), origin: undefined })).toBe('catalog')

    const { library, report } = reconcileCatalog(libraryOf([edited]), NOW)
    expect(library.topics.find((topic) => topic.id === 'cardinal-bearings')).toEqual(edited)
    expect(collisions(report)).toEqual(['cardinal-bearings'])
  })

  it('does not resurrect a delivered topic the learner deleted', () => {
    const delivered = [...SHIPPED_CATALOG_TOPIC_IDS].sort()
    const { library, report } = reconcileCatalog(libraryOf([worked('nato-phonetic')], delivered), NOW)

    expect(report.added).toEqual([])
    expect(library.topics.map((topic) => topic.id)).toEqual(['nato-phonetic'])
    expect(report.withheld.map((entry) => entry.reason)).toContain('previously-delivered')
  })

  it('infers delivery for a record written before delivery was tracked', () => {
    // No catalogDelivered list and no origin marks: everything present is
    // already the learner's copy of the catalog, so nothing is re-delivered.
    const legacy = libraryOf(
      catalogDefinitions().map((topic) => {
        const copy = { ...topic }
        delete copy.origin
        return copy
      }),
    )

    const { library, report } = reconcileCatalog(legacy, NOW)
    expect(report.added).toEqual([])
    expect(report.present).toEqual([...SHIPPED_CATALOG_TOPIC_IDS])
    expect(library.topics).toHaveLength(SHIPPED_CATALOG_TOPIC_IDS.length)
  })

  it('is deterministic and idempotent', () => {
    const before = libraryOf([worked('nato-phonetic')], ['nato-phonetic'])

    const once = reconcileCatalog(before, NOW)
    const twice = reconcileCatalog(once.library, NOW)
    const parallel = reconcileCatalog(before, NOW)

    expect(once.library).toEqual(parallel.library)
    expect(once.report).toEqual(parallel.report)
    expect(twice.library).toEqual(once.library)
    expect(twice.report.added).toEqual([])
    // A second pass with nothing to do returns the same object, so the store
    // does not churn a re-render or a write on every load.
    expect(twice.library).toBe(once.library)
  })

  it('leaves an empty library empty when delivery is already recorded', () => {
    const { library, report } = reconcileCatalog(
      libraryOf([], [...SHIPPED_CATALOG_TOPIC_IDS].sort()),
      NOW,
    )
    expect(library.topics).toEqual([])
    expect(report.added).toEqual([])
  })

  it('delivers into an empty library that has never been offered anything', () => {
    const { library, report } = reconcileCatalog(libraryOf([], []), NOW)
    expect(report.added).toEqual([...SHIPPED_CATALOG_TOPIC_IDS])
    expect(library.topics.every((topic) => topic.status === 'unstarted')).toBe(true)
  })

  it('is delivery only: a changed shipped definition never rewrites a local topic', () => {
    // The local copy claims a narrower boundary than the catalog now ships.
    const stale: Topic = {
      ...worked('primary-survey'),
      scope: 'An older, narrower completion claim.',
      items: shipped('primary-survey').items.slice(0, 2),
      origin: 'catalog',
    }

    const { library, report } = reconcileCatalog(libraryOf([stale], ['primary-survey']), NOW)

    expect(library.topics.find((topic) => topic.id === 'primary-survey')).toEqual(stale)
    expect(report.added).not.toContain('primary-survey')
  })

  it('keeps export and import lossless across the added provenance fields', () => {
    const { library } = reconcileCatalog(libraryOf([worked('nato-phonetic')], ['nato-phonetic']), NOW)

    const roundTripped = parseLibrary(JSON.parse(JSON.stringify(library)))
    expect(roundTripped.ok).toBe(true)
    if (!roundTripped.ok) return
    expect(roundTripped.library).toEqual(library)

    const again = parseLibrary(JSON.parse(JSON.stringify(roundTripped.library)))
    expect(again.ok && again.library).toEqual(library)
  })
})
