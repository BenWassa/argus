import { describe, expect, it } from 'vitest'
import { seedLibrary } from '../library/catalogSeed'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'
import type { Topic } from '../library/topic'
import type { DirectionEvidence, ItemCueEvidence } from './evidence'
import { REVIEW_LENGTH, isReviewTopic, reviewItems } from './review'
import { buildDeck, reviewTopics } from '../../features/test/testDeck'

const MORSE_ID = 'international-morse-letters-printed'
const NOW = new Date('2026-09-25T12:00:00.000Z')

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
    status: 'learning',
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
    expect(isReviewTopic(acquired(), NOW)).toBe(true)
  })

  it('runs the full deck when a scheduled check is due', () => {
    const due = acquired({ learningAt: '2026-09-01T00:00:00.000Z', acquisitionReadyAt: '2026-09-01T00:00:00.000Z' })
    expect(isReviewTopic(due, NOW)).toBe(false)
  })

  it('runs the full deck for repair, which is always due', () => {
    expect(isReviewTopic(acquired({ status: 'decayed', completedAt: '2026-01-01T00:00:00.000Z' }), NOW)).toBe(false)
  })

  it('never reviews mid-curriculum or an ordinary topic', () => {
    expect(isReviewTopic(acquired({ acquisitionReadyAt: undefined, lessonProgress: {} }), NOW)).toBe(false)
    const nato: Topic = { ...seeded('nato-phonetic'), status: 'drilled', drilledAt: '2026-09-24T00:00:00.000Z' }
    expect(isReviewTopic(nato, NOW)).toBe(false)
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

  it('builds a short deck for a review and the whole deck when a check is due', () => {
    // `reviewTopics` reads the live clock, so these are anchored to the real present.
    const now = new Date().toISOString()
    const waiting = acquired({ learningAt: now, acquisitionReadyAt: now })
    expect(buildDeck([waiting], new Map(), reviewTopics([waiting]))).toHaveLength(REVIEW_LENGTH)

    const due = acquired({ learningAt: '2020-01-01T00:00:00.000Z', acquisitionReadyAt: '2020-01-01T00:00:00.000Z' })
    expect(reviewTopics([due]).size).toBe(0)
    expect(buildDeck([due], new Map(), reviewTopics([due]))).toHaveLength(due.items.length)
  })
})
