import { beforeEach, describe, expect, it } from 'vitest'
import { newLessonSitting, recordLessonRetrieval } from './morseLessonSitting'
import {
  clearAllLessonSittings,
  clearLessonSitting,
  loadLessonSitting,
  saveLessonSitting,
} from './morseLessonSittingStorage'

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

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', { value: fakeStorage(), configurable: true })
})

describe('durable Morse Learn sitting', () => {
  it('resumes retrieval, correct and revisit progress after a reload boundary', () => {
    let sitting = newLessonSitting()
    sitting = recordLessonRetrieval(sitting, 'morse-E', true)
    sitting = recordLessonRetrieval(sitting, 'morse-T', false)
    sitting = recordLessonRetrieval(sitting, 'morse-E', true)
    saveLessonSitting('morse', sitting)

    expect(loadLessonSitting('morse')).toEqual({
      retrievals: 3,
      correct: 2,
      revisitItemIds: ['morse-T'],
    })
  })

  it('keeps topics independent and clears only the requested sitting', () => {
    saveLessonSitting('a', { retrievals: 4, correct: 3, revisitItemIds: ['x'] })
    saveLessonSitting('b', { retrievals: 2, correct: 2, revisitItemIds: [] })
    clearLessonSitting('a')
    expect(loadLessonSitting('a')).toEqual(newLessonSitting())
    expect(loadLessonSitting('b').retrievals).toBe(2)
  })

  it('rejects corrupt or impossible counters instead of reviving them', () => {
    localStorage.setItem('argus.morse-learn-sittings.v1', JSON.stringify({
      tooMany: { retrievals: 11, correct: 11, revisitItemIds: [] },
      impossible: { retrievals: 3, correct: 4, revisitItemIds: [] },
    }))
    expect(loadLessonSitting('tooMany')).toEqual(newLessonSitting())
    expect(loadLessonSitting('impossible')).toEqual(newLessonSitting())
  })

  it('deduplicates revisit ids and supports full reset', () => {
    saveLessonSitting('morse', { retrievals: 2, correct: 0, revisitItemIds: ['morse-E', 'morse-E'] })
    expect(loadLessonSitting('morse').revisitItemIds).toEqual(['morse-E'])
    clearAllLessonSittings()
    expect(loadLessonSitting('morse')).toEqual(newLessonSitting())
  })
})
