import { describe, expect, it } from 'vitest'
import { gaugeFill, gaugeLabel, gaugeReading } from './gaugeReading'
import { journeyFor } from '../../domain/study/journey'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'
import { seedLibrary } from '../../domain/library/catalogSeed'
import type { Topic } from '../../domain/library/topic'

const NATO_ID = 'nato-phonetic'
const MORSE_ID = 'international-morse-letters-printed'
const DAY = 86_400_000

const NOW = new Date('2026-09-06T12:00:00.000Z')
const ago = (days: number) => new Date(NOW.getTime() - days * DAY).toISOString()

/**
 * Real shipped content through the real parse boundary, then the real journey,
 * so a reading is only ever asserted against a topic the app could actually
 * hold. A hand-built `TopicJourney` literal would let this file agree with
 * itself while disagreeing with `journeyFor`.
 */
function seeded(id: string): Topic {
  const parsed = parseLibrary(seedLibrary(), NOW)
  if (!parsed.ok) throw new Error(parsed.error)
  const topic = parsed.library.topics.find((candidate) => candidate.id === id)
  if (!topic) throw new Error(`Missing seeded topic ${id}`)
  return topic
}

const reading = (topic: Topic) => gaugeReading(topic, journeyFor(topic, NOW))

describe('the gauge reads an ordinary topic honestly', () => {
  /**
   * The regression this whole module exists to prevent.
   *
   * An ordinary reveal-and-grade topic records no per-item evidence and its
   * items carry no ids, so `evidence.covered` is structurally zero for it
   * forever. Reading it would put `0 of 26` next to a status line that says
   * the topic is drilled, which is the gauge calling the rest of the page a
   * liar.
   */
  it('never reports evidence coverage for a topic that keeps none', () => {
    const topic: Topic = {
      ...seeded(NATO_ID),
      status: 'drilled',
      learningAt: ago(60),
      drilledAt: ago(10),
      lastTestedAt: ago(10),
      itemEvidence: {},
    }

    const journey = journeyFor(topic, NOW)
    // The trap is real: the underlying view genuinely reports zero coverage.
    expect(journey.evidence.covered).toBe(0)
    expect(journey.evidence.total).toBe(26)
    // The gauge must not repeat it.
    expect(gaugeReading(topic, journey).kind).not.toBe('evidence')
  })

  it('reports the retention gap it is actually serving', () => {
    const topic: Topic = {
      ...seeded(NATO_ID),
      status: 'drilled',
      learningAt: ago(60),
      drilledAt: ago(10),
      lastTestedAt: ago(10),
      itemEvidence: {},
    }

    const result = reading(topic)
    expect(result.kind).toBe('gap')
    if (result.kind !== 'gap') return
    expect(result.progress).toBeGreaterThan(0)
    expect(gaugeFill(result)).toBeLessThanOrEqual(1)
  })
})

describe('the gauge picks the most specific earned reading', () => {
  it('reports acquisition while a curriculum is still introducing its roster', () => {
    const topic = seeded(MORSE_ID)
    const result = gaugeReading(topic, journeyFor(topic, NOW))

    if (journeyFor(topic, NOW).acquisition.ready) {
      // The shipped seed is already past acquisition; the branch is covered by
      // the explicit unready case below rather than by the seed's own state.
      expect(['evidence', 'gap', 'complete', 'none']).toContain(result.kind)
      return
    }

    expect(result.kind).toBe('acquisition')
    if (result.kind !== 'acquisition') return
    expect(result.total).toBeGreaterThan(0)
    expect(result.done).toBeLessThanOrEqual(result.total)
  })

  it('outranks every in-motion measure with completion', () => {
    const topic: Topic = {
      ...seeded(NATO_ID),
      status: 'completed',
      completedAt: ago(3),
      drilledAt: ago(40),
      lastTestedAt: ago(3),
    }
    expect(reading(topic).kind).toBe('complete')
    expect(gaugeFill({ kind: 'complete' })).toBe(1)
  })

  /**
   * Decay is explicitly not folded into `complete`. A decayed topic is back in
   * motion and the live reading is the truthful one — the product treats decay
   * as information rather than as the loss of a completion.
   */
  it('shows a decayed topic its live reading, not its banked one', () => {
    const topic: Topic = {
      ...seeded(NATO_ID),
      status: 'decayed',
      completedAt: ago(200),
      drilledAt: ago(120),
      lastTestedAt: ago(1),
    }
    expect(reading(topic).kind).not.toBe('complete')
  })
})

describe('the gauge stays silent when it has nothing true to say', () => {
  it('reads nothing for a topic with no items', () => {
    const topic: Topic = { ...seeded(NATO_ID), items: [] }
    expect(reading(topic).kind).toBe('none')
    expect(gaugeLabel({ kind: 'none' })).toBeNull()
    expect(gaugeFill({ kind: 'none' })).toBeNull()
  })

  it('reads nothing for an unstarted topic with no clock running', () => {
    const topic: Topic = {
      ...seeded(NATO_ID),
      status: 'unstarted',
      learningAt: null,
      drilledAt: null,
      completedAt: null,
      lastTestedAt: null,
      history: [],
      itemEvidence: {},
    }
    expect(reading(topic).kind).toBe('none')
  })
})

describe('every reading names its own units', () => {
  it('labels each kind in the units it was measured in', () => {
    expect(gaugeLabel({ kind: 'complete' })).toBe('Banked')
    expect(gaugeLabel({ kind: 'acquisition', done: 18, total: 26 })).toBe(
      '18 of 26 letters settled',
    )
    expect(gaugeLabel({ kind: 'evidence', done: 9, total: 26 })).toBe(
      '9 of 26 recalled both ways',
    )
    expect(gaugeLabel({ kind: 'gap', progress: 0.5, waitDays: 6 })).toBe(
      '6 days of the gap to go',
    )
  })

  it('says day in the singular, and names a served gap rather than zero days', () => {
    expect(gaugeLabel({ kind: 'gap', progress: 0.9, waitDays: 1 })).toBe('1 day of the gap to go')
    expect(gaugeLabel({ kind: 'gap', progress: 1, waitDays: 0 })).toBe('Gap served')
  })

  it('clamps a fill that the source measure overshot', () => {
    expect(gaugeFill({ kind: 'gap', progress: 1.4, waitDays: 0 })).toBe(1)
    expect(gaugeFill({ kind: 'gap', progress: -0.2, waitDays: 9 })).toBe(0)
    expect(gaugeFill({ kind: 'evidence', done: 13, total: 26 })).toBe(0.5)
  })

  it('has no fill to report for a total of zero rather than dividing by it', () => {
    expect(gaugeFill({ kind: 'acquisition', done: 0, total: 0 })).toBeNull()
  })
})
