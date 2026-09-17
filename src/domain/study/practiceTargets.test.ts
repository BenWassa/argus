import { describe, expect, it } from 'vitest'
import {
  PRACTICE_LIMIT,
  hasPractice,
  missedTargets,
  practiceItemCount,
  practiceTargets,
  targetsForItems,
} from './practiceTargets'
import type {
  DirectionEvidence,
  IdentifiedItem,
  ItemDirection,
  ItemEvidenceStore,
  Topic,
} from '../../lib/types'

/**
 * Practice selects on durable evidence that already exists. Every test here
 * builds that evidence directly rather than by running a Test, because the
 * point under test is the reading, not the writing — and because the one thing
 * practice must never do is add a field of its own to read.
 */

const FORWARD: IdentifiedItem = { id: 'a', kind: 'forward', prompt: 'A', answer: '.-' }
const BOTH: IdentifiedItem = { id: 'b', kind: 'bidirectional', prompt: 'B', answer: '-...' }
const ALSO_BOTH: IdentifiedItem = { id: 'c', kind: 'bidirectional', prompt: 'C', answer: '-.-.' }

function direction(
  overrides: Partial<DirectionEvidence> = {},
): DirectionEvidence {
  return {
    attempts: 0,
    correct: 0,
    unassistedCorrect: 0,
    consecutiveCorrect: 0,
    lastAt: null,
    lastLatencyMs: null,
    ...overrides,
  }
}

/** A direction whose most recent answer was wrong. */
function missed(at: string): DirectionEvidence {
  return direction({ attempts: 3, correct: 2, consecutiveCorrect: 0, lastAt: at })
}

/** A direction whose most recent answer was right. */
function clean(at: string): DirectionEvidence {
  return direction({ attempts: 3, correct: 3, unassistedCorrect: 3, consecutiveCorrect: 3, lastAt: at })
}

function topicWith(items: IdentifiedItem[], itemEvidence: ItemEvidenceStore): Topic {
  return {
    id: 'topic',
    title: 'Topic',
    scope: 'A finite thing.',
    track: 'learning',
    items,
    status: 'drilled',
    createdAt: '2026-01-01T00:00:00.000Z',
    drilledAt: '2026-01-02T00:00:00.000Z',
    learningAt: '2026-01-01T00:00:00.000Z',
    completedAt: null,
    lastTestedAt: '2026-01-02T00:00:00.000Z',
    spotCheckedAt: null,
    history: [],
    itemEvidence,
  }
}

function names(topic: Topic): [string, ItemDirection][] {
  return practiceTargets(topic).map((target) => [target.item.id, target.direction])
}

describe('selecting what to practise', () => {
  it('selects a direction whose streak was broken', () => {
    const topic = topicWith([FORWARD], {
      a: { cue: 'rich', directions: { 'prompt-to-answer': missed('2026-02-01T00:00:00.000Z') } },
    })
    expect(missedTargets(topic).map((t) => t.item.id)).toEqual(['a'])
    expect(hasPractice(topic)).toBe(true)
  })

  it('does not select a direction whose most recent answer was right', () => {
    const topic = topicWith([FORWARD], {
      a: { cue: 'free', directions: { 'prompt-to-answer': clean('2026-02-01T00:00:00.000Z') } },
    })
    expect(missedTargets(topic)).toEqual([])
    expect(hasPractice(topic)).toBe(false)
  })

  /**
   * This is the "the next check is what re-earns it" rule, expressed as
   * selection rather than as policy. Practice writes nothing, so the only thing
   * that can retire a target is a later correct answer in a real check.
   */
  it('stops selecting an item once a later check answers it correctly', () => {
    const broken = topicWith([FORWARD], {
      a: { cue: 'rich', directions: { 'prompt-to-answer': missed('2026-02-01T00:00:00.000Z') } },
    })
    expect(hasPractice(broken)).toBe(true)

    const rebuilt = topicWith([FORWARD], {
      a: { cue: 'rich', directions: { 'prompt-to-answer': clean('2026-02-02T00:00:00.000Z') } },
    })
    expect(hasPractice(rebuilt)).toBe(false)
  })

  it('treats the two directions of a bidirectional item separately', () => {
    const topic = topicWith([BOTH], {
      b: {
        cue: 'rich',
        directions: {
          'prompt-to-answer': clean('2026-02-01T00:00:00.000Z'),
          'answer-to-prompt': missed('2026-02-01T00:00:00.000Z'),
        },
      },
    })
    expect(names(topic)).toEqual([['b', 'answer-to-prompt']])
  })

  it('never asks a direction a forward-only item does not have', () => {
    const topic = topicWith([FORWARD], {
      a: {
        cue: 'rich',
        directions: {
          'prompt-to-answer': missed('2026-02-01T00:00:00.000Z'),
          // Evidence for a direction this item's kind does not require. It can
          // exist in an imported library whose item kind was later narrowed.
          'answer-to-prompt': missed('2026-02-01T00:00:00.000Z'),
        },
      },
    })
    expect(names(topic)).toEqual([['a', 'prompt-to-answer']])
  })
})

