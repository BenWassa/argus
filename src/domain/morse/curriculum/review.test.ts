import { describe, expect, it } from 'vitest'
import {
  LATER_SITTING_SUCCESSES,
  completeSitting,
  currentSitting,
  hasLaterSittingSuccess,
  hasListeningCoverage,
  morseReviewIsFresh,
  morseReviewOf,
  newMorseReview,
  pruneMorseReview,
  recordIntroduced,
  recordListeningRetrieval,
  owesRepair,
  recordPrintedRetrieval,
  sittingsSinceMissed,
  sittingsSinceSeen,
  withMorseReview,
  withoutMorseReview,
} from './review'
import type { Topic } from '../../library/topic'
import type { MorseReviewProgress } from '../progress'

function topicWith(morseReview?: MorseReviewProgress): Topic {
  return {
    id: 'morse',
    title: 'Morse',
    scope: 'A–Z printed patterns.',
    track: 'learning',
    items: [{ id: 'a', kind: 'bidirectional', prompt: 'A', answer: '.-' }],
    status: 'learning',
    createdAt: '2026-01-01T00:00:00.000Z',
    drilledAt: null,
    learningAt: '2026-01-01T00:00:00.000Z',
    completedAt: null,
    lastTestedAt: null,
    spotCheckedAt: null,
    history: [],
    ...(morseReview ? { morseReview } : {}),
  }
}

describe('sitting ordinals', () => {
  it('counts the sitting in progress as one past the completed ones', () => {
    const review = newMorseReview()
    expect(currentSitting(review)).toBe(1)
    expect(currentSitting(completeSitting(review))).toBe(2)
  })

  /**
   * Counting completions rather than starts is what stops an abandoned sitting
   * from inflating the ordinal and satisfying "a later sitting" for work the
   * learner never came back to.
   */
  it('does not advance merely because retrievals happened', () => {
    let review = recordIntroduced(newMorseReview(), 'a')
    review = recordPrintedRetrieval(review, 'a', true)
    expect(currentSitting(review)).toBe(1)
  })
})

describe('introduction', () => {
  it('records the sitting an item was first met in', () => {
    const review = recordIntroduced(newMorseReview(), 'a')
    expect(review.items.a).toMatchObject({ introducedIn: 1, lastSeenIn: 1, laterCorrect: 0 })
  })

  /**
   * Re-introducing after a lapse must not reset the clock, or the later-sitting
   * requirement would restart every time support was restored and a learner who
   * repeatedly misses one character would never finish.
   */
  it('is idempotent across a later sitting', () => {
    let review = recordIntroduced(newMorseReview(), 'a')
    review = completeSitting(review)
    review = recordIntroduced(review, 'a')
    expect(review.items.a.introducedIn).toBe(1)
  })
})

describe('later-sitting success', () => {
  it('does not count a correct answer in the introducing sitting', () => {
    let review = recordIntroduced(newMorseReview(), 'a')
    review = recordPrintedRetrieval(review, 'a', true)
    review = recordPrintedRetrieval(review, 'a', true)
    expect(review.items.a.laterCorrect).toBe(0)
    expect(hasLaterSittingSuccess(review, 'a')).toBe(false)
  })

  it('counts a correct answer in a later sitting', () => {
    let review = recordIntroduced(newMorseReview(), 'a')
    review = completeSitting(review)
    review = recordPrintedRetrieval(review, 'a', true)
    expect(review.items.a.laterCorrect).toBe(LATER_SITTING_SUCCESSES)
    expect(hasLaterSittingSuccess(review, 'a')).toBe(true)
  })

  it('does not count a miss in a later sitting', () => {
    let review = recordIntroduced(newMorseReview(), 'a')
    review = completeSitting(review)
    review = recordPrintedRetrieval(review, 'a', false)
    expect(hasLaterSittingSuccess(review, 'a')).toBe(false)
    // The retrieval still happened, so staleness resets.
    expect(review.items.a.lastSeenIn).toBe(2)
  })

  it('reports nothing for an item it has never seen', () => {
    expect(hasLaterSittingSuccess(newMorseReview(), 'ghost')).toBe(false)
  })
})

