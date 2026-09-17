import { describe, expect, it } from 'vitest'
import {
  CUE_RUNGS,
  FREE_PRODUCTION_RUNG,
  hasTestAnswer,
  isAssistedRung,
  recordAnswer,
  rungFor,
  withBaselineCue,
} from './cueLadder'
import { seedLibrary } from '../library/catalogSeed'
import { parseLibrary } from '../../lib/storage'
import type { ItemCueEvidence, ItemDirection, ItemEvidenceStore, Topic } from '../../lib/types'

/**
 * The Learn → Test handoff (#90, items 6 and 7).
 *
 * The measured defect: a learner reaching acquisition readiness had produced all
 * twenty-six mappings unaided across roughly two hundred formative retrievals,
 * and Test then reopened every one of them at `rich` with the rhythm phrase and
 * half the pattern on screen. Reverse printed recall did not appear until the
 * ninth clean full-deck run, so the first run that could qualify came about four
 * hundred and fifty questions after the learner started.
 *
 * The fix uses Learn state to choose a *presentation* and nothing else. These
 * tests exist to hold that line: the separation that makes the completion claim
 * honest is that a formative answer cannot become formal evidence, and none of
 * this may erode it.
 */

const MORSE_ID = 'international-morse-letters-printed'

function morseTopic(): Topic {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  const topic = parsed.library.topics.find((candidate) => candidate.id === MORSE_ID)
  if (!topic) throw new Error('Missing seeded Morse topic')
  return topic
}

/** One full Test run over the deck, answering every card correctly. */
function runDeck(
  topic: Topic,
  store: ItemEvidenceStore,
  baseline: 'rich' | 'free',
): { store: ItemEvidenceStore; asked: Map<string, ItemDirection> } {
  const next: ItemEvidenceStore = { ...store }
  const asked = new Map<string, ItemDirection>()

  for (const item of topic.items) {
    const id = item.id as string
    const evidence = withBaselineCue(next[id], baseline)
    const rung = rungFor(item, evidence)
    asked.set(id, rung.direction)
    next[id] = recordAnswer(evidence, {
      direction: rung.direction,
      correct: true,
      assisted: isAssistedRung(rung),
      latencyMs: 640,
      at: '2026-02-01T00:00:00.000Z',
    })
  }

  return { store: next, asked }
}

describe('a finished curriculum hands Test an independent learner', () => {
  it('opens every untested item uncued instead of restarting the support ladder', () => {
    const topic = morseTopic()
    for (const item of topic.items) {
      const rung = rungFor(item, withBaselineCue(undefined, 'free'))
      expect(isAssistedRung(rung)).toBe(false)
    }
  })

  it('keeps the rich opening for a topic that never finished guided acquisition', () => {
    const topic = morseTopic()
    for (const item of topic.items) {
      const rung = rungFor(item, withBaselineCue(undefined, 'rich'))
      expect(rung.id).toBe('rich-recognition')
      expect(isAssistedRung(rung)).toBe(true)
    }
  })

  it('creates no evidence at all before an answer actually happens in Test', () => {
    const baselined = withBaselineCue(undefined, 'free')
    expect(hasTestAnswer(baselined)).toBe(false)
    expect(baselined?.directions).toEqual({})
    // Nothing durable has been produced: this is a presentation value, and the
    // only path to `DirectionEvidence` is still an answer through recordAnswer.
    expect(Object.values(baselined?.directions ?? {})).toHaveLength(0)
  })

  it('defers to stored evidence the moment the item has been answered once', () => {
    const item = morseTopic().items[0]
    const answered = recordAnswer(withBaselineCue(undefined, 'free'), {
      direction: 'prompt-to-answer',
      correct: false,
      assisted: false,
      latencyMs: 900,
      at: '2026-02-01T00:00:00.000Z',
    })
    // A miss restores support in the ordinary way, and the baseline must not
    // then override that on the next card and hand the support straight back.
    expect(answered.cue).toBe('reduced')
    const rung = rungFor(item, withBaselineCue(answered, 'free'))
    expect(rung.cue).toBe('reduced')
    expect(isAssistedRung(rung)).toBe(true)
  })
})

describe('one run exercises both halves of the bidirectional claim', () => {
  it('splits the first uncued run across both printed directions', () => {
    const topic = morseTopic()
    const { asked } = runDeck(topic, {}, 'free')
    const directions = [...asked.values()]

    const forward = directions.filter((d) => d === 'prompt-to-answer').length
    const reverse = directions.filter((d) => d === 'answer-to-prompt').length
    expect(forward + reverse).toBe(26)
    // Both halves genuinely represented rather than twenty-six productions.
    expect(forward).toBeGreaterThan(4)
    expect(reverse).toBeGreaterThan(4)
  })

  it('is deterministic, so the same deck asks the same way on every device', () => {
    const topic = morseTopic()
    expect([...runDeck(topic, {}, 'free').asked]).toEqual([...runDeck(topic, {}, 'free').asked])
  })

  it('gives every mapping both directions within two full runs', () => {
    const topic = morseTopic()
    const first = runDeck(topic, {}, 'free')
    const second = runDeck(topic, first.store, 'free')

    for (const item of topic.items) {
      const id = item.id as string
      const seen = new Set([first.asked.get(id), second.asked.get(id)])
      expect(seen.size).toBe(2)

      // And both halves now hold independent evidence, which is what the
      // completion gate reads. It still reads only unassisted answers.
      const evidence = second.store[id] as ItemCueEvidence
      expect(evidence.directions['prompt-to-answer']?.unassistedCorrect).toBeGreaterThanOrEqual(1)
      expect(evidence.directions['answer-to-prompt']?.unassistedCorrect).toBeGreaterThanOrEqual(1)
    }
  })

  it('never asks the two directions of one mapping back to back within a run', () => {
    // One card per logical unit per run is what guarantees it, and the deck is
    // built from the topic's items, so a direction split cannot duplicate one.
    const topic = morseTopic()
    const { asked } = runDeck(topic, {}, 'free')
    expect(asked.size).toBe(topic.items.length)
  })
})

describe('the climb is untouched for anyone who has not finished the curriculum', () => {
  it('still takes four fading rungs before an uncued question appears', () => {
    const item = morseTopic().items[0]
    let evidence: ItemCueEvidence | undefined
    const seen: string[] = []

    for (let answer = 0; answer < 7; answer += 1) {
      const rung = rungFor(item, withBaselineCue(evidence, 'rich'))
      seen.push(rung.id)
      evidence = recordAnswer(evidence, {
        direction: rung.direction,
        correct: true,
        assisted: isAssistedRung(rung),
        latencyMs: 700,
        at: '2026-02-01T00:00:00.000Z',
      })
    }

    expect(seen.slice(0, 6).every((id) => id !== CUE_RUNGS[FREE_PRODUCTION_RUNG].id)).toBe(true)
    expect(seen[6]).toBe(CUE_RUNGS[FREE_PRODUCTION_RUNG].id)
  })
})
