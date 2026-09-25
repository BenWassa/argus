import { describe, expect, it } from 'vitest'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'
import { seedLibrary } from '../library/catalogSeed'
import type { Topic } from '../library/topic'
import { journeysFor } from './journey'
import { lastActivityAt, libraryGroups } from './libraryGroups'

const MORSE_ID = 'international-morse-letters-printed'

function seeded(id: string, patch: Partial<Topic> = {}): Topic {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  const topic = parsed.library.topics.find((candidate) => candidate.id === id)
  if (!topic) throw new Error(`Missing seeded topic ${id}`)
  return {
    ...topic,
    status: 'unstarted',
    learningAt: null,
    drilledAt: null,
    completedAt: null,
    lastTestedAt: null,
    spotCheckedAt: null,
    history: [],
    lessonProgress: {},
    itemEvidence: {},
    ...patch,
  }
}

const titles = (entries: { topic: Topic }[]) => entries.map((entry) => entry.topic.title)

describe('Library groups', () => {
  it('puts nothing in the learning group for an untouched library, and sorts the rest by title', () => {
    const topics = [seeded('nato-phonetic'), seeded('cardinal-bearings'), seeded('ooda-loop')]
    const { learning, rest } = libraryGroups(journeysFor(topics))
    expect(learning).toHaveLength(0)
    expect(titles(rest)).toEqual([...titles(rest)].sort((a, b) => a.localeCompare(b)))
  })

  it('counts any started topic as learning, including banked and decayed ones', () => {
    const topics = [
      seeded('nato-phonetic', { status: 'completed', completedAt: '2026-05-01T00:00:00.000Z' }),
      seeded('cardinal-bearings', { status: 'decayed', completedAt: '2026-01-01T00:00:00.000Z' }),
      seeded('ooda-loop'),
    ]
    const { learning, rest } = libraryGroups(journeysFor(topics))
    expect(learning.map((entry) => entry.topic.id).sort()).toEqual(['cardinal-bearings', 'nato-phonetic'])
    expect(rest.map((entry) => entry.topic.id)).toEqual(['ooda-loop'])
  })

  it('counts a Morse learner with settled letters as learning', () => {
    const source = seeded(MORSE_ID)
    const first = source.items[0].id as string
    const { learning } = libraryGroups(
      journeysFor([{ ...source, lessonProgress: { [first]: 'settled' } }]),
    )
    expect(learning).toHaveLength(1)
  })

  it('orders the learning group by the most recent activity', () => {
    const topics = [
      seeded('nato-phonetic', { status: 'learning', learningAt: '2026-03-01T00:00:00.000Z' }),
      seeded('cardinal-bearings', {
        status: 'drilled',
        learningAt: '2026-01-01T00:00:00.000Z',
        history: [{ at: '2026-04-01T00:00:00.000Z', correct: 8, total: 8, resolvedTo: 'drilled' }],
      }),
      seeded('ooda-loop', { status: 'learning', learningAt: '2026-02-01T00:00:00.000Z' }),
    ]
    const { learning } = libraryGroups(journeysFor(topics))
    expect(learning.map((entry) => entry.topic.id)).toEqual([
      'cardinal-bearings',
      'nato-phonetic',
      'ooda-loop',
    ])
  })

  it('reads zero, not a crash, for a record with no timestamps at all', () => {
    expect(lastActivityAt(seeded('ooda-loop'))).toBe(0)
  })
})
