import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { catalogDefinition, collisions } from './catalog'
import { clearLibrary, emptyLibrary, loadLibraryWithReport, saveLibrary } from './storage'
import { LEGACY_LESSON_SITTING_KEY } from './morseLessonSittingStorage'
import { SHIPPED_CATALOG_TOPIC_IDS } from './catalog'
import type { CurrentLibrary, Topic } from './types'

const KEY = 'argus.library.v5'
const NOW = new Date('2026-09-05T10:00:00.000Z')

function fakeStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
    clear: () => values.clear(),
    key: (index: number) => [...values.keys()][index] ?? null,
    get length() {
      return values.size
    },
  }
}

function shipped(id: string): Topic {
  const topic = catalogDefinition(id)
  if (!topic) throw new Error(`Not shipped: ${id}`)
  return { ...topic, origin: 'catalog' }
}

function stored(library: CurrentLibrary) {
  localStorage.setItem(KEY, JSON.stringify(library))
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: fakeStorage(), configurable: true })
})

afterEach(() => {
  localStorage.clear()
})

describe('loading a library that already exists on the device', () => {
  it('delivers newly shipped catalog topics and persists the result', () => {
    const worked: Topic = {
      ...shipped('nato-phonetic'),
      status: 'drilled',
      drilledAt: '2025-06-01T00:00:00.000Z',
      lastTestedAt: '2025-06-01T00:00:00.000Z',
      history: [{ at: '2025-06-01T00:00:00.000Z', correct: 26, total: 26, resolvedTo: 'drilled' }],
    }
    stored({ version: 5, topics: [worked], catalogDelivered: ['nato-phonetic'] })

    const { library, report } = loadLibraryWithReport(NOW)

    expect(report.added.length).toBeGreaterThan(0)
    expect(library.topics.find((topic) => topic.id === 'nato-phonetic')).toEqual(worked)
    expect(library.topics.filter((topic) => topic.id !== 'nato-phonetic').every((topic) => topic.status === 'unstarted')).toBe(true)

    // Persisted, so a second load has nothing left to deliver.
    const second = loadLibraryWithReport(NOW)
    expect(second.report.added).toEqual([])
    expect(second.library.topics.map((topic) => topic.id).sort()).toEqual(
      library.topics.map((topic) => topic.id).sort(),
    )
  })

  it('holds a user-authored collision back instead of replacing it', () => {
    const mine: Topic = {
      id: 'ooda-loop',
      title: 'My own OODA notes',
      scope: 'The two stages I keep forgetting.',
      track: 'learning',
      items: [
        { id: 'mine-1', kind: 'forward', prompt: 'Second stage', answer: 'Orient' },
        { id: 'mine-2', kind: 'forward', prompt: 'Third stage', answer: 'Decide' },
      ],
      status: 'learning',
      createdAt: '2025-04-01T00:00:00.000Z',
      drilledAt: null,
      learningAt: '2025-04-02T00:00:00.000Z',
      completedAt: null,
      lastTestedAt: null,
      spotCheckedAt: null,
      history: [],
      itemEvidence: {},
      lessonProgress: {},
      origin: 'user',
    }
    stored({ version: 5, topics: [mine], catalogDelivered: [] })

    const { library, report } = loadLibraryWithReport(NOW)

    expect(collisions(report)).toEqual(['ooda-loop'])
    expect(library.topics.filter((topic) => topic.id === 'ooda-loop')).toEqual([mine])
  })

  it('leaves a reset library empty rather than re-seeding it on the next load', () => {
    saveLibrary(emptyLibrary())

    const { library, report } = loadLibraryWithReport(NOW)
    expect(library.topics).toEqual([])
    expect(report.added).toEqual([])
  })

  it('seeds a device that has never held a library', () => {
    clearLibrary()
    const { library } = loadLibraryWithReport(NOW)
    expect(library.topics.length).toBeGreaterThan(0)
    expect(library.topics.every((topic) => topic.origin === 'catalog')).toBe(true)
    expect(library.catalogDelivered?.length).toBe(library.topics.length)
  })

  it('marks the absorbed Morse baseline as catalog-owned rather than a collision', () => {
    const forward = {
      ...shipped('international-morse-letters-printed'),
      items: shipped('international-morse-letters-printed').items.map((item) => ({
        ...item,
        kind: 'forward' as const,
      })),
      status: 'completed' as const,
      completedAt: '2025-05-01T00:00:00.000Z',
    }
    delete forward.origin
    stored({ version: 5, topics: [forward] })

    const { library, report } = loadLibraryWithReport(NOW)
    const morse = library.topics.find((topic) => topic.id === 'international-morse-letters-printed')

    expect(morse?.origin).toBe('catalog')
    expect(morse?.items.every((item) => item.kind === 'bidirectional')).toBe(true)
    // The #23 completion cannot stand for the stronger bidirectional claim, but
    // that demotion is the explicit Morse migration, not catalog delivery.
    expect(morse?.status).toBe('drilled')
    expect(collisions(report)).toEqual([])
  })
})

