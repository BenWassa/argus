import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { catalogDefinition, collisions } from './catalog'
import { clearLibrary, emptyLibrary, loadLibraryWithReport, saveLibrary } from './storage'
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
