import { describe, expect, it } from 'vitest'
import { resolveAttempt } from './scheduling'
import type { Status, Topic } from './types'

const DAY = 86_400_000
const now = new Date('2026-09-02T12:00:00.000Z')
const ago = (days: number) => new Date(now.getTime() - days * DAY).toISOString()

function topic(status: Status, overrides: Partial<Topic> = {}): Topic {
  return {
    id: status,
    title: status,
    scope: 'One item.',
    track: 'learning',
    items: [{ prompt: 'p', answer: 'a' }],
    status,
    createdAt: ago(100),
    learningAt: null,
    drilledAt: null,
    completedAt: null,
    lastTestedAt: null,
    spotCheckedAt: null,
    history: [],
    ...overrides,
  }
}

describe('early Test evidence policy', () => {
  it('cannot bypass first exposure and the learning gap', () => {
    const result = resolveAttempt(topic('unstarted'), 1, 1, now)
    expect(result.to).toBe('learning')
    expect(result.topic.learningAt).toBe(now.toISOString())
  })

  it('records an early learning Test without advancing or postponing its gap', () => {
    const learningAt = ago(0)
    const result = resolveAttempt(topic('learning', { learningAt }), 1, 1, now)
    expect(result.to).toBe('learning')
    expect(result.topic.learningAt).toBe(learningAt)
    expect(result.topic.history).toHaveLength(1)
  })

  it('does not bank completion or reset drilledAt before 30 days', () => {
    const drilledAt = ago(10)
    const result = resolveAttempt(topic('drilled', { drilledAt }), 1, 1, now)
    expect(result.to).toBe('drilled')
    expect(result.topic.drilledAt).toBe(drilledAt)
    expect(result.completed).toBe(false)
  })

  it('does not reset the completed-topic spot-check clock early', () => {
    const completedAt = ago(100)
    const spotCheckedAt = ago(10)
    const result = resolveAttempt(topic('completed', { completedAt, spotCheckedAt }), 1, 1, now)
    expect(result.to).toBe('completed')
    expect(result.topic.spotCheckedAt).toBe(spotCheckedAt)
  })

  it('allows corrective Test evidence to resolve decayed immediately', () => {
    const completedAt = ago(200)
    const result = resolveAttempt(topic('decayed', { completedAt }), 1, 1, now)
    expect(result.to).toBe('drilled')
    expect(result.topic.drilledAt).toBe(now.toISOString())
    expect(result.topic.completedAt).toBe(completedAt)
  })
})

describe('due Test evidence policy', () => {
  it('advances learning after its one-day gap', () => {
    const result = resolveAttempt(topic('learning', { learningAt: ago(1) }), 1, 1, now)
    expect(result.to).toBe('drilled')
  })

  it('banks completion after its 30-day gap', () => {
    const result = resolveAttempt(topic('drilled', { drilledAt: ago(30) }), 1, 1, now)
    expect(result.to).toBe('completed')
    expect(result.completed).toBe(true)
  })

  it('resets the spot-check clock only when the completed topic is due', () => {
    const result = resolveAttempt(topic('completed', { completedAt: ago(100) }), 1, 1, now)
    expect(result.to).toBe('completed')
    expect(result.topic.spotCheckedAt).toBe(now.toISOString())
  })
})
