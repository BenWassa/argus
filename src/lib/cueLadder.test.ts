import { describe, expect, it } from 'vitest'
import {
  CUE_FADE_STREAK,
  CUE_RUNGS,
  FREE_PRODUCTION_RUNG,
  FREE_RECEPTION_RUNG,
  RICH_RUNG,
  UNCUED_RUNGS,
  emptyCueEvidence,
  isEstablished,
  isInAcquisition,
  mergeItemEvidence,
  recordAnswer,
  revealedElementCount,
  rungFor,
  rungIndexFor,
  withItemEvidence,
} from './cueLadder'
import { resolveAttempt, resolveStudy } from './scheduling'
import type { IdentifiedItem, ItemCueEvidence, Topic } from './types'

const forward: IdentifiedItem = { id: 'i-r', kind: 'forward', prompt: 'R', answer: '.-.' }
const both: IdentifiedItem = { id: 'i-s', kind: 'bidirectional', prompt: 'S', answer: '...' }

function answer(evidence: ItemCueEvidence | undefined, item: IdentifiedItem, correct: boolean, latencyMs = 900) {
  const rung = rungFor(item, evidence)
  return recordAnswer(evidence, {
    direction: rung.direction,
    correct,
    latencyMs,
    at: '2026-01-01T00:00:00.000Z',
  })
}

function run(item: IdentifiedItem, outcomes: boolean[], latency = () => 900): ItemCueEvidence | undefined {
  let evidence: ItemCueEvidence | undefined
  for (const correct of outcomes) evidence = answer(evidence, item, correct, latency())
  return evidence
}

describe('the cue ladder', () => {
  it('fades support while keeping printed letter-to-Morse response as production', () => {
    expect(CUE_RUNGS.map((rung) => rung.id)).toEqual([
      'rich-recognition',
      'delayed-recognition',
      'reduced-recognition',
      'free-production',
      'free-reception',
    ])
    expect(CUE_RUNGS.map((rung) => rung.response)).toEqual([
      'production',
      'production',
      'production',
      'production',
      'entry',
    ])
    expect(CUE_RUNGS[FREE_RECEPTION_RUNG].direction).toBe('answer-to-prompt')
    expect(CUE_RUNGS.slice(0, FREE_RECEPTION_RUNG).every((rung) => rung.direction === 'prompt-to-answer')).toBe(true)
  })

  it('starts every item at the richest rung', () => {
    expect(rungIndexFor(forward, undefined)).toBe(RICH_RUNG)
    expect(rungIndexFor(forward, emptyCueEvidence())).toBe(RICH_RUNG)
  })

  it('uses no visual multiple-choice delay or answer-revealing audio on production rungs', () => {
    for (const rung of CUE_RUNGS.slice(0, FREE_RECEPTION_RUNG)) {
      expect(rung.response).toBe('production')
      expect(rung.choiceDelayMs).toBe(0)
      expect(rung.allowsAudio).toBe(false)
    }
  })

  it('never discloses the whole answer as a cue', () => {
    for (const rung of CUE_RUNGS) {
      for (let length = 1; length <= 5; length += 1) {
        expect(revealedElementCount(rung, length)).toBeLessThan(length)
        expect(revealedElementCount(rung, length)).toBeGreaterThanOrEqual(0)
      }
    }
    expect(revealedElementCount(CUE_RUNGS[0], 1)).toBe(0)
    expect(revealedElementCount(CUE_RUNGS[0], 4)).toBe(2)
    expect(revealedElementCount(CUE_RUNGS[1], 4)).toBe(1)
    expect(revealedElementCount(CUE_RUNGS[2], 4)).toBe(0)
  })

  it('has uncued rungs that carry no scaffolding of any kind', () => {
    expect(UNCUED_RUNGS.map((rung) => rung.id)).toEqual(['free-production', 'free-reception'])
    for (const rung of UNCUED_RUNGS) {
      expect(rung.allowsArtwork).toBe(false)
      expect(rung.showsLength).toBe(false)
      expect(rung.revealPolicy).toBe('none')
      expect(rung.allowsAudio).toBe(false)
    }
  })
})

