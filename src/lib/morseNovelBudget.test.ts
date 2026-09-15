import { describe, expect, it } from 'vitest'
import { lessonPackets, startLesson } from './morseLesson'
import {
  completeSitting,
  newMorseReview,
  recordIntroduced,
  recordPrintedRetrieval,
  withMorseReview,
} from './morseReview'
import { parseLibrary } from './storage'
import { seedLibrary } from './seed'
import { DEFAULT_PACKET_PLAN } from './morseOrder'
import type { ItemLessonStore, Topic } from './types'

/**
 * #90 §3: a sitting introduces at most one novel pair.
 *
 * The measured baseline in the issue found the first sitting teaching four
 * letters — `E I T A` — because a packet settling before retrieval 10 rolled
 * straight into the next packet's introductions. The fix is not a counter bolted
 * onto the surface; it is that a continuation inside the same sitting asks for a
 * run that cannot introduce anything, and fills its roster from everything the
 * learner has already met instead.
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

/** Settle exactly the characters of the first `count` packets. */
function settleThroughPacket(topic: Topic, count: number): Topic {
  const lessonProgress: ItemLessonStore = {}
  for (const packet of lessonPackets().slice(0, count)) {
    for (const glyph of packet.characters) lessonProgress[itemIdFor(topic, glyph)] = 'settled'
  }
  return { ...topic, lessonProgress }
}

describe('a continuation inside a sitting introduces nothing', () => {
  it('returns a run whose entries are all returning material', () => {
    const topic = settleThroughPacket(morseTopic(), 1)
    const run = startLesson(topic, { allowNovel: false })

    expect(run).not.toBeNull()
    expect(run?.reviewOnly).toBe(true)
    expect(run?.entries.every((entry) => !entry.novel)).toBe(true)
    expect(run?.entries.every((entry) => entry.introduced)).toBe(true)
  })

  it('draws only from characters the learner has actually met', () => {
    const topic = settleThroughPacket(morseTopic(), 1)
    const met = new Set(lessonPackets()[0].characters)
    const run = startLesson(topic, { allowNovel: false })

    for (const entry of run?.entries ?? []) expect(met.has(entry.glyph)).toBe(true)
  })

  it('still introduces the pair when novel material is allowed', () => {
    const topic = settleThroughPacket(morseTopic(), 1)
    const run = startLesson(topic)

    expect(run?.reviewOnly).toBeUndefined()
    expect(run?.entries.filter((entry) => entry.novel)).toHaveLength(
      DEFAULT_PACKET_PLAN.novel,
    )
  })

  /**
   * The very first sitting has met nothing, so there is nothing to review. The
   * caller falls back rather than mounting an empty run.
   */
  it('returns null when the learner has met nothing at all', () => {
    expect(startLesson(morseTopic(), { allowNovel: false })).toBeNull()
  })

  it('is capped at the roster size, however much has been met', () => {
    const topic = settleThroughPacket(morseTopic(), 6)
    const run = startLesson(topic, { allowNovel: false })
    expect(run?.entries.length).toBeLessThanOrEqual(DEFAULT_PACKET_PLAN.visible)
  })
})

describe('the review roster is chosen by need, not by packet position', () => {
  /**
   * The baseline's central complaint: eleven letters received no later review at
   * all, because review material was drawn from packet position. Priority is
   * computed from each character's own history instead, so the ones that have
   * never survived a gap come first regardless of where they sit in the order.
   */
  it('puts unconsolidated characters ahead of consolidated ones', () => {
    const base = settleThroughPacket(morseTopic(), 3)
    const met = lessonPackets().slice(0, 3).flatMap((packet) => packet.characters)
    const [first, second, ...rest] = [...new Set(met)]

    // Everything is consolidated except the first two, which were introduced
    // but have never succeeded in a later sitting.
    let review = newMorseReview()
    for (const glyph of [first, second, ...rest]) {
      review = recordIntroduced(review, itemIdFor(base, glyph))
    }
    review = completeSitting(review)
    for (const glyph of rest) {
      review = recordPrintedRetrieval(review, itemIdFor(base, glyph), true)
    }

    const run = startLesson(withMorseReview(base, review), { allowNovel: false })
    const chosen = (run?.entries ?? []).map((entry) => entry.glyph)

    expect(chosen).toContain(first)
    expect(chosen).toContain(second)
  })

  it('is deterministic for a given history', () => {
    const topic = settleThroughPacket(morseTopic(), 4)
    const once = startLesson(topic, { allowNovel: false })?.entries.map((entry) => entry.glyph)
    const twice = startLesson(topic, { allowNovel: false })?.entries.map((entry) => entry.glyph)
    expect(once).toEqual(twice)
  })

  it('reaches late characters once they have been met', () => {
    // Settle everything but the final packet, then ask for review. The pool is
    // every character met so far, so the late ones are as eligible as the
    // early ones — which under packet rosters alone they never were.
    const packets = lessonPackets()
    const topic = settleThroughPacket(morseTopic(), packets.length - 1)
    const late = new Set(packets[packets.length - 2].characters)
    const run = startLesson(topic, { allowNovel: false })

    expect(run?.entries.length).toBeGreaterThan(0)
    // The most recently settled characters have had the least review, so at
    // least one of them earns a place.
    expect((run?.entries ?? []).some((entry) => late.has(entry.glyph))).toBe(true)
  })

  /**
   * A finished programme has no unsettled packet to continue, so there is no
   * continuation to build. The lesson surface is already showing its finished
   * state by then.
   */
  it('leaves a finished programme finished', () => {
    const topic = settleThroughPacket(morseTopic(), lessonPackets().length)
    const run = startLesson(topic, { allowNovel: false })
    expect(run?.finished).toBe(true)
    expect(run?.entries).toEqual([])
  })
})