describe('listening counters stay separate from printed ones', () => {
  it('never lets a listening answer satisfy the printed claim', () => {
    let review = recordIntroduced(newMorseReview(), 'a')
    review = completeSitting(review)
    review = recordListeningRetrieval(review, 'a', true)
    expect(review.items.a.heard).toBe(1)
    expect(review.items.a.heardCorrect).toBe(1)
    expect(review.items.a.laterCorrect).toBe(0)
    expect(hasLaterSittingSuccess(review, 'a')).toBe(false)
  })

  it('does not let listening reset printed staleness', () => {
    let review = recordIntroduced(newMorseReview(), 'a')
    review = completeSitting(review)
    review = recordListeningRetrieval(review, 'a', true)
    expect(review.items.a.lastSeenIn).toBe(1)
    expect(sittingsSinceSeen(review, 'a')).toBe(1)
  })

  it('counts a miss towards coverage, because the character was still met', () => {
    let review = recordIntroduced(newMorseReview(), 'a')
    review = recordListeningRetrieval(review, 'a', false)
    expect(hasListeningCoverage(review, 'a')).toBe(true)
    expect(review.items.a.heardCorrect).toBe(0)
  })
})

describe('staleness', () => {
  it('treats an unseen item as maximally stale', () => {
    expect(sittingsSinceSeen(newMorseReview(), 'ghost')).toBe(Number.MAX_SAFE_INTEGER)
  })

  it('grows with each sitting that does not retrieve the item', () => {
    let review = recordIntroduced(newMorseReview(), 'a')
    expect(sittingsSinceSeen(review, 'a')).toBe(0)
    review = completeSitting(completeSitting(review))
    expect(sittingsSinceSeen(review, 'a')).toBe(2)
  })
})

describe('persistence', () => {
  it('writes an empty history as no field at all', () => {
    const topic = withMorseReview(topicWith(), newMorseReview())
    expect(topic.morseReview).toBeUndefined()
    expect(morseReviewIsFresh(morseReviewOf(topic))).toBe(true)
  })

  it('round-trips a real history', () => {
    const review = recordPrintedRetrieval(recordIntroduced(newMorseReview(), 'a'), 'a', true)
    const topic = withMorseReview(topicWith(), review)
    expect(morseReviewOf(topic)).toEqual(review)
  })

  it('leaves every other field alone', () => {
    const before = topicWith()
    const after = withMorseReview(before, recordIntroduced(newMorseReview(), 'a'))
    const { morseReview: _dropped, ...rest } = after
    expect(rest).toEqual(before)
  })

  it('removes the field on request', () => {
    const topic = withMorseReview(topicWith(), recordIntroduced(newMorseReview(), 'a'))
    expect(withoutMorseReview(topic).morseReview).toBeUndefined()
  })

  /**
   * A record written before this field existed reads as no history, never as
   * back-filled successes. `acquisitionReadyAt` is what keeps an already
   * finished learner finished.
   */
  it('reads a legacy topic as having no history rather than inventing one', () => {
    const review = morseReviewOf(topicWith())
    expect(review).toEqual({ sittings: 0, items: {} })
    expect(hasLaterSittingSuccess(review, 'a')).toBe(false)
  })
})

describe('pruning deleted items', () => {
  it('drops records for items the topic no longer has', () => {
    let review = recordIntroduced(newMorseReview(), 'a')
    review = recordIntroduced(review, 'gone')
    review = completeSitting(review)
    const pruned = pruneMorseReview(review, [{ id: 'a' }])
    expect(Object.keys(pruned?.items ?? {})).toEqual(['a'])
  })

  it('keeps the sitting count, because those sittings happened', () => {
    let review = recordIntroduced(newMorseReview(), 'gone')
    review = completeSitting(completeSitting(review))
    expect(pruneMorseReview(review, [{ id: 'a' }])?.sittings).toBe(2)
  })

  it('collapses to no field when nothing is left', () => {
    const review = recordIntroduced(newMorseReview(), 'gone')
    expect(pruneMorseReview(review, [{ id: 'a' }])).toBeUndefined()
  })

  it('survives an absent record', () => {
    expect(pruneMorseReview(undefined, [{ id: 'a' }])).toBeUndefined()
  })
})