describe('fading', () => {
  it('fades after N consecutive correct at a rung, and not before', () => {
    expect(CUE_FADE_STREAK).toBe(2)
    const one = run(forward, [true])
    expect(rungIndexFor(forward, one)).toBe(0)
    const two = run(forward, [true, true])
    expect(rungIndexFor(forward, two)).toBe(1)
    const three = run(forward, [true, true, true])
    expect(rungIndexFor(forward, three)).toBe(1)
    const four = run(forward, [true, true, true, true])
    expect(rungIndexFor(forward, four)).toBe(2)
  })

  it('breaks the streak on an error rather than counting corrects cumulatively', () => {
    const broken = run(forward, [true, false, true])
    expect(rungIndexFor(forward, broken)).toBe(0)
  })

  it('restores stronger scaffolding after an error, one rung at a time', () => {
    const reduced = run(forward, [true, true, true, true])
    expect(rungIndexFor(forward, reduced)).toBe(2)
    const afterError = answer(reduced, forward, false)
    expect(rungIndexFor(forward, afterError)).toBe(1)
    const afterSecondError = answer(afterError, forward, false)
    expect(rungIndexFor(forward, afterSecondError)).toBe(0)
    const afterThird = answer(afterSecondError, forward, false)
    expect(rungIndexFor(forward, afterThird)).toBe(0)
  })

  it('climbs all the way to free production for a forward item and stops there', () => {
    const climbed = run(forward, Array(10).fill(true))
    expect(rungIndexFor(forward, climbed)).toBe(FREE_PRODUCTION_RUNG)
    expect(climbed?.cue).toBe('free')
  })

  it('opens the reverse direction only for an item whose semantics require it', () => {
    const forwardClimb = run(forward, Array(12).fill(true))
    expect(rungIndexFor(forward, forwardClimb)).toBe(FREE_PRODUCTION_RUNG)

    const bidirectionalClimb = run(both, Array(12).fill(true))
    expect(rungIndexFor(both, bidirectionalClimb)).toBe(FREE_RECEPTION_RUNG)
    expect(rungFor(both, bidirectionalClimb).direction).toBe('answer-to-prompt')
    expect(bidirectionalClimb?.directions['answer-to-prompt']?.attempts).toBeGreaterThan(0)
  })

  it('sends an error at the reception rung back down the same ladder', () => {
    const atReception = run(both, Array(8).fill(true))
    expect(rungIndexFor(both, atReception)).toBe(FREE_RECEPTION_RUNG)
    const slipped = answer(atReception, both, false)
    expect(rungIndexFor(both, slipped)).toBe(2)
    const recovering = answer(answer(slipped, both, true), both, true)
    expect(rungIndexFor(both, recovering)).toBe(FREE_PRODUCTION_RUNG)
  })

  it('records latency and lets it gate nothing', () => {
    const fast = run(forward, [true, true, true, true], () => 120)
    const slow = run(forward, [true, true, true, true], () => 45_000)
    expect(fast?.directions['prompt-to-answer']?.lastLatencyMs).toBe(120)
    expect(slow?.directions['prompt-to-answer']?.lastLatencyMs).toBe(45_000)
    expect(rungIndexFor(forward, fast)).toBe(rungIndexFor(forward, slow))
    expect(fast?.cue).toBe(slow?.cue)
  })

  it('keeps per-direction counters honest', () => {
    const evidence = run(both, [true, false, true, true, true, true])
    const observed = evidence?.directions['prompt-to-answer']
    expect(observed?.attempts).toBeGreaterThan(0)
    expect(observed!.correct).toBeLessThanOrEqual(observed!.attempts)
    expect(observed!.consecutiveCorrect).toBeLessThanOrEqual(observed!.correct)
  })

  it('marks acquisition and established stages at the right rungs', () => {
    expect(isInAcquisition(forward, undefined)).toBe(true)
    expect(isEstablished(forward, undefined)).toBe(false)
    const reduced = run(forward, [true, true, true, true])
    expect(isInAcquisition(forward, reduced)).toBe(false)
    expect(isEstablished(forward, reduced)).toBe(true)
  })
})

