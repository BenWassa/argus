import { describe, expect, it } from 'vitest'
import { seedLibrary } from '../library/catalogSeed'
import { COMMUNICATOR, ROLE_IDS, communicatorProgress, wasBanked } from './roles'
import type { Topic } from '../library/topic'

const IDS: string[] = COMMUNICATOR.pathways.flatMap((path) => [...path.topicIds])
function baseline(): Topic[] {
  return seedLibrary().topics.filter((topic) => IDS.includes(topic.id))
    .map((topic) => ({ ...topic, origin: 'catalog' as const, status: 'unstarted' as const, completedAt: null, drilledAt: null }))
}
const complete = (topic: Topic): Topic => ({ ...topic, status: 'completed', completedAt: '2026-10-01T12:00:00Z' })

describe('Communicator role', () => {
  it('has six approved identities and seven unique v1 topics in three open pathways', () => {
    expect(ROLE_IDS).toEqual(['communicator', 'navigator', 'mariner', 'diver', 'responder', 'operator'])
    expect(IDS).toHaveLength(7)
    expect(new Set(IDS).size).toBe(7)
    expect(COMMUNICATOR.pathways.map((p) => p.topicIds.length)).toEqual([3, 2, 2])
  })
  it('does not award for partial completion', () => {
    const topics = baseline().map((t, i) => i === 0 ? { ...t, status: 'learning' as const } : complete(t))
    expect(communicatorProgress(topics).completeCount).toBe(6)
    expect(communicatorProgress(topics).earned).toBe(false)
  })
  it('awards only when all seven topics were genuinely banked', () => {
    const result = communicatorProgress(baseline().map(complete))
    expect(result.earned).toBe(true)
    expect(result.pathways.every((path) => path.state === 'complete')).toBe(true)
  })
  it('does not revoke after decay; freshness remains separate', () => {
    const topics = baseline().map(complete).map((t, i) => i === 0 ? { ...t, status: 'decayed' as const } : t)
    expect(communicatorProgress(topics)).toMatchObject({ earned: true, needsRefresh: true })
  })
  it('accepts legacy drilled history, not missing or user-owned collision', () => {
    expect(wasBanked({ ...baseline()[0], drilledAt: '2026-09-01' })).toBe(true)
    const done = baseline().map(complete)
    expect(communicatorProgress(done.slice(1)).earned).toBe(false)
    expect(communicatorProgress(done.map((t,i) => i === 0 ? { ...t, origin:'user' as const } : t)).earned).toBe(false)
  })
})
