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
  recordPrintedRetrieval,
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
