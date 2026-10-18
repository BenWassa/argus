import { describe, expect, it } from 'vitest'
import { seedLibrary } from '../../domain/library/catalogSeed'
import type { Topic } from '../../domain/library/topic'
import type { DirectionEvidence } from '../../domain/study/evidence'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'
import { itemStanding, settledCount, topicItemGroups } from './topicItems'

function seeded(id: string): Topic {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  return parsed.library.topics.find(topic => topic.id === id)!
}

const seen = (consecutiveCorrect: number): DirectionEvidence => ({
  attempts: 2, correct: consecutiveCorrect, unassistedCorrect: 0, consecutiveCorrect, lastAt: '2026-01-01T00:00:00Z', lastLatencyMs: null,
})

const ATTEMPT = { at: '2026-01-01T00:00:00Z', correct: 1, total: 2, resolvedTo: 'learning' as const }

describe('item standing', () => {
  const base = seeded('whole-circle-bearings')
  const [first, second, third] = base.items
  const withEvidence = (topic: Topic): Topic => ({ ...topic, itemEvidence: {
    [first.id!]: { cue: 'rich', directions: { 'prompt-to-answer': seen(2) } },
    [second.id!]: { cue: 'rich', directions: { 'prompt-to-answer': seen(0) } },
  } })

  it('reads per-item evidence where Test wrote it', () => {
    const topic = withEvidence({ ...base, status: 'learning', history: [ATTEMPT] })
    expect(itemStanding(topic, first)).toBe('settled')
    expect(itemStanding(topic, second)).toBe('missed')
    // No evidence of its own: the topic was tested, so the item was seen.
    expect(itemStanding(topic, third)).toBe('seen')
    expect(settledCount(topic)).toBe(1)
  })

  it('turns a recorded miss into repair once the topic has decayed, and only that', () => {
    const topic = withEvidence({ ...base, status: 'decayed', completedAt: '2026-01-01T00:00:00Z', history: [ATTEMPT] })
    expect(itemStanding(topic, first)).toBe('settled')
    expect(itemStanding(topic, second)).toBe('repair')
    // No recorded miss, no copper: the header carries the topic's decay.
    expect(itemStanding(topic, third)).toBe('seen')
  })

  it('takes the topic rung for items without evidence', () => {
    expect(itemStanding({ ...base, status: 'unstarted', history: [] }, third)).toBe('unseen')
    const banked: Topic = { ...base, status: 'completed', completedAt: '2026-01-01T00:00:00Z', history: [ATTEMPT] }
    expect(itemStanding(banked, third)).toBe('settled')
    expect(settledCount(banked)).toBe(base.items.length)
  })

  it('needs every required direction settled for a two-way item', () => {
    const item = { ...third, kind: 'bidirectional' as const }
    const topic: Topic = { ...base, items: [item], status: 'learning', history: [ATTEMPT],
      itemEvidence: { [item.id!]: { cue: 'rich', directions: { 'prompt-to-answer': seen(1) } } } }
    expect(itemStanding(topic, item)).toBe('seen')
    const both: Topic = { ...topic, itemEvidence: { [item.id!]: { cue: 'rich', directions: { 'prompt-to-answer': seen(1), 'answer-to-prompt': seen(1) } } } }
    expect(itemStanding(both, item)).toBe('settled')
  })
})

describe('item groups', () => {
  it('keeps authored sequences in Test order with their letters', () => {
    const groups = topicItemGroups(seeded('firearm-safety-acts-prove'))
    expect(groups.map(group => group.label)).toEqual(['ACTS', 'PROVE'])
    expect(groups.flatMap(group => group.entries.map(entry => entry.marker)).join('')).toBe('ACTSPROVE')
  })

  it('numbers an unsequenced set in item order', () => {
    const topic = seeded('beaufort-wind-scale')
    const [group] = topicItemGroups(topic)
    expect(group.label).toBeUndefined()
    expect(group.entries.map(entry => entry.marker)).toEqual(topic.items.map((_, index) => String(index + 1)))
  })
})
