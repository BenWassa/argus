import { describe, expect, it } from 'vitest'
import { morseAcquisitionPosition } from './curriculum/lesson'
import {
  completeSitting,
  newMorseReview,
  recordIntroduced,
  recordPrintedRetrieval,
  withMorseReview,
} from './curriculum/review'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'
import { seedLibrary } from '../library/catalogSeed'
import { ALL_MORSE_LETTERS } from './curriculum/packetOrder'
import type { Topic } from '../library/topic'
import type { ItemLessonStore, MorseReviewProgress } from './progress'

/** Historical review evidence survives without retaining the old repeat gate. */

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

describe('one pass replaces mandatory consolidation', () => {
  it('completes the lessons even when nobody has a later-sitting success', () => {
    const topic = allSettled(morseTopic())
    const position = morseAcquisitionPosition(withMorseReview(topic, introducedAll(topic)))
    expect(position?.settled).toBe(26)
    expect(position?.awaitingConsolidation).toEqual([])
    expect(position?.ready).toBe(true)
  })

  it('does not require a second sitting for Q, J or any other letter', () => {
    const topic = allSettled(morseTopic())
    const review = consolidateAll(topic, introducedAll(topic))
    review.items[itemIdFor(topic, 'Q')].laterCorrect = 0
    review.items[itemIdFor(topic, 'J')].laterCorrect = 0
    expect(morseAcquisitionPosition(withMorseReview(topic, review))?.ready).toBe(true)
  })

  it('does not learn from introductions alone', () => {
    const topic = morseTopic()
    expect(morseAcquisitionPosition(withMorseReview(topic, introducedAll(topic)))?.ready).toBe(false)
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

    expect(position?.awaitingConsolidation).toEqual([])
    expect(position?.ready).toBe(true)
  })
})