describe('cue state stays separate from retention state', () => {
  const topic: Topic = {
    id: 'morse',
    title: 'Morse',
    scope: 'A–Z printed patterns.',
    track: 'learning',
    items: [forward, both],
    status: 'drilled',
    createdAt: '2026-01-01T00:00:00.000Z',
    drilledAt: '2026-01-02T00:00:00.000Z',
    learningAt: '2026-01-01T00:00:00.000Z',
    completedAt: null,
    lastTestedAt: '2026-01-02T00:00:00.000Z',
    spotCheckedAt: null,
    history: [{ at: '2026-01-02T00:00:00.000Z', correct: 2, total: 2, resolvedTo: 'drilled' }],
    itemEvidence: {},
  }

  it('changes nothing but itemEvidence when cue state advances', () => {
    const advanced = withItemEvidence(topic, forward.id, run(forward, [true, true])!)
    const { itemEvidence: _before, ...restBefore } = topic
    const { itemEvidence: _after, ...restAfter } = advanced
    expect(restAfter).toEqual(restBefore)
    expect(advanced.itemEvidence?.[forward.id]?.cue).toBe('delayed-choice')
  })

  it('never advances, skips or resets a retention gap', () => {
    const climbed = withItemEvidence(topic, forward.id, run(forward, Array(20).fill(true))!)
    expect(climbed.status).toBe(topic.status)
    expect(climbed.drilledAt).toBe(topic.drilledAt)
    expect(climbed.completedAt).toBe(topic.completedAt)
    expect(climbed.lastTestedAt).toBe(topic.lastTestedAt)
    expect(climbed.spotCheckedAt).toBe(topic.spotCheckedAt)
    expect(climbed.history).toEqual(topic.history)
  })

  it('leaves the scheduler the sole authority over completion', () => {
    const bare = resolveAttempt(topic, 2, 2)
    const cued = resolveAttempt(withItemEvidence(topic, forward.id, run(forward, Array(20).fill(true))!), 2, 2)
    expect(cued.to).toBe(bare.to)
    expect(cued.completed).toBe(bare.completed)
    expect(cued.gapDays).toBe(bare.gapDays)
    const { itemEvidence: _plain, ...plainStudy } = resolveStudy({ ...topic, status: 'unstarted' })
    const { itemEvidence: _withCue, ...cuedStudy } = resolveStudy(
      withItemEvidence({ ...topic, status: 'unstarted' }, forward.id, { cue: 'free', directions: {} }),
    )
    expect(cuedStudy).toEqual(plainStudy)
  })

  it('is independently settable in both directions', () => {
    const cueOnly = withItemEvidence(topic, forward.id, { cue: 'free', directions: {} })
    expect(cueOnly.status).toBe('drilled')
    const retentionOnly = resolveAttempt(cueOnly, 2, 2).topic
    expect(retentionOnly.itemEvidence?.[forward.id]?.cue).toBe('free')
  })

  it('merges a session of cue evidence without disturbing existing entries', () => {
    const seeded = withItemEvidence(topic, forward.id, { cue: 'reduced', directions: {} })
    const merged = mergeItemEvidence(seeded, { [both.id]: { cue: 'free', directions: {} } })
    expect(merged.itemEvidence?.[forward.id]?.cue).toBe('reduced')
    expect(merged.itemEvidence?.[both.id]?.cue).toBe('free')
    expect(mergeItemEvidence(seeded, {})).toBe(seeded)
  })
})
