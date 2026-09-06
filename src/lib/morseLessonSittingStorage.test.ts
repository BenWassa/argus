import { beforeEach, describe, expect, it } from 'vitest'
import {
  LEGACY_LESSON_SITTING_KEY,
  clearAllLessonSittings,
  readLessonSittingSidecar,
} from './morseLessonSittingStorage'
import * as sidecarModule from './morseLessonSittingStorage'

function fakeStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() { return values.size },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => [...values.keys()][index] ?? null,
    removeItem: (key: string) => void values.delete(key),
    setItem: (key: string, value: string) => void values.set(key, value),
  }
}

function writeSidecar(store: Record<string, unknown>): void {
  localStorage.setItem(LEGACY_LESSON_SITTING_KEY, JSON.stringify(store))
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: fakeStorage(), configurable: true })
})

describe('retired Morse Learn sitting sidecar', () => {
  it('reads a sitting an older build left behind, so #66 can adopt it', () => {
    writeSidecar({ morse: { retrievals: 3, correct: 2, revisitItemIds: ['morse-T'] } })

    expect(readLessonSittingSidecar()).toEqual({
      morse: { retrievals: 3, correct: 2, revisitItemIds: ['morse-T'] },
    })
  })

  it('offers no way to write, so a dual-write cannot be reintroduced', () => {
    // The whole point of #66 is one durable authority. A module that can still
    // save a sitting is one refactor away from being a second one again.
    expect(Object.keys(sidecarModule).some((name) => /^(save|write|set)/.test(name))).toBe(false)
  })

  it('drops corrupt or impossible counters rather than reviving them', () => {
    writeSidecar({
      tooMany: { retrievals: 11, correct: 11, revisitItemIds: [] },
      impossible: { retrievals: 3, correct: 4, revisitItemIds: [] },
      notAnObject: 'nope',
      good: { retrievals: 2, correct: 1, revisitItemIds: ['x'] },
    })

    expect(readLessonSittingSidecar()).toEqual({
      good: { retrievals: 2, correct: 1, revisitItemIds: ['x'] },
    })
  })

  it('ignores a sitting that recorded nothing, because absent is the fresh sitting', () => {
    writeSidecar({ untouched: { retrievals: 0, correct: 0, revisitItemIds: [] } })

    expect(readLessonSittingSidecar()).toEqual({})
  })

  it('deduplicates revisit ids and survives unreadable storage', () => {
    writeSidecar({ morse: { retrievals: 2, correct: 0, revisitItemIds: ['morse-E', 'morse-E'] } })
    expect(readLessonSittingSidecar().morse.revisitItemIds).toEqual(['morse-E'])

    localStorage.setItem(LEGACY_LESSON_SITTING_KEY, 'not json')
    expect(readLessonSittingSidecar()).toEqual({})
  })

  it('clears the key outright once the canonical store has taken over', () => {
    writeSidecar({ morse: { retrievals: 4, correct: 4, revisitItemIds: [] } })
    clearAllLessonSittings()

    expect(localStorage.getItem(LEGACY_LESSON_SITTING_KEY)).toBeNull()
    expect(readLessonSittingSidecar()).toEqual({})
  })
})
