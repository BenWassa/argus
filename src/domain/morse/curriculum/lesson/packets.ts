// Packet identity, introduced material and durable acquisition position.
import { morseAcquisitionProfile, type AcquisitionCharacter } from '../../testing/acquisitionProfile'
import { hasLaterSittingSuccess, morseReviewOf } from '../review'
import type { MorseLetter } from '../../code'
import { ACQUISITION_ORDER, ALL_MORSE_LETTERS, buildCharacterPackets, type CharacterPacket } from '../packetOrder'
import type { Topic } from '../../../library/topic'
import type { ItemLessonStore } from '../../progress'

/** Which character each scored item maps to, for a topic the lesson can drive. */
export function rosterIdentity(topic: Topic): Map<MorseLetter, AcquisitionCharacter> | null {
  const profile = morseAcquisitionProfile(topic)
  if (!profile) return null
  const byGlyph = new Map<MorseLetter, AcquisitionCharacter>()
  for (const character of profile.values()) {
    byGlyph.set(character.glyph as MorseLetter, character)
  }
  // The lesson walks the whole A–Z programme, so it can only drive a topic that
  // actually scores all 26 mappings. A narrower canonical deck keeps the plain
  // reading sheet rather than being handed a lesson it cannot finish.
  return byGlyph.size === ALL_MORSE_LETTERS.length ? byGlyph : null
}

let packetPlan: CharacterPacket[] | null = null

/**
 * The packet plan. Derived once: `buildCharacterPackets()` is a pure function of
 * the frozen A–Z alphabet and takes no arguments, and the journey layer asks for
 * the programme's position on every render of Today, Library and Progress.
 */
export function lessonPackets(): CharacterPacket[] {
  if (!packetPlan) packetPlan = buildCharacterPackets()
  return packetPlan
}

/**
 * Where the learner stands in the whole progressive acquisition programme, or
 * `null` for a topic the guided lesson does not drive.
 *
 * This is the acquisition dimension as the shared journey layer needs it (#67):
 * derived from durable `lessonProgress` and nothing else, cheap enough to call
 * per topic per render, and carrying no scheduler, evidence or sitting state.
 * `startLesson` answers a different question — what to put on screen next — and
 * builds a whole run to do it.
 */
export interface MorseAcquisitionPosition {
  /** Roster characters the lesson has stopped scaffolding. */
  settled: number
  /** Characters in the programme. 26 for the shipped A–Z topic. */
  total: number
  /** 1-based packet position. Equals `packetCount` once the programme settles. */
  packet: number
  packetCount: number
  /** True once the learner has met any of it. */
  started: boolean
  /** True once every character has been produced unaided at least once. */
  ready: boolean
  /**
   * Characters still owing a correct retrieval in a sitting later than the one
   * that introduced them (#90 §4). Empty for a learner with no review history,
   * which is what every record written before that history existed looks like.
   */
  awaitingConsolidation: MorseLetter[]
  /** True once every letter has been met, whether or not all are settled. */
  metAll: boolean
}

export function morseAcquisitionPosition(topic: Topic): MorseAcquisitionPosition | null {
  const byGlyph = rosterIdentity(topic)
  if (!byGlyph) return null

  const packets = lessonPackets()
  const store = topic.lessonProgress ?? {}
  const supports = [...byGlyph.values()].map((character) => store[character.itemId])

  const packetIndex = firstUnsettledPacket(packets, byGlyph, store)
  const settledEverything = packetIndex >= packets.length

  /**
   * #90 §4: settling every character is necessary but not sufficient. A
   * character the learner produced unaided inside the sitting that taught it
   * has not yet survived any gap, and surviving a gap is the whole difference
   * between "I can do this now" and "I know this".
   *
   * Only characters the review history actually knows about are held to it. A
   * record written before that history existed has no entries at all, so it
   * reports nothing outstanding and a learner mid-programme on the old policy
   * is neither blocked nor credited with successes they never earned. The
   * permanence of `acquisitionReadyAt` covers anyone already past the line.
   */
  const review = morseReviewOf(topic)
  const awaitingConsolidation = topic.acquisitionReadyAt
    ? []
    : [...byGlyph.entries()]
        .filter(
          ([, character]) =>
            review.items[character.itemId] !== undefined &&
            !hasLaterSittingSuccess(review, character.itemId),
        )
        .map(([glyph]) => glyph)

  return {
    settled: supports.filter((support) => support === 'settled').length,
    total: byGlyph.size,
    packet: Math.min(packetIndex + 1, packets.length),
    packetCount: packets.length,
    started: supports.some((support) => support !== undefined),
    ready: settledEverything && awaitingConsolidation.length === 0,
    awaitingConsolidation,
    metAll: supports.every((support) => support !== undefined),
  }
}

/**
 * The first packet the learner has not fully settled — the whole of the
 * lesson's durable position. An unsettled historical return remains an
 * obligation, while settled material is selected by current review need.
 * Returns `packets.length` when every packet obligation is settled.
 */
export function firstUnsettledPacket(
  packets: CharacterPacket[],
  byGlyph: Map<MorseLetter, AcquisitionCharacter>,
  store: ItemLessonStore,
): number {
  for (const packet of packets) {
    const settled = packet.characters.every((glyph) => {
      const character = byGlyph.get(glyph)
      return character ? store[character.itemId] === 'settled' : false
    })
    if (!settled) return packet.index
  }
  return packets.length
}

/**
 * Every character introduced anywhere in the topic so far, oldest first.
 *
 * A packet's own roster is deliberately small (novel plus a handful of
 * interleaved review characters, capped at `visible`), so it is the wrong pool
 * for a reinforcement question to draw distractors from once the learner is
 * several packets in: by packet 5 there may be ten characters genuinely known,
 * while the packet's own roster still only touches three or four of them. This
 * is that wider pool, for callers that want variety proportional to what has
 * actually been learned rather than to which handful of letters this packet's
 * roster happens to contain.
 */
export function introducedGlyphs(topic: Topic): MorseLetter[] {
  const byGlyph = rosterIdentity(topic)
  if (!byGlyph) return []
  const store = topic.lessonProgress ?? {}
  return ACQUISITION_ORDER.filter((glyph) => {
    const character = byGlyph.get(glyph)
    return character !== undefined && store[character.itemId] !== undefined
  })
}

