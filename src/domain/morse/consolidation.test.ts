import { describe, expect, it } from 'vitest'
import { morseAcquisitionPosition } from './curriculum/lesson'
import { completeSitting, newMorseReview, recordIntroduced, recordPrintedRetrieval, withMorseReview } from './curriculum/review'
import { parseLibrary } from '../../lib/storage'
import { seedLibrary } from '../../lib/seed'
import { ALL_MORSE_LETTERS } from './curriculum/packetOrder'
import type { ItemLessonStore, MorseReviewProgress, Topic } from '../../lib/types'

/**
 * #90 §4: settling every character is necessary but not sufficient for
 * acquisition readiness. A character produced unaided inside the very sitting
 * that taught it has not survived any gap, and surviving a gap is the whole
 * difference between "I can do this now" and "I know this".
 *
 * The risk this file exists to pin down is the other half: the new gate must
 * not drag a learner who is *already* finished back into acquisition. Two
 * things stop it. `acquisitionReadyAt` is permanent, and a record written
 * before the review history existed has no entries to be held to.
 */

function morseTopic(): Topic {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  const topic = parsed.library.topics.find((t) => t.id === 'international-morse-letters-printed')
  if (!topic) throw new Error('The seeded Morse topic is missing.')
  return topic
}

function itemIdFor(topic: Topic, glyph: string): string {
  const item = topic.items.find((candidate) => candidate.prompt === glyph)
  if (!item?.id) throw new Error(`No scored item for ${glyph}`)
  return item.id
}

/** Every character settled: the state the old policy called ready. */
function allSettled(topic: Topic): Topic {
  const lessonProgress: ItemLessonStore = {}
  for (const glyph of ALL_MORSE_LETTERS) lessonProgress[itemIdFor(topic, glyph)] = 'settled'
  return { ...topic, lessonProgress }
}

/** A review history in which every character was introduced in sitting 1. */
function introducedAll(topic: Topic): MorseReviewProgress {
  let review = newMorseReview()
  for (const glyph of ALL_MORSE_LETTERS) review = recordIntroduced(review, itemIdFor(topic, glyph))
  return review
}

function consolidateAll(topic: Topic, review: MorseReviewProgress): MorseReviewProgress {
  let next = completeSitting(review)
  for (const glyph of ALL_MORSE_LETTERS) {
    next = recordPrintedRetrieval(next, itemIdFor(topic, glyph), true)
  }
  return next
}

describe('consolidation gates acquisition readiness', () => {
  it('withholds readiness while characters have only ever been right in their own sitting', () => {
    const topic = allSettled(morseTopic())
    const withReview = withMorseReview(topic, introducedAll(topic))
    const position = morseAcquisitionPosition(withReview)

    expect(position?.settled).toBe(26)
    expect(position?.awaitingConsolidation).toHaveLength(26)
    expect(position?.ready).toBe(false)
  })

  it('grants readiness once every character has survived a later sitting', () => {
    const topic = allSettled(morseTopic())
    const review = consolidateAll(topic, introducedAll(topic))
    const position = morseAcquisitionPosition(withMorseReview(topic, review))

    expect(position?.awaitingConsolidation).toEqual([])
    expect(position?.ready).toBe(true)
  })

  it('names exactly the characters still outstanding', () => {
    const topic = allSettled(morseTopic())
    let review = consolidateAll(topic, introducedAll(topic))
    // Q and J are re-introduced late and have no later-sitting success yet.
    review = {
      ...review,
      items: {
        ...review.items,
        [itemIdFor(topic, 'Q')]: { ...review.items[itemIdFor(topic, 'Q')], laterCorrect: 0 },
        [itemIdFor(topic, 'J')]: { ...review.items[itemIdFor(topic, 'J')], laterCorrect: 0 },
      },
    }
    const position = morseAcquisitionPosition(withMorseReview(topic, review))

    expect(new Set(position?.awaitingConsolidation)).toEqual(new Set(['Q', 'J']))
    expect(position?.ready).toBe(false)
  })

  it('still withholds readiness when a packet is unsettled, review history or not', () => {
    const topic = morseTopic()
    const position = morseAcquisitionPosition(withMorseReview(topic, introducedAll(topic)))
    expect(position?.ready).toBe(false)
  })
})

describe('the gate never drags a finished learner backwards', () => {
  /**
   * The migration's central promise. A learner whose record predates the review
   * history has no entries, so there is nothing to hold them to — and they are
   * not credited with successes they never earned either, because the counters
   * simply do not exist.
   */
  it('leaves a legacy settled learner ready with no review history at all', () => {
    const position = morseAcquisitionPosition(allSettled(morseTopic()))
    expect(position?.awaitingConsolidation).toEqual([])
    expect(position?.ready).toBe(true)
  })

  it('keeps a learner past acquisitionReadyAt ready even mid-consolidation', () => {
    const topic = allSettled(morseTopic())
    const withReview = withMorseReview(topic, introducedAll(topic))
    const alreadyReady: Topic = { ...withReview, acquisitionReadyAt: '2026-02-01T00:00:00.000Z' }

    const position = morseAcquisitionPosition(alreadyReady)
    expect(position?.awaitingConsolidation).toEqual([])
    expect(position?.ready).toBe(true)
  })

  /**
   * A learner who was mid-programme when the history arrived accrues records
   * only for what they meet from then on. Characters they settled earlier carry
   * no record and are not blocked, which is conservative in the only direction
   * that is safe: it can delay nothing the learner already did.
   */
  it('holds only the characters the history actually knows about', () => {
    const topic = allSettled(morseTopic())
    let review = newMorseReview()
    review = recordIntroduced(review, itemIdFor(topic, 'Q'))
    const position = morseAcquisitionPosition(withMorseReview(topic, review))

    expect(position?.awaitingConsolidation).toEqual(['Q'])
    expect(position?.ready).toBe(false)
  })
})