describe('the retired sitting sidecar is migrated, then gone (#66)', () => {
  const MORSE = 'international-morse-letters-printed'

  function sidecar(store: Record<string, unknown>) {
    localStorage.setItem(LEGACY_LESSON_SITTING_KEY, JSON.stringify(store))
  }

  function morseItemId(index: number): string {
    return `${MORSE}-item-${String(index).padStart(2, '0')}`
  }

  it('adopts an in-flight sitting onto the topic and removes the key', () => {
    stored({ version: 5, topics: [shipped(MORSE)], catalogDelivered: [...SHIPPED_CATALOG_TOPIC_IDS] })
    sidecar({ [MORSE]: { retrievals: 6, correct: 4, revisitItemIds: [morseItemId(2)] } })

    const { library } = loadLibraryWithReport(NOW)
    const morse = library.topics.find((topic) => topic.id === MORSE)

    expect(morse?.lessonSitting).toEqual({
      retrievals: 6,
      correct: 4,
      revisitItemIds: [morseItemId(2)],
    })
    // Migrated, saved and retired in one pass: no competing source of truth.
    expect(localStorage.getItem(LEGACY_LESSON_SITTING_KEY)).toBeNull()
    const persisted = JSON.parse(localStorage.getItem(KEY) as string) as CurrentLibrary
    expect(persisted.topics.find((topic) => topic.id === MORSE)?.lessonSitting?.retrievals).toBe(6)
  })

  it('lets the canonical field win a disagreement with the sidecar', () => {
    stored({
      version: 5,
      topics: [{ ...shipped(MORSE), lessonSitting: { retrievals: 2, correct: 2, revisitItemIds: [] } }],
      catalogDelivered: [...SHIPPED_CATALOG_TOPIC_IDS],
    })
    sidecar({ [MORSE]: { retrievals: 9, correct: 1, revisitItemIds: [] } })

    const { library } = loadLibraryWithReport(NOW)
    expect(library.topics.find((topic) => topic.id === MORSE)?.lessonSitting?.retrievals).toBe(2)
  })

  it('drops revisit ids for items the topic no longer has', () => {
    stored({ version: 5, topics: [shipped(MORSE)], catalogDelivered: [...SHIPPED_CATALOG_TOPIC_IDS] })
    sidecar({ [MORSE]: { retrievals: 4, correct: 2, revisitItemIds: [morseItemId(1), 'deleted-item'] } })

    const { library } = loadLibraryWithReport(NOW)
    expect(library.topics.find((topic) => topic.id === MORSE)?.lessonSitting?.revisitItemIds)
      .toEqual([morseItemId(1)])
  })

  it('never leaks a sitting into a library that was never the sidecar\'s', () => {
    sidecar({ [MORSE]: { retrievals: 7, correct: 7, revisitItemIds: [] } })
    // No stored library at all: a fresh install, or one just reset.
    const { library } = loadLibraryWithReport(NOW)

    expect(library.topics.every((topic) => topic.lessonSitting === undefined)).toBe(true)
    expect(localStorage.getItem(LEGACY_LESSON_SITTING_KEY)).toBeNull()
  })

  it('ignores a sidecar entry naming a topic that is not in the library', () => {
    stored({ version: 5, topics: [shipped('nato-phonetic')], catalogDelivered: [...SHIPPED_CATALOG_TOPIC_IDS] })
    sidecar({ 'some-other-library-topic': { retrievals: 5, correct: 5, revisitItemIds: [] } })

    const { library } = loadLibraryWithReport(NOW)
    expect(library.topics.every((topic) => topic.lessonSitting === undefined)).toBe(true)
  })
})

