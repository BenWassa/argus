import { describe, expect, it } from 'vitest'
import { seedLibrary } from '../library/catalogSeed'
import type { Topic } from '../library/topic'
import { applyResolution, dueState, resolveAttempt } from './scheduling'
import { journeyFor, dueEntries, journeysFor } from './journey'
import { hasPractice, lastTestMissedIds } from './practiceTargets'
import { resolveBankedAttempt } from '../../features/test/bankedAttempt'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'

const learnedAt = '2026-01-01T00:00:00.000Z'
const later = new Date('2026-10-19T12:00:00.000Z')
const base = seedLibrary().topics.find(topic => topic.id === 'nato-phonetic')!
const learned: Topic = { ...base, status: 'completed', completedAt: learnedAt }

describe('learned means learned', () => {
  it.each(['completed', 'decayed', 'learning', 'drilled'] as const)('keeps a %s record learned after a later miss', status => {
    const before: Topic = { ...learned, status }
    const snapshot = structuredClone(before)
    const result = resolveAttempt(before, 0, before.items.length, later, { missedItemIds: [before.items[0].id!] })
    expect(result.to).toBe('completed')
    expect(result.completed).toBe(false)
    expect(result.topic.completedAt).toBe(learnedAt)
    expect(result.topic.history.at(-1)).toMatchObject({ correct: 0, resolvedTo: 'completed', missedItemIds: [before.items[0].id!] })
    expect(dueState(result.topic)).toEqual({ due: false, label: 'Learned' })
    expect(journeyFor(result.topic).phase).toBe('banked')
    expect(dueEntries(journeysFor([result.topic]))).toEqual([])
    expect(hasPractice(result.topic)).toBe(false)
    expect(lastTestMissedIds(result.topic)).toEqual([])
    expect(before).toEqual(snapshot)
  })

  it('keeps the actual score of an optional Morse Test, independent of qualification gates', () => {
    const morse: Topic = { ...seedLibrary().topics.find(topic => topic.id === 'international-morse-letters-printed')!, status: 'completed', completedAt: learnedAt }
    const result = resolveBankedAttempt(morse, { correct: 23, total: 26 }, {}, [], later)
    expect(result.resolution.topic.history.at(-1)).toMatchObject({ correct: 23, total: 26, resolvedTo: 'completed' })
    expect(result.resolution.topic.completedAt).toBe(learnedAt)
  })

  it('preserves completion that landed after a Test began', () => {
    const unfinished: Topic = { ...base, status: 'learning', completedAt: null, drilledAt: null }
    const pending = resolveAttempt(unfinished, 0, unfinished.items.length, later)
    const stored = applyResolution(learned, pending)
    expect(stored.status).toBe('completed')
    expect(stored.completedAt).toBe(learnedAt)
    expect(stored.history.at(-1)).toMatchObject({ correct: 0, resolvedTo: 'completed' })
  })

  it('loads old repair records as learned without rewriting scores or evidence', () => {
    const old: Topic = { ...learned, status: 'decayed', history: [
      { at: learnedAt, correct: 26, total: 26, resolvedTo: 'completed' },
      { at: later.toISOString(), correct: 20, total: 26, resolvedTo: 'decayed', missedItemIds: [base.items[0].id!] },
    ] }
    const parsed = parseLibrary({ version: 5, topics: [old] })
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) throw new Error(parsed.error)
    const loaded = parsed.library.topics[0]
    expect(loaded.status).toBe('completed')
    expect(loaded.completedAt).toBe(learnedAt)
    expect(loaded.history).toEqual(old.history)
    expect(loaded.itemEvidence).toEqual(old.itemEvidence ?? {})
    const roundTrip = parseLibrary(JSON.parse(JSON.stringify(parsed.library)))
    expect(roundTrip).toEqual(parsed)
  })
})