/**
 * The repair debt (the targeted-review fix).
 *
 * Until this existed, a miss left no durable trace once its support level came
 * back up, so review selection genuinely could not tell a learner who had
 * struggled with `Q` from one who had never got it wrong — both were handed the
 * same rosters by staleness and acquisition order alone.
 */
describe('a printed miss becomes a standing obligation', () => {
  function introducedIn(sitting: number): MorseReviewProgress {
    let review = newMorseReview()
    for (let closed = 1; closed < sitting; closed += 1) review = completeSitting(review)
    return recordIntroduced(review, 'a')
  }

  it('owes nothing until something is actually missed', () => {
    const review = recordPrintedRetrieval(introducedIn(1), 'a', true)
    expect(owesRepair(review, 'a')).toBe(false)
    expect(sittingsSinceMissed(review, 'a')).toBeNull()
  })

  it('opens on a miss, stamped with the sitting it happened in', () => {
    const review = recordPrintedRetrieval(introducedIn(1), 'a', false)
    expect(owesRepair(review, 'a')).toBe(true)
    expect(review.items.a.missedIn).toBe(1)
    expect(sittingsSinceMissed(review, 'a')).toBe(0)
  })

  /**
   * The whole reason the debt is an ordinal rather than a flag. The lesson
   * re-asks a missed character a couple of steps later in the same sitting,
   * with the correction it just showed still fresh — copying that back is not
   * evidence the character survived anything.
   */
  it('is not cleared by the immediate in-sitting confirmation', () => {
    let review = recordPrintedRetrieval(introducedIn(1), 'a', false)
    review = recordPrintedRetrieval(review, 'a', true)
    expect(owesRepair(review, 'a')).toBe(true)
    expect(review.items.a.missedIn).toBe(1)
  })

  it('clears on a correct retrieval in a later sitting', () => {
    let review = recordPrintedRetrieval(introducedIn(1), 'a', false)
    review = recordPrintedRetrieval(review, 'a', true)
    review = completeSitting(review)
    expect(sittingsSinceMissed(review, 'a')).toBe(1)

    review = recordPrintedRetrieval(review, 'a', true)
    expect(owesRepair(review, 'a')).toBe(false)
    expect(sittingsSinceMissed(review, 'a')).toBeNull()
  })

  it('moves forward rather than accumulating when the same character is missed again', () => {
    let review = recordPrintedRetrieval(introducedIn(1), 'a', false)
    review = completeSitting(review)
    review = recordPrintedRetrieval(review, 'a', false)
    expect(review.items.a.missedIn).toBe(2)
    expect(sittingsSinceMissed(review, 'a')).toBe(0)
  })

  /**
   * A repaired character has to serialise exactly like one that was never
   * missed, or an export would carry two representations of "owes nothing" and
   * the storage boundary would see an undefined value.
   */
  it('leaves no key behind once it is repaired', () => {
    let review = recordPrintedRetrieval(introducedIn(1), 'a', false)
    review = completeSitting(review)
    review = recordPrintedRetrieval(review, 'a', true)
    expect('missedIn' in review.items.a).toBe(false)
    expect(JSON.parse(JSON.stringify(review))).toEqual(review)
  })

  it('makes no claim about a character placement established independently', () => {
    const topic = topicWith()
    const review = morseReviewOf({ ...topic, lessonProgress: { a: 'settled' } })
    expect(owesRepair(review, 'a')).toBe(false)
    expect(sittingsSinceMissed(review, 'a')).toBeNull()
  })

  it('reads a record written before the debt existed as owing nothing', () => {
    const legacy: MorseReviewProgress = {
      sittings: 3,
      items: { a: { introducedIn: 1, lastSeenIn: 3, laterCorrect: 1, printed: 4, heard: 1, heardCorrect: 1 } },
    }
    expect(owesRepair(legacy, 'a')).toBe(false)
  })

  it('a listening answer neither opens nor clears it', () => {
    let review = recordPrintedRetrieval(introducedIn(1), 'a', false)
    review = completeSitting(review)
    review = recordListeningRetrieval(review, 'a', true)
    expect(owesRepair(review, 'a')).toBe(true)

    let clean = recordPrintedRetrieval(introducedIn(1), 'a', true)
    clean = recordListeningRetrieval(clean, 'a', false)
    expect(owesRepair(clean, 'a')).toBe(false)
  })
})
