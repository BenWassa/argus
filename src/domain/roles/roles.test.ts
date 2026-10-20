import { describe, expect, it } from 'vitest'
import { seedLibrary } from '../library/catalogSeed'
import { COMMUNICATOR, ROLE_IDS, communicatorProgress, wasBanked } from './roles'
import type { Topic } from '../library/topic'
import { catalogDefinitions, SHIPPED_CATALOG_TOPIC_IDS } from '../library/catalog'
import { AVAILABLE_ROLES, MARINER, NAVIGATOR } from './definitions'
import { roleProgress } from './roles'

const IDS: string[] = COMMUNICATOR.pathways.flatMap((path) => [...path.topicIds])
function baseline(): Topic[] {
  return seedLibrary().topics.filter((topic) => IDS.includes(topic.id))
    .map((topic) => ({ ...topic, origin: 'catalog' as const, status: 'unstarted' as const, completedAt: null, drilledAt: null }))
}
const complete = (topic: Topic): Topic => ({ ...topic, status: 'completed', completedAt: '2026-10-01T12:00:00Z' })

describe('Communicator role', () => {
  it('keeps every requirement in the shipped manifest with sourced Learn limits', () => {
    const catalog = new Map(catalogDefinitions().map((topic) => [topic.id, topic]))
    for (const id of AVAILABLE_ROLES.flatMap((role) => role.pathways.flatMap((path) => [...path.topicIds]))) {
      expect(SHIPPED_CATALOG_TOPIC_IDS, `${id} is not shipped`).toContain(id)
      expect(catalog.get(id)?.learn?.sources?.length, `${id} needs sources`).toBeGreaterThan(0)
      expect(catalog.get(id)?.learn?.limitations?.length, `${id} needs limitations`).toBeGreaterThan(0)
    }
  })
  it('locks Navigator to five distinct shipped topics and two fully open pathways', () => {
    const ids = NAVIGATOR.pathways.flatMap((path) => [...path.topicIds])
    expect(new Set(ids).size).toBe(5)
    expect(NAVIGATOR.pathways.map((path) => path.topicIds.length)).toEqual([3, 2])
    const topics = seedLibrary().topics.filter((topic) => ids.includes(topic.id as typeof ids[number]))
      .map((topic) => complete({ ...topic, origin: 'catalog' }))
    expect(topics.reduce((sum, topic) => sum + topic.items.length, 0)).toBe(60)
    expect(roleProgress(NAVIGATOR, topics)).toMatchObject({ earned: true, completeCount: 5, requiredCount: 5 })
    expect(roleProgress(NAVIGATOR, topics.slice(1)).earned).toBe(false)
  })
  it('locks Mariner to seven distinct shipped topics, 69 items and three open pathways', () => {
    const ids = MARINER.pathways.flatMap((path) => [...path.topicIds])
    expect(new Set(ids).size).toBe(7)
    expect(MARINER.pathways.map((path) => path.topicIds.length)).toEqual([3, 2, 2])
    const topics = seedLibrary().topics.filter((topic) => ids.includes(topic.id as typeof ids[number]))
      .map((topic) => complete({ ...topic, origin: 'catalog' }))
    expect(topics.reduce((sum, topic) => sum + topic.items.length, 0)).toBe(69)
    expect(roleProgress(MARINER, topics)).toMatchObject({ earned: true, completeCount: 7, requiredCount: 7 })
    expect(roleProgress(MARINER, topics.slice(1)).earned).toBe(false)
  })
  it('shares Signal Flags and both Marine Radio topics between Communicator and Mariner', () => {
    const mariner = new Set<string>(MARINER.pathways.flatMap((path) => [...path.topicIds]))
    const shared = IDS.filter((id) => mariner.has(id))
    expect(shared.sort()).toEqual(['marine-vhf-priority-communications', 'marine-vhf-routine-calling', 'signal-flags'])
  })
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
  it('keeps old repair records learned without a freshness state', () => {
    const topics = baseline().map(complete).map((t, i) => i === 0 ? { ...t, status: 'decayed' as const } : t)
    expect(communicatorProgress(topics)).toMatchObject({ earned: true })
    expect(communicatorProgress(topics)).not.toHaveProperty('needsRefresh')
  })
  it('accepts legacy drilled history, not missing or user-owned collision', () => {
    expect(wasBanked({ ...baseline()[0], status: 'drilled', drilledAt: '2026-09-01' })).toBe(true)
    const done = baseline().map(complete)
    expect(communicatorProgress(done.slice(1)).earned).toBe(false)
    expect(communicatorProgress(done.map((t,i) => i === 0 ? { ...t, origin:'user' as const } : t)).earned).toBe(false)
  })
})
