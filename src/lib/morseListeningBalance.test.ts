import { describe, expect, it } from 'vitest'
import {
  LISTENING_RETRIEVAL_INTERVAL,
  chooseListeningTarget,
  isListeningSlot,
  listeningNeed,
  newLessonListeningState,
  suppressListening,
} from './morseLessonListening'
import {
  newMorseReview,
  recordIntroduced,
  recordListeningRetrieval,
} from './morseReview'
import type { LessonEntry } from './morseLesson'
import type { MorseLetter } from './morse'
import type { MorseReviewProgress } from './types'

/**
 * #90 §5: listening is selected by need, not by whichever character the printed
 * queue happened to offer on the third slot.
 *
 * The measured baseline landed 51 listening questions on a repeating subset
 * while other letters were never heard once — not because the cadence was
 * wrong, but because the cadence was the *only* selector. The cadence is
 * unchanged here; what changed is that the slot now goes to whoever needs it.
 */

function entry(glyph: MorseLetter, order: number, support: LessonEntry['support'] = 'solo'): LessonEntry {
  return {
    itemId: `item-${glyph}`,
    glyph,
    pattern: '.-',
    novel: false,
    support,
    introduced: true,
    asked: true,
    done: false,
    notBefore: 0,
    lastAskedAt: null,
    order,
  }
}

function introduced(...glyphs: MorseLetter[]): MorseReviewProgress {
  let review = newMorseReview()
  for (const glyph of glyphs) review = recordIntroduced(review, `item-${glyph}`)
  return review
}

const state = newLessonListeningState()

describe('the cadence is unchanged', () => {
  it('offers listening on every third retrieval slot', () => {
    expect(isListeningSlot(LISTENING_RETRIEVAL_INTERVAL - 1)).toBe(true)
    expect(isListeningSlot(0)).toBe(false)
    expect(isListeningSlot(1)).toBe(false)
  })

  it('asks nothing on a slot the cadence does not offer', () => {
    expect(chooseListeningTarget(0, [entry('E', 0)], state, introduced('E'))).toBeNull()
  })
})

describe('coverage comes first', () => {
  it('asks a character never met in sound ahead of one already heard', () => {
    let review = introduced('E', 'T')
    review = recordListeningRetrieval(review, 'item-E', true)

    const chosen = chooseListeningTarget(2, [entry('E', 0), entry('T', 1)], state, review)
    expect(chosen?.glyph).toBe('T')
  })

  it('outranks every other term', () => {
    let review = introduced('E', 'T')
    // `E` has been heard twice and got both wrong; `T` has never been heard.
    review = recordListeningRetrieval(review, 'item-E', false)
    review = recordListeningRetrieval(review, 'item-E', false)

    expect(listeningNeed('item-T', review)).toBeGreaterThan(listeningNeed('item-E', review))
  })
})

describe('balance among covered characters', () => {
  it('asks the character heard fewest times', () => {
    let review = introduced('E', 'T', 'A')
    review = recordListeningRetrieval(review, 'item-E', true)
    review = recordListeningRetrieval(review, 'item-E', true)
    review = recordListeningRetrieval(review, 'item-T', true)
    review = recordListeningRetrieval(review, 'item-A', true)
    review = recordListeningRetrieval(review, 'item-A', true)

    const chosen = chooseListeningTarget(2, [entry('E', 0), entry('T', 1), entry('A', 2)], state, review)
    expect(chosen?.glyph).toBe('T')
  })

  /**
   * A miss raises that character's future listening priority, as §5 asks —
   * but only as a tie-break among equally-heard characters, so it cannot
   * monopolise the cadence.
   */
  it('prefers a character whose last listening answer was wrong, all else equal', () => {
    let review = introduced('E', 'T')
    review = recordListeningRetrieval(review, 'item-E', true)
    review = recordListeningRetrieval(review, 'item-T', false)

    const chosen = chooseListeningTarget(2, [entry('E', 0), entry('T', 1)], state, review)
    expect(chosen?.glyph).toBe('T')
  })

  it('does not let a struggling character outrank an uncovered one', () => {
    let review = introduced('E', 'T')
    for (let i = 0; i < 5; i += 1) review = recordListeningRetrieval(review, 'item-E', false)

    const chosen = chooseListeningTarget(2, [entry('E', 0), entry('T', 1)], state, review)
    expect(chosen?.glyph).toBe('T')
  })
})

describe('eligibility still holds', () => {
  it('asks nothing while the learner has declined listening', () => {
    const declined = suppressListening(state)
    expect(chooseListeningTarget(2, [entry('E', 0)], declined, introduced('E'))).toBeNull()
  })

  it('never asks a character still being taught', () => {
    const review = introduced('E', 'T')
    const chosen = chooseListeningTarget(
      2,
      [entry('E', 0, 'taught'), entry('T', 1)],
      state,
      review,
    )
    expect(chosen?.glyph).toBe('T')
  })

  it('never flips modality straight back onto the character just answered', () => {
    const review = introduced('E', 'T')
    const justAnswered = { ...state, previousItemId: 'item-E' }
    const chosen = chooseListeningTarget(2, [entry('E', 0), entry('T', 1)], justAnswered, review)
    expect(chosen?.glyph).toBe('T')
  })

  /**
   * Nothing eligible yields the slot back to the visual path rather than losing
   * the coverage: need is recomputed from durable state on every slot, so the
   * character still gets its turn on the next one.
   */
  it('yields the slot when nothing is eligible', () => {
    const review = introduced('E')
    expect(chooseListeningTarget(2, [entry('E', 0, 'taught')], state, review)).toBeNull()
    expect(chooseListeningTarget(2, [], state, review)).toBeNull()
  })
})

describe('determinism', () => {
  it('breaks ties by roster order', () => {
    const review = introduced('E', 'T')
    const chosen = chooseListeningTarget(2, [entry('T', 1), entry('E', 0)], state, review)
    expect(chosen?.glyph).toBe('E')
  })

  it('returns the same target for the same history', () => {
    const review = introduced('E', 'T', 'A')
    const roster = [entry('E', 0), entry('T', 1), entry('A', 2)]
    const once = chooseListeningTarget(2, roster, state, review)?.glyph
    const twice = chooseListeningTarget(2, roster, state, review)?.glyph
    expect(once).toBe(twice)
  })

  /**
   * The whole point: the target moves as coverage accumulates, so a sitting
   * spreads listening across the roster instead of revisiting one letter.
   */
  it('moves on once a character has been covered', () => {
    let review = introduced('E', 'T', 'A')
    const roster = [entry('E', 0), entry('T', 1), entry('A', 2)]

    const seen: (MorseLetter | undefined)[] = []
    for (let i = 0; i < 3; i += 1) {
      const chosen = chooseListeningTarget(2, roster, state, review)
      seen.push(chosen?.glyph)
      if (chosen) review = recordListeningRetrieval(review, chosen.itemId, true)
    }

    expect(new Set(seen).size).toBe(3)
  })
})
