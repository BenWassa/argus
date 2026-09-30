import { describe, expect, it } from 'vitest'
import { dueState, resolveAttempt } from './scheduling'
import type { Status, Topic } from '../library/topic'

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

describe('Test evidence policy, with no clock', () => {
  it('completes after two perfect attempts on the same day', () => {
    const first = resolveAttempt(topic('unstarted'), 1, 1, now)
    const second = resolveAttempt(first.topic, 1, 1, now)
    expect(second.to).toBe('completed')
    expect(second.completed).toBe(true)
  })

  it('does not count a failed first attempt as mastery', () => {
    const first = resolveAttempt(topic('unstarted'), 0, 1, now)
    const second = resolveAttempt(first.topic, 1, 1, now)
    expect(second.to).toBe('drilled')
  })

  it('cannot bypass first exposure', () => {
    const result = resolveAttempt(topic('unstarted'), 1, 1, now)
    expect(result.to).toBe('learning')
    expect(result.topic.learningAt).toBe(now.toISOString())
  })

  it('advances a learning Test taken straight away, keeping when learning began', () => {
    const learningAt = ago(0)
    const result = resolveAttempt(topic('learning', { learningAt }), 1, 1, now)
    expect(result.to).toBe('drilled')
    expect(result.topic.learningAt).toBe(learningAt)
    expect(result.topic.history).toHaveLength(1)
  })

  it('banks completion on the next clean run, however soon, keeping drilledAt', () => {
    const drilledAt = ago(10)
    const result = resolveAttempt(topic('drilled', { drilledAt }), 1, 1, now)
    expect(result.to).toBe('completed')
    expect(result.topic.drilledAt).toBe(drilledAt)
    expect(result.completed).toBe(true)
  })

  it('checks a banked topic whenever the learner chooses, however recently it was checked', () => {
    const completedAt = ago(100)
    const spotCheckedAt = ago(0)
    const passed = resolveAttempt(topic('completed', { completedAt, spotCheckedAt }), 1, 1, now)
    expect(passed.to).toBe('completed')
    expect(passed.topic.spotCheckedAt).toBe(now.toISOString())

    const failed = resolveAttempt(topic('completed', { completedAt, spotCheckedAt }), 0, 1, now)
    expect(failed.to).toBe('decayed')
    expect(failed.decayed).toBe(true)
    expect(failed.topic.completedAt).toBe(completedAt)
  })

  it('reads the same ladder for a topic untouched for a year', () => {
    expect(dueState(topic('completed', { completedAt: ago(365) }))).toEqual({ due: false, label: 'Banked' })
    expect(dueState(topic('drilled', { drilledAt: ago(365) }))).toEqual({ due: true, label: 'Ready to test again' })
  })

  it('allows corrective Test evidence to resolve decayed immediately', () => {
    const completedAt = ago(200)
    const result = resolveAttempt(topic('decayed', { completedAt }), 1, 1, now)
    expect(result.to).toBe('drilled')
    expect(result.topic.drilledAt).toBe(now.toISOString())
    expect(result.topic.completedAt).toBe(completedAt)
  })
})

