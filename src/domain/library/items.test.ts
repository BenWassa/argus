import { describe, expect, it } from 'vitest'
import {
  hasCompleteDirectionalCoverage,
  hasCompleteTopicDirectionalCoverage,
  pruneItemEvidence,
  reconcileAuthoredItems,
  requiredDirections,
  retentionCorrectCount,
} from './items'
import type { AttemptAnswer } from './items'
import type { IdentifiedItem } from './topic'
import type { ItemCueEvidence } from '../study/evidence'

const existing: IdentifiedItem[] = [
  { id: 'item-a', kind: 'forward', prompt: 'A', answer: '.-' },
  { id: 'item-b', kind: 'bidirectional', prompt: 'B', answer: '-...' },
  { id: 'item-c', kind: 'forward', prompt: 'C', answer: '-.-.' },
]

describe('plain-text authoring identity preservation', () => {
  it('preserves ids and semantics across reorder, insertion and deletion', () => {
    let next = 0
    const reconciled = reconcileAuthoredItems(
      existing,
      [
        { prompt: 'C', answer: '-.-.' },
        { prompt: 'D', answer: '-..' },
        { prompt: 'B', answer: '-...' },
      ],
      () => `new-${++next}`,
    )

    expect(reconciled).toEqual([
      { id: 'item-c', kind: 'forward', prompt: 'C', answer: '-.-.' },
      { id: 'new-1', kind: 'forward', prompt: 'D', answer: '-..' },
      { id: 'item-b', kind: 'bidirectional', prompt: 'B', answer: '-...' },
    ])
  })

  it('preserves identity when one side is edited and the other remains unique', () => {
    const promptFix = reconcileAuthoredItems(
      existing,
      [{ prompt: 'Bravo', answer: '-...' }],
      () => 'new',
    )
    expect(promptFix[0].id).toBe('item-b')
    expect(promptFix[0].kind).toBe('bidirectional')

    const answerFix = reconcileAuthoredItems(
      existing,
      [{ prompt: 'B', answer: 'dash dit dit dit' }],
      () => 'new',
    )
    expect(answerFix[0].id).toBe('item-b')
    expect(answerFix[0].kind).toBe('bidirectional')
  })

  it('does not guess identity when a new row has no unique match', () => {
    const reconciled = reconcileAuthoredItems(
      existing,
      [{ prompt: 'New prompt', answer: 'New answer' }],
      () => 'new-id',
    )
    expect(reconciled[0]).toEqual({
      id: 'new-id',
      kind: 'forward',
      prompt: 'New prompt',
      answer: 'New answer',
    })
  })

  it('prunes evidence for deleted items without moving evidence onto reordered items', () => {
    const pruned = pruneItemEvidence(
      {
        'item-a': { cue: 'rich', directions: {} },
        'item-b': { cue: 'reduced', directions: {} },
        orphan: { cue: 'free', directions: {} },
      },
      [existing[1], existing[0]],
    )
    expect(Object.keys(pruned).sort()).toEqual(['item-a', 'item-b'])
    expect(pruned['item-b'].cue).toBe('reduced')
  })
})

describe('typed directional coverage', () => {
  const forward: ItemCueEvidence = {
    cue: 'reduced',
    directions: {
      'prompt-to-answer': {
        attempts: 1,
        correct: 1,
        unassistedCorrect: 1,
        consecutiveCorrect: 1,
        lastAt: '2026-09-03T00:00:00.000Z',
        lastLatencyMs: 800,
      },
    },
  }

  it('represents A–Z as 26 logical bidirectional scoring units, not 52 duplicated cards', () => {
    const alphabet: IdentifiedItem[] = Array.from({ length: 26 }, (_, index) => ({
      id: `letter-${String.fromCharCode(65 + index).toLowerCase()}`,
      kind: 'bidirectional',
      prompt: String.fromCharCode(65 + index),
      answer: `pattern-${index}`,
    }))

    expect(alphabet).toHaveLength(26)
    expect(alphabet.every((item) => requiredDirections(item).length === 2)).toBe(true)
    expect(alphabet.flatMap(requiredDirections)).toHaveLength(52)
  })

  it('requires one direction for a forward item', () => {
    expect(requiredDirections(existing[0])).toEqual(['prompt-to-answer'])
    expect(hasCompleteDirectionalCoverage(existing[0], forward)).toBe(true)
  })

  it('makes partial bidirectional coverage mechanically incomplete', () => {
    expect(requiredDirections(existing[1])).toEqual(['prompt-to-answer', 'answer-to-prompt'])
    expect(hasCompleteDirectionalCoverage(existing[1], forward)).toBe(false)
  })

  it('reports bidirectional coverage only after evidence exists in both directions', () => {
    const both: ItemCueEvidence = {
      ...forward,
      directions: {
        ...forward.directions,
        'answer-to-prompt': {
          attempts: 2,
          correct: 1,
          unassistedCorrect: 1,
          consecutiveCorrect: 1,
          lastAt: '2026-09-03T00:01:00.000Z',
          lastLatencyMs: 1200,
        },
      },
    }
    expect(hasCompleteDirectionalCoverage(existing[1], both)).toBe(true)
    expect(hasCompleteTopicDirectionalCoverage([existing[1]], { 'item-b': both })).toBe(true)
    expect(hasCompleteTopicDirectionalCoverage([existing[1]], { 'item-b': forward })).toBe(false)
    expect(retentionCorrectCount([existing[1]], { 'item-b': forward }, 1)).toBe(0)

    // #68: a bidirectional topic also has to say how this run asked each unit.
    // Complete coverage on its own is a fact about the learner's history, not
    // about the attempt in front of it.
    const run: AttemptAnswer[] = [
      { itemId: 'item-b', direction: 'answer-to-prompt', correct: true, assisted: false },
    ]
    expect(retentionCorrectCount([existing[1]], { 'item-b': both }, 1, run)).toBe(1)
    expect(retentionCorrectCount([existing[1]], { 'item-b': both }, 1, [])).toBe(0)
    expect(
      retentionCorrectCount([existing[1]], { 'item-b': both }, 1, [{ ...run[0], assisted: true }]),
    ).toBe(0)

    // A forward-only topic never enters this gate, with or without a run.
    expect(retentionCorrectCount([existing[0]], undefined, 1)).toBe(1)
  })
})

