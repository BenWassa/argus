import { describe, expect, it } from 'vitest'
import {
  PRIORITY_STALENESS_CAP,
  byRetrievalPriority,
  retrievalPriority,
  type PriorityCandidate,
} from './morseLessonPriority'
import {
  completeSitting,
  newMorseReview,
  recordIntroduced,
  recordListeningRetrieval,
  recordPrintedRetrieval,
} from './morseReview'
import type { MorseReviewProgress } from './types'

function candidate(
  itemId: string,
  support: PriorityCandidate['support'] = 'settled',
  order = 0,
): PriorityCandidate {
  return { itemId, support, order }
}

/**
 * Every named character introduced in sitting 1 and retrieved correctly in
 * sitting 2 — so they arrive consolidated, equally stale, and equally unheard.
 *
 * Building them together matters: consolidating them one at a time would leave
 * each introduced in a different sitting, and the staleness term would then
 * quietly decide the tests that are trying to isolate some other term.
 */
function consolidatedAll(...itemIds: string[]): MorseReviewProgress {
  let review = newMorseReview()
  for (const itemId of itemIds) review = recordIntroduced(review, itemId)
  review = completeSitting(review)
  for (const itemId of itemIds) review = recordPrintedRetrieval(review, itemId, true)
  return review
}

/** A single character, introduced and consolidated on its own. */
function consolidated(itemId: string, review = newMorseReview()): MorseReviewProgress {
  let next = recordIntroduced(review, itemId)
  next = completeSitting(next)
  return recordPrintedRetrieval(next, itemId, true)
}

describe('consolidation dominates', () => {
  it('ranks an unconsolidated character above a consolidated one, whatever their support', () => {
    // `weak` is settled but has never survived a gap; `strong` has.
    let review = recordIntroduced(newMorseReview(), 'weak')
    review = consolidated('strong', review)

    const order = [candidate('strong', 'taught', 0), candidate('weak', 'settled', 1)].sort(
      byRetrievalPriority(review),
    )
    expect(order[0].itemId).toBe('weak')
  })

  it('is the single largest term', () => {
    const review = consolidated('strong')
    const unconsolidated = retrievalPriority(candidate('never-seen'), review)
    const scaffolded = retrievalPriority(candidate('strong', 'taught'), review)
    expect(unconsolidated).toBeGreaterThan(scaffolded)
  })
})

describe('support urgency', () => {
  it('ranks weaker scaffolding first among equally consolidated characters', () => {
    const review = consolidatedAll('a', 'b', 'c')

    const order = [
      candidate('a', 'settled', 0),
      candidate('b', 'taught', 1),
      candidate('c', 'solo', 2),
    ].sort(byRetrievalPriority(review))

    expect(order.map((entry) => entry.itemId)).toEqual(['b', 'c', 'a'])
  })
})

describe('staleness', () => {
  it('raises a character that has not been retrieved for several sittings', () => {
    let review = consolidated('fresh')
    review = consolidated('stale', review)
    // Two more sittings pass; only `fresh` is retrieved in them.
    review = completeSitting(review)
    review = recordPrintedRetrieval(review, 'fresh', true)
    review = completeSitting(review)
    review = recordPrintedRetrieval(review, 'fresh', true)

    const order = [candidate('fresh', 'settled', 0), candidate('stale', 'settled', 1)].sort(
      byRetrievalPriority(review),
    )
    expect(order[0].itemId).toBe('stale')
  })

  /**
   * Capped so a character untouched for a very long time cannot outrank one
   * that is actively weak. Staleness is a nudge, not a claim about memory.
   */
  it('is capped, so it never overtakes weak scaffolding', () => {
    // `ancient` is settled and has gone untouched for far longer than the cap;
    // `recent` is consolidated, retrieved this very sitting, but still taught.
    let review = consolidatedAll('ancient', 'recent')
    for (let i = 0; i < PRIORITY_STALENESS_CAP + 10; i += 1) review = completeSitting(review)
    review = recordPrintedRetrieval(review, 'recent', true)

    const order = [candidate('ancient', 'settled', 0), candidate('recent', 'taught', 1)].sort(
      byRetrievalPriority(review),
    )
    expect(order[0].itemId).toBe('recent')
  })
})

describe('listening is the smallest term', () => {
  it('breaks a tie towards the character never met in sound', () => {
    let review = consolidatedAll('heard', 'unheard')
    review = recordListeningRetrieval(review, 'heard', true)

    const order = [candidate('heard', 'settled', 0), candidate('unheard', 'settled', 1)].sort(
      byRetrievalPriority(review),
    )
    expect(order[0].itemId).toBe('unheard')
  })

  it('never outweighs a support rung', () => {
    let review = consolidatedAll('unheard', 'scaffolded')
    review = recordListeningRetrieval(review, 'scaffolded', true)

    const order = [
      candidate('unheard', 'settled', 0),
      candidate('scaffolded', 'solo', 1),
    ].sort(byRetrievalPriority(review))
    expect(order[0].itemId).toBe('scaffolded')
  })
})

describe('determinism', () => {
  it('breaks ties by acquisition order', () => {
    let review = consolidatedAll('first', 'second')
    review = recordListeningRetrieval(review, 'first', true)
    review = recordListeningRetrieval(review, 'second', true)

    const order = [candidate('second', 'settled', 5), candidate('first', 'settled', 1)].sort(
      byRetrievalPriority(review),
    )
    expect(order.map((entry) => entry.itemId)).toEqual(['first', 'second'])
  })

  it('produces the same order every time for the same history', () => {
    const review = consolidatedAll('a', 'b')
    const pool = [candidate('a', 'cued', 0), candidate('b', 'solo', 1)]
    const once = [...pool].sort(byRetrievalPriority(review)).map((entry) => entry.itemId)
    const twice = [...pool].sort(byRetrievalPriority(review)).map((entry) => entry.itemId)
    expect(once).toEqual(twice)
  })

  /**
   * The order is not a fixed sequence taught to the learner: answering moves
   * the very terms it is computed from, so the same pool reorders as history
   * accumulates.
   */
  it('changes as the learner answers', () => {
    let review = recordIntroduced(newMorseReview(), 'a')
    review = recordIntroduced(review, 'b')
    const pool = [candidate('a', 'settled', 0), candidate('b', 'settled', 1)]

    const before = [...pool].sort(byRetrievalPriority(review))[0].itemId
    review = completeSitting(review)
    review = recordPrintedRetrieval(review, before, true)
    const after = [...pool].sort(byRetrievalPriority(review))[0].itemId

    expect(after).not.toBe(before)
  })
})
