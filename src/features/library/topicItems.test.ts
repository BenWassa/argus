import { describe, expect, it } from 'vitest'
import { seedLibrary } from '../../domain/library/catalogSeed'
import type { Topic } from '../../domain/library/topic'
import type { DirectionEvidence } from '../../domain/study/evidence'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'
import { itemStanding, settledCount, topicBar, topicItemGroups } from './topicItems'

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

describe('the header bar', () => {
  const base = seeded('nato-phonetic')
  const n = base.items.length
  const attempt = (correct: number, resolvedTo: Topic['status'], missedItemIds?: string[]) =>
    ({ at: '2026-01-01T00:00:00Z', correct, total: n, resolvedTo, ...(missedItemIds ? { missedItemIds } : {}) })

  it('reads the last Test for a topic in repair that just scored 22 of 26', () => {
    const topic: Topic = { ...base, status: 'learning', history: [attempt(26, 'completed'), attempt(22, 'learning')] }
    expect(topicBar(topic)).toEqual({ value: 22, max: 26, label: '22 of 26 correct in the last Test' })
  })

  it('reads a banked topic as every item settled', () => {
    const topic: Topic = { ...base, status: 'completed', history: [attempt(26, 'completed')] }
    expect(topicBar(topic)).toMatchObject({ value: 26, max: 26 })
  })

  it('shows no bar, not a false 0, with no Test to read', () => {
    expect(topicBar({ ...base, status: 'unstarted', history: [] })).toBeNull()
    expect(topicBar({ ...base, items: [], history: [] })).toBeNull()
  })

  it('shows no bar for a repair topic whose history does not describe it', () => {
    // Repair, but the only attempt on record says it completed.
    expect(topicBar({ ...base, status: 'decayed', history: [attempt(26, 'completed')] })).toBeNull()
  })

  it('reads a Test that got nothing right as a real zero', () => {
    expect(topicBar({ ...base, status: 'learning', history: [attempt(0, 'learning')] })).toMatchObject({ value: 0, max: 26 })
  })

  it('ignores a Test taken before the item set changed', () => {
    const topic: Topic = { ...base, status: 'learning', history: [{ ...attempt(9, 'learning'), total: 10 }] }
    expect(topicBar(topic)).toBeNull()
  })

  it('marks the items the last Test missed, copper only while in repair', () => {
    const [a, b] = base.items
    const learning: Topic = { ...base, status: 'learning', history: [attempt(24, 'learning', [a.id!, b.id!])] }
    expect(itemStanding(learning, a)).toBe('missed')
    expect(itemStanding(learning, base.items[2])).toBe('seen')
    const repair: Topic = { ...base, status: 'decayed', history: [attempt(24, 'decayed', [a.id!])] }
    expect(itemStanding(repair, a)).toBe('repair')
  })
})
