import { describe, expect, it } from 'vitest'
import { seedLibrary } from '../library/catalogSeed'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'
import type { Topic } from '../library/topic'
import type { DirectionEvidence, ItemCueEvidence } from './evidence'
import { REVIEW_LENGTH, isReviewTopic, reviewItems } from './review'
import { buildDeck, reviewTopics } from '../../features/test/testDeck'

const MORSE_ID = 'international-morse-letters-printed'

function seeded(id: string): Topic {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  const topic = parsed.library.topics.find((candidate) => candidate.id === id)
  if (!topic) throw new Error(`Missing ${id}`)
  return topic
}

/** The alphabet finished yesterday evening: acquired, and its first check not yet due. */
function acquired(overrides: Partial<Topic> = {}): Topic {
  return {
    ...seeded(MORSE_ID),
    status: 'completed',
    completedAt: '2026-09-25T08:00:00.000Z',
    learningAt: '2026-09-25T08:00:00.000Z',
    acquisitionReadyAt: '2026-09-25T08:00:00.000Z',
    history: [],
    itemEvidence: {},
    ...overrides,
  }
}

function seen(overrides: Partial<DirectionEvidence>): DirectionEvidence {
  return {
    attempts: 4,
    correct: 4,
    unassistedCorrect: 4,
    consecutiveCorrect: 4,
    lastAt: '2026-09-01T00:00:00.000Z',
    lastLatencyMs: null,
    ...overrides,
  }
}

function both(forward: Partial<DirectionEvidence>, reverse: Partial<DirectionEvidence> = forward): ItemCueEvidence {
  return { cue: 'free', directions: { 'prompt-to-answer': seen(forward), 'answer-to-prompt': seen(reverse) } }
}

function idOf(topic: Topic, glyph: string): string {
  const item = topic.items.find((candidate) => candidate.prompt === glyph)
  if (!item?.id) throw new Error(`No item for ${glyph}`)
  return item.id
}

/** Every letter held cleanly in both directions, as of a given day. */
function allHeld(topic: Topic, lastAt = '2026-09-01T00:00:00.000Z'): Record<string, ItemCueEvidence> {
  return Object.fromEntries(topic.items.map((item) => [item.id as string, both({ lastAt })]))
}

describe('when a Test runs as a review', () => {
  it('reviews an acquired topic between scheduled checks', () => {
    expect(isReviewTopic(acquired())).toBe(true)
  })

  it('can review a banked course however long ago it was banked', () => {
    expect(isReviewTopic(acquired({ completedAt: '2020-01-01T00:00:00.000Z' }))).toBe(true)
  })

  it('runs the full deck for repair, which is always due', () => {
    expect(isReviewTopic(acquired({ status: 'decayed', completedAt: '2026-01-01T00:00:00.000Z' }))).toBe(false)
  })

  it('never reviews mid-curriculum or an ordinary topic', () => {
    expect(isReviewTopic(acquired({ acquisitionReadyAt: undefined, lessonProgress: {} }))).toBe(false)
    const nato: Topic = { ...seeded('nato-phonetic'), status: 'drilled', drilledAt: '2026-09-24T00:00:00.000Z' }
    expect(isReviewTopic(nato)).toBe(false)
  })
})

describe('what a review asks', () => {
  it(`asks ${REVIEW_LENGTH} letters, not the whole alphabet`, () => {
    const topic = acquired()
    expect(reviewItems(topic)).toHaveLength(REVIEW_LENGTH)
    expect(topic.items.length).toBeGreaterThan(REVIEW_LENGTH)
  })

  it('puts recent misses first, then letters never tested, then shaky ones', () => {
    const base = acquired()
    const evidence = allHeld(base)
    evidence[idOf(base, 'Q')] = both({ consecutiveCorrect: 0, lastAt: '2026-09-20T00:00:00.000Z' })
    evidence[idOf(base, 'Y')] = both({ consecutiveCorrect: 0, lastAt: '2026-09-22T00:00:00.000Z' })
    delete evidence[idOf(base, 'J')]
    evidence[idOf(base, 'X')] = both({ attempts: 10, correct: 10, unassistedCorrect: 5 })

    const asked = reviewItems({ ...base, itemEvidence: evidence }).map((item) => item.prompt)
    expect(asked.slice(0, 4)).toEqual(['Y', 'Q', 'J', 'X'])
  })

  it('rotates through the roster, least recently asked first, when everything is held', () => {
    const base = acquired()
    const evidence = allHeld(base, '2026-09-20T00:00:00.000Z')
    for (const glyph of ['B', 'D', 'F']) evidence[idOf(base, glyph)] = both({ lastAt: '2026-08-01T00:00:00.000Z' })
    const asked = reviewItems({ ...base, itemEvidence: evidence }).map((item) => item.prompt)
    expect(asked.slice(0, 3)).toEqual(['B', 'D', 'F'])
  })

  it('builds a short deck for a review and the whole deck for a check', () => {
    const banked = acquired({ completedAt: '2020-01-01T00:00:00.000Z' })
    expect(buildDeck([banked], new Map(), reviewTopics([banked]))).toHaveLength(REVIEW_LENGTH)
    // Whether a run is a review is the learner's choice; a check passes none.
    expect(buildDeck([banked], new Map(), new Set())).toHaveLength(banked.items.length)

    const repair = acquired({ status: 'decayed', completedAt: '2020-01-01T00:00:00.000Z' })
    expect(reviewTopics([repair]).size).toBe(0)
  })
})