describe('visual-choice items in plain-text authoring (#146)', () => {
  const visual: IdentifiedItem = {
    id: 'item-v',
    kind: 'forward',
    prompt: 'Which cardinal?',
    answer: 'East',
    choice: { options: ['North', 'East'] },
    stimulus: { source: { kind: 'figure', figure: { kind: 'angle-dial', pointers: [{ bearing: 90 }] } }, alt: 'A dial.' },
  }

  it('keeps the choice and picture across a prompt edit or a reorder', () => {
    const edited = reconcileAuthoredItems([visual], [{ prompt: 'Which way?', answer: 'East' }], () => 'new')
    expect(edited[0]).toEqual({ ...visual, prompt: 'Which way?' })
  })

  it('turns the item back into a plain reveal item if its answer leaves the options', () => {
    const edited = reconcileAuthoredItems([visual], [{ prompt: 'Which cardinal?', answer: 'Due east' }], () => 'new')
    expect(edited[0]).toEqual({ id: 'item-v', kind: 'forward', prompt: 'Which cardinal?', answer: 'Due east' })
  })

  it('keeps an edited answer that is still one of the options', () => {
    const edited = reconcileAuthoredItems([visual], [{ prompt: 'Which cardinal?', answer: 'North' }], () => 'new')
    expect(edited[0].choice).toEqual(visual.choice)
    expect(edited[0].answer).toBe('North')
  })
})

describe('audio items in plain-text authoring (#151)', () => {
  const heard: IdentifiedItem = {
    id: 'item-a',
    kind: 'forward',
    prompt: 'Copy what you hear',
    answer: 'A12',
    audio: { assetId: 'a1', src: '/media/audio/a1.mp3', transcript: 'Alfa WUN TOO', drill: 'token-copy' },
    response: { mode: 'copy', normalizer: 'compact' },
  }

  it('keeps the recording and response across a prompt edit', () => {
    const edited = reconcileAuthoredItems([heard], [{ prompt: 'Write it down', answer: 'A12' }], () => 'new')
    expect(edited[0]).toEqual({ ...heard, prompt: 'Write it down' })
  })

  it('detaches the item from its recording if its answer is edited, since the pairing is authoritative', () => {
    const edited = reconcileAuthoredItems([heard], [{ prompt: 'Copy what you hear', answer: 'A13' }], () => 'new')
    expect(edited[0]).toEqual({ id: 'item-a', kind: 'forward', prompt: 'Copy what you hear', answer: 'A13' })
  })

  it('keeps an audio choice item only while its answer is unchanged', () => {
    const choice: IdentifiedItem = {
      ...heard,
      answer: 'Message received',
      response: undefined,
      choice: { options: ['Message received', 'Repeat your message'] },
    }
    const { response: _r, ...withoutResponse } = choice
    const kept = reconcileAuthoredItems([withoutResponse], [{ prompt: 'p2', answer: 'Message received' }], () => 'n')
    expect(kept[0].audio).toBeDefined()
    expect(kept[0].choice).toBeDefined()
    // Even another of its options is not allowed: the recording says one thing.
    const swapped = reconcileAuthoredItems([withoutResponse], [{ prompt: 'p2', answer: 'Repeat your message' }], () => 'n')
    expect(swapped[0].audio).toBeUndefined()
    expect(swapped[0].choice).toBeUndefined()
  })
})
