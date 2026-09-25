import { describe, expect, it } from 'vitest'
import { cueNoteFor } from './cueNote'
import {
  emptyCueEvidence,
  isAssistedRung,
  recordAnswer,
  rungFor,
  rungIndexFor,
} from '../../domain/study/cueLadder'
import type { Item } from '../../domain/library/topic'
import type { ItemCueEvidence } from '../../domain/study/evidence'

const BIDIRECTIONAL: Item = {
  id: 'letter-a',
  kind: 'bidirectional',
  prompt: 'A',
  answer: '.-',
}

/**
 * Drive the real ladder rather than hand-building cue states, so the note is
 * always asserted against evidence the app could genuinely hold. A literal
 * `ItemCueEvidence` would let this file drift away from `recordAnswer`'s rules
 * while still passing.
 */
function answer(evidence: ItemCueEvidence | undefined, correct: boolean): ItemCueEvidence {
  const rung = rungFor(BIDIRECTIONAL, evidence)
  return recordAnswer(evidence, {
    direction: rung.direction,
    correct,
    assisted: isAssistedRung(rung),
    latencyMs: null,
    at: '2026-09-06T12:00:00.000Z',
  })
}

describe('the ladder reports what it is about to do', () => {
  it('says nothing when the next answer moves no rung either way', () => {
    // One clean answer from a standing start is not yet a fade: the streak has
    // to reach two, so neither outcome moves the ladder from here.
    const note = cueNoteFor(BIDIRECTIONAL, emptyCueEvidence())
    expect(note.onCorrect).toBeNull()
  })

  it('warns that the cue comes off when the next correct answer would fade it', () => {
    const afterOne = answer(emptyCueEvidence(), true)
    const note = cueNoteFor(BIDIRECTIONAL, afterOne)

    expect(note.onCorrect).toBe('Two clean in a row, so the cue comes off the next ask.')
  })

  it('warns that the cue returns when the next miss would restore it', () => {
    // Climb until support has actually been withdrawn, so there is something
    // for a miss to give back.
    let evidence = emptyCueEvidence()
    for (let i = 0; i < 4; i += 1) evidence = answer(evidence, true)

    const note = cueNoteFor(BIDIRECTIONAL, evidence)
    expect(note.onIncorrect).toBe('The cue comes back on the next ask.')
  })

  it('promises no returning cue once the alphabet is acquired, because none returns', () => {
    const uncued: ItemCueEvidence = { cue: 'free', directions: {} }
    expect(cueNoteFor(BIDIRECTIONAL, uncued, 'free').onIncorrect).toBeNull()
    const afterOne = answer(uncued, true)
    expect(cueNoteFor(BIDIRECTIONAL, afterOne, 'free').onIncorrect).toBeNull()
  })

  it('names the reverse direction opening as its own event', () => {
    // Walk the ladder until a correct answer is what opens the other
    // direction, then assert the note fires exactly there.
    let evidence: ItemCueEvidence = emptyCueEvidence()
    let found: string | null = null

    for (let i = 0; i < 12; i += 1) {
      const before = rungFor(BIDIRECTIONAL, evidence)
      const note = cueNoteFor(BIDIRECTIONAL, evidence)
      const next = answer(evidence, true)
      const opens = rungFor(BIDIRECTIONAL, next).direction !== before.direction

      if (opens && note.onCorrect) {
        found = note.onCorrect
        break
      }
      evidence = next
    }

    expect(found).toBe('Forward recall holds on its own, so the reverse direction opens next.')
  })
})

describe('the prediction matches what actually gets recorded', () => {
  /**
   * The note's whole claim is that it describes the real ladder. If the
   * predicted move and the recorded move ever disagreed, the card would be
   * announcing something that does not then happen.
   */
  it('agrees with the rung the recorded answer really produces', () => {
    let evidence: ItemCueEvidence = emptyCueEvidence()

    for (let i = 0; i < 10; i += 1) {
      const correct = i % 3 !== 2
      const note = cueNoteFor(BIDIRECTIONAL, evidence)
      const beforeIndex = rungIndexFor(BIDIRECTIONAL, evidence)

      evidence = answer(evidence, correct)
      const afterIndex = rungIndexFor(BIDIRECTIONAL, evidence)

      const predicted = correct ? note.onCorrect : note.onIncorrect
      expect(predicted === null).toBe(beforeIndex === afterIndex)
    }
  })

  it('reports independently for the two outcomes of the same card', () => {
    const afterOne = answer(emptyCueEvidence(), true)
    const note = cueNoteFor(BIDIRECTIONAL, afterOne)

    // A correct answer fades the cue from here; a miss at this point does not
    // move the rung, because the cue is already at its most supportive.
    expect(note.onCorrect).not.toBeNull()
    expect(note.onIncorrect).toBeNull()
  })
})