describe('ordering', () => {
  it('puts the most recent miss first', () => {
    const topic = topicWith([FORWARD, BOTH], {
      a: { cue: 'rich', directions: { 'prompt-to-answer': missed('2026-02-01T00:00:00.000Z') } },
      b: {
        cue: 'rich',
        directions: {
          'prompt-to-answer': missed('2026-02-05T00:00:00.000Z'),
          'answer-to-prompt': clean('2026-02-05T00:00:00.000Z'),
        },
      },
    })
    expect(names(topic)).toEqual([
      ['b', 'prompt-to-answer'],
      ['a', 'prompt-to-answer'],
    ])
  })

  it('puts every real miss ahead of every untried direction', () => {
    const topic = topicWith([FORWARD, BOTH], {
      // `b` has never been tried in either direction; `a` was missed.
      a: { cue: 'rich', directions: { 'prompt-to-answer': missed('2026-02-01T00:00:00.000Z') } },
    })
    const targets = practiceTargets(topic)
    expect(targets[0]).toMatchObject({ item: { id: 'a' }, reason: 'missed' })
    expect(targets.slice(1).every((target) => target.reason === 'untried')).toBe(true)
  })

  it('is stable for a given library', () => {
    const topic = topicWith([FORWARD, BOTH, ALSO_BOTH], {
      a: { cue: 'rich', directions: { 'prompt-to-answer': missed('2026-02-01T00:00:00.000Z') } },
      b: { cue: 'rich', directions: { 'prompt-to-answer': missed('2026-02-01T00:00:00.000Z') } },
      c: { cue: 'rich', directions: { 'prompt-to-answer': missed('2026-02-01T00:00:00.000Z') } },
    })
    expect(names(topic)).toEqual(names(topic))
  })
})

describe('the bound on a run', () => {
  it('never asks more than the limit', () => {
    const items: IdentifiedItem[] = Array.from({ length: 30 }, (_, i) => ({
      id: `i${i}`,
      kind: 'bidirectional',
      prompt: `P${i}`,
      answer: `A${i}`,
    }))
    const evidence: ItemEvidenceStore = {}
    items.forEach((item, i) => {
      evidence[item.id] = {
        cue: 'rich',
        directions: {
          'prompt-to-answer': missed(`2026-02-${String((i % 27) + 1).padStart(2, '0')}T00:00:00.000Z`),
          'answer-to-prompt': missed(`2026-02-${String((i % 27) + 1).padStart(2, '0')}T00:00:00.000Z`),
        },
      }
    })
    expect(practiceTargets(topicWith(items, evidence))).toHaveLength(PRACTICE_LIMIT)
  })
})

describe('an explicitly named set', () => {
  it('asks every direction a named item requires', () => {
    const topic = topicWith([BOTH], {})
    expect(targetsForItems(topic, ['b']).map((t) => t.direction)).toEqual([
      'prompt-to-answer',
      'answer-to-prompt',
    ])
  })

  it('ignores ids the topic does not hold', () => {
    const topic = topicWith([FORWARD], {})
    expect(targetsForItems(topic, ['a', 'nope'])).toHaveLength(1)
  })

  it('skips a direction the learner already has clean', () => {
    const topic = topicWith([BOTH], {
      b: {
        cue: 'rich',
        directions: {
          'prompt-to-answer': clean('2026-02-01T00:00:00.000Z'),
          'answer-to-prompt': missed('2026-02-01T00:00:00.000Z'),
        },
      },
    })
    expect(targetsForItems(topic, ['b']).map((t) => t.direction)).toEqual(['answer-to-prompt'])
  })

  /**
   * The end screen's button counts what this returns, so a check that broke
   * badly cannot promise more work than the run will actually ask.
   */
  it('is bounded by the run limit even when the whole deck was missed', () => {
    const items: IdentifiedItem[] = Array.from({ length: 26 }, (_, i) => ({
      id: `i${i}`,
      kind: 'forward',
      prompt: `P${i}`,
      answer: `A${i}`,
    }))
    const all = items.map((item) => item.id)
    expect(targetsForItems(topicWith(items, {}), all)).toHaveLength(PRACTICE_LIMIT)
  })
})

describe('what the offer says', () => {
  it('counts a both-directions miss as one item to go and fix', () => {
    const topic = topicWith([BOTH], {
      b: {
        cue: 'rich',
        directions: {
          'prompt-to-answer': missed('2026-02-01T00:00:00.000Z'),
          'answer-to-prompt': missed('2026-02-01T00:00:00.000Z'),
        },
      },
    })
    expect(missedTargets(topic)).toHaveLength(2)
    expect(practiceItemCount(topic)).toBe(1)
  })

  /**
   * A topic that has simply never been tested has nothing to repair. Offering
   * repair there would describe absence of evidence as damage.
   */
  it('makes no offer on a topic that has never been tested', () => {
    const topic = topicWith([FORWARD, BOTH], {})
    expect(hasPractice(topic)).toBe(false)
    expect(practiceItemCount(topic)).toBe(0)
    // A run started anyway still has something useful to ask.
    expect(practiceTargets(topic).length).toBeGreaterThan(0)
  })
})

describe('libraries that are not pristine', () => {
  it('survives evidence with no lastAt', () => {
    const topic = topicWith([FORWARD], {
      a: {
        cue: 'rich',
        directions: { 'prompt-to-answer': direction({ attempts: 2, consecutiveCorrect: 0 }) },
      },
    })
    expect(hasPractice(topic)).toBe(true)
  })

  it('survives evidence with an unparseable lastAt', () => {
    const topic = topicWith([FORWARD], {
      a: {
        cue: 'rich',
        directions: {
          'prompt-to-answer': direction({ attempts: 2, consecutiveCorrect: 0, lastAt: 'not a date' }),
        },
      },
    })
    expect(hasPractice(topic)).toBe(true)
  })

  it('survives an item carrying no id', () => {
    const topic = topicWith([{ prompt: 'X', answer: 'Y' } as IdentifiedItem], {})
    expect(() => practiceTargets(topic)).not.toThrow()
    expect(hasPractice(topic)).toBe(false)
  })

  it('survives a topic with no itemEvidence at all', () => {
    const topic = topicWith([FORWARD], {})
    delete (topic as { itemEvidence?: unknown }).itemEvidence
    expect(() => practiceTargets(topic)).not.toThrow()
    expect(hasPractice(topic)).toBe(false)
  })
})