describe('a fresh install claims nothing the learner did not earn (#71)', () => {
  it('delivers every shipped topic unstarted, with no history and no completions', () => {
    const { library } = loadLibraryWithReport(NOW)

    expect(library.topics.map((topic) => topic.id).sort()).toEqual([...SHIPPED_CATALOG_TOPIC_IDS].sort())
    for (const topic of library.topics) {
      expect(topic.status).toBe('unstarted')
      expect(topic.history).toEqual([])
      expect(topic.completedAt).toBeNull()
      expect(topic.drilledAt).toBeNull()
      expect(topic.learningAt).toBeNull()
      expect(topic.lastTestedAt).toBeNull()
      expect(topic.spotCheckedAt).toBeNull()
      expect(topic.itemEvidence).toEqual({})
      expect(topic.lessonProgress).toEqual({})
      expect(topic).not.toHaveProperty('lessonSitting')
      expect(topic.origin).toBe('catalog')
    }
    // Nothing to show on the Progress completion record, because nothing was done.
    expect(library.topics.filter((topic) => topic.completedAt !== null)).toEqual([])
  })

  it('still ships the content: a fresh install is a real library, not an empty one', () => {
    const { library } = loadLibraryWithReport(NOW)
    const nato = library.topics.find((topic) => topic.id === 'nato-phonetic')

    expect(nato?.items).toHaveLength(26)
    expect(nato?.learn?.kind).toBe('concise')
    expect(library.topics.find((topic) => topic.id === 'international-morse-letters-printed')?.items)
      .toHaveLength(26)
  })

  it('preserves an in-flight sitting and readiness anchor through catalog delivery', () => {
    const MORSE = 'international-morse-letters-printed'
    const inFlight: Topic = {
      ...shipped(MORSE),
      status: 'learning',
      learningAt: '2026-08-01T00:00:00.000Z',
      lessonProgress: { [`${MORSE}-item-01`]: 'settled' },
      lessonSitting: { retrievals: 4, correct: 3, revisitItemIds: [`${MORSE}-item-02`] },
      acquisitionReadyAt: '2026-08-20T00:00:00.000Z',
    }
    // Only Morse has been delivered, so this load also delivers the rest.
    stored({ version: 5, topics: [inFlight], catalogDelivered: [MORSE] })

    const { library, report } = loadLibraryWithReport(NOW)
    expect(report.added.length).toBeGreaterThan(0)

    const kept = library.topics.find((topic) => topic.id === MORSE)
    expect(kept?.lessonSitting).toEqual({
      retrievals: 4,
      correct: 3,
      revisitItemIds: [`${MORSE}-item-02`],
    })
    expect(kept?.acquisitionReadyAt).toBe('2026-08-20T00:00:00.000Z')
    expect(kept?.lessonProgress).toEqual({ [`${MORSE}-item-01`]: 'settled' })
    // Newly delivered topics arrive with none of it.
    for (const added of report.added) {
      const topic = library.topics.find((candidate) => candidate.id === added)
      expect(topic).not.toHaveProperty('lessonSitting')
      expect(topic?.acquisitionReadyAt).toBeUndefined()
      expect(topic?.status).toBe('unstarted')
    }
  })

  it('does not reset an existing learner who really did earn their record', () => {
    const earned: Topic = {
      ...shipped('cardinal-bearings'),
      status: 'completed',
      learningAt: '2025-01-01T00:00:00.000Z',
      drilledAt: '2025-02-01T00:00:00.000Z',
      completedAt: '2025-03-05T00:00:00.000Z',
      lastTestedAt: '2025-03-05T00:00:00.000Z',
      history: [{ at: '2025-03-05T00:00:00.000Z', correct: 8, total: 8, resolvedTo: 'completed' }],
    }
    stored({ version: 5, topics: [earned], catalogDelivered: ['cardinal-bearings'] })

    const { library } = loadLibraryWithReport(NOW)
    const kept = library.topics.find((topic) => topic.id === 'cardinal-bearings')

    expect(kept?.status).toBe('completed')
    expect(kept?.completedAt).toBe('2025-03-05T00:00:00.000Z')
    expect(kept?.history).toHaveLength(1)
  })
})
