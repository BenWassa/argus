import { describe, expect, it } from 'vitest'
import { seedLibrary } from '../library/catalogSeed'
import type { Topic } from '../library/topic'
import { journeysFor, journeyFor } from './journey'
import { homeProgress, homeReadout } from './home'

function topic(patch: Partial<Topic> = {}): Topic {
  return { ...seedLibrary().topics[0], status: 'unstarted', learningAt: null, drilledAt: null,
    completedAt: null, lastTestedAt: null, spotCheckedAt: null, history: [], itemEvidence: {}, ...patch }
}

describe('Home readings', () => {
  it('keeps legacy repair topics learned and excludes them from in-progress count', () => {
    const repair = topic({ status: 'decayed', completedAt: '2026-09-01T12:00:00Z' })
    const building = topic({ id: 'building', status: 'learning' })
    expect(homeReadout(journeysFor([repair, building, topic({ id: 'untouched' })]))).toMatchObject({ completed: 1, inProgress: 1 })
    expect(homeProgress(repair, journeyFor(repair))).toEqual({ kind: 'complete', label: 'Learned' })
  })

  it('reads the newest durable activity, not topic edits or mere browsing', () => {
    const record = topic({ learningAt: '2026-09-01T12:00:00Z', history: [
      { at: '2026-10-02T15:00:00Z', correct: 0, total: 1, resolvedTo: 'learning' },
    ] })
    expect(homeReadout(journeysFor([record, topic()])).lastActive).toBe('2026-10-02T15:00:00.000Z')
    expect(homeReadout(journeysFor([topic()]))).toEqual({ completed: 0, inProgress: 0, lastActive: null })
  })

  it('does not invent a percentage for ordinary recall', () => {
    const building = topic({ status: 'learning' })
    expect(homeProgress(building, journeyFor(building))).toEqual({ kind: 'started', label: 'Building recall' })
  })

  it('names what the last Test missed, so a failed Test is not forgotten on Home', () => {
    const [first, second] = seedLibrary().topics[0].items
    const missed = topic({ status: 'learning', history: [
      { at: '2026-10-02T15:00:00Z', correct: 24, total: 26, resolvedTo: 'learning', missedItemIds: [first.id!, second.id!] },
    ] })
    expect(homeProgress(missed, journeyFor(missed))).toEqual({ kind: 'started', label: '2 to practise' })
    // Even a topic once completed: a failed repair Test sent it back to learning.
    const again = { ...missed, completedAt: '2026-09-01T00:00:00Z' }
    expect(homeProgress(again, journeyFor(again))).toEqual({ kind: 'complete', label: 'Learned' })
  })

  it('uses the curriculum settled count for Morse without mixing retention into it', () => {
    const morse = seedLibrary().topics.find(({ id }) => id === 'international-morse-letters-printed')!
    const journey = journeyFor(morse)
    expect(homeProgress(morse, journey)).toEqual({ kind: 'ratio', done: journey.acquisition.settled,
      total: journey.acquisition.total, label: `${journey.acquisition.settled} of ${journey.acquisition.total} letters settled` })
  })
})
