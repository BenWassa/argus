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

describe('one clean Test, without a clock', () => {
  for (const status of ['unstarted', 'learning', 'drilled', 'completed', 'decayed'] as Status[]) {
    for (const clean of [false, true]) {
      for (const eligible of [false, true]) {
        it(`${status}: clean=${clean}, eligible=${eligible}`, () => {
          const original = topic(status, { drilledAt: ago(10), completedAt: status === 'completed' || status === 'decayed' ? ago(20) : null })
          const result = resolveAttempt(original, clean ? 1 : 0, 1, now, { advancementEligible: eligible })
          const banked = status === 'completed' || status === 'drilled'
          expect(result.to).toBe(!eligible ? status : clean ? 'completed' : banked ? 'decayed' : 'learning')
          expect(result.completed).toBe(eligible && clean && !banked)
          expect(result.decayed).toBe(eligible && !clean && banked)
          expect(result.topic.history).toEqual([{ at: now.toISOString(), correct: clean ? 1 : 0, total: 1, resolvedTo: result.to }])
          expect(result.topic.lastTestedAt).toBe(now.toISOString())
          expect(original.history).toEqual([])
          if (eligible && (clean || banked)) expect(result.topic.completedAt).toBe(original.completedAt ?? (banked ? original.drilledAt : now.toISOString()))
        })
      }
    }
  }
  it('reads legacy drilled as banked without mutation', () => {
    const legacy = topic('drilled', { drilledAt: ago(365) })
    expect(dueState(legacy)).toEqual({ due: false, label: 'Banked' })
    expect(legacy.status).toBe('drilled')
    expect(legacy.completedAt).toBeNull()
  })
  it('does not bank an empty run', () => {
    expect(resolveAttempt(topic('unstarted'), 0, 0, now).to).toBe('learning')
  })
})
