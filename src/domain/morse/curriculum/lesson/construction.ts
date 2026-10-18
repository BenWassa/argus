// Roster selection and construction of in-course and after-course lesson runs.
import type { AcquisitionCharacter } from '../../testing/acquisitionProfile'
import { hasLaterSittingSuccess, morseReviewOf, owesRepair, sittingsSinceSeen } from '../review'
import { byRetrievalPriority } from '../lessonPriority'
import { isConfusable } from '../../../study/confusion'
import { morsePattern, type MorseLetter } from '../../code'
import { ACQUISITION_ORDER, DEFAULT_PACKET_PLAN, type CharacterPacket } from '../packetOrder'
import type { Topic } from '../../../library/topic'
import type { ItemLessonStore, LessonSupport, MorseReviewProgress } from '../../progress'
import type { LessonEntry, LessonRun } from './support'
import { firstUnsettledPacket, lessonPackets, rosterIdentity } from './packets'

/**
 * Review characters for an ordinary novel-pair run. The packet still supplies
 * the canonical pair and its index; historical returns are no longer a general
 * learner selector. That plan kept reintroducing early letters simply because
 * they appeared in more future packets, even when later characters had equal
 * or greater current need.
 */
function ordinaryReviewRoster(
  byGlyph: Map<MorseLetter, AcquisitionCharacter>,
  store: ItemLessonStore,
  review: MorseReviewProgress,
  packet: CharacterPacket,
): MorseLetter[] {
  const novel = new Set(packet.novel)
  // Preserve a historical packet return that is still weak: it remains a
  // confusable-safe obligation. Settled historical returns must not keep
  // winning future slots merely because they appeared early in the plan.
  const required = packet.review.filter((glyph) => {
    const character = byGlyph.get(glyph)
    return character !== undefined && store[character.itemId] !== 'settled'
  })
  const candidates = ACQUISITION_ORDER.flatMap((glyph, order) => {
    const character = byGlyph.get(glyph)
    const support = character ? store[character.itemId] : undefined
    if (!character || support === undefined || novel.has(glyph) || required.includes(glyph)) return []
    // Once a character has survived a later sitting, it needs an actual gap
    // before it can take another ordinary review slot. Without this guard the
    // earliest settled pair keeps filling every later packet simply because it
    // is always eligible first. Weak items and items still awaiting their first
    // later-sitting success remain eligible immediately — and so does a
    // character carrying an unrepaired miss, which is the one case where the
    // learner's own history says "ask me this again soon" and a cooling-off
    // rule written for over-exposed early letters would say the opposite.
    if (
      support === 'settled' &&
      (review.items[character.itemId]?.printed ?? 0) > 0 &&
      hasLaterSittingSuccess(review, character.itemId) &&
      !owesRepair(review, character.itemId) &&
      sittingsSinceSeen(review, character.itemId) < 2
    ) {
      return []
    }
    return [{ glyph, support, itemId: character.itemId, order }]
  }).sort(byRetrievalPriority(review))

  const selected: MorseLetter[] = [...required]
  for (const candidate of candidates) {
    if (selected.length >= DEFAULT_PACKET_PLAN.visible - packet.novel.length) break
    if (packet.novel.concat(selected).some((other) => isConfusable(morsePattern(candidate.glyph), morsePattern(other)))) continue
    selected.push(candidate.glyph)
  }
  return selected
}

export interface StartLessonOptions {
  /**
   * Whether this run may introduce the next pair of novel characters.
   *
   * False for a continuation inside a sitting that has already had its pair
   * (#90 §3). The advertised shape of a sitting is two new letters; a packet
   * that settles at retrieval 6 used to roll straight into the next packet's
   * introductions, so a single sitting could quietly teach four letters or
   * more. A review-only run fills the remaining slots from everything the
   * learner has already met instead.
   */
  allowNovel?: boolean
}

/**
 * Build a review-only roster: no introductions, drawn from everything the
 * learner has already met, most urgent first (#90 §2, §3, §4).
 *
 * This is the "cumulative review" half of the novel budget, and it is also
 * what finally gives late characters somewhere to be reviewed. Under packet
 * rosters alone, eleven letters got no later review at all because review
 * material was chosen by packet position; here it is chosen by how much each
 * character actually needs it.
 */
function reviewRoster(
  byGlyph: Map<MorseLetter, AcquisitionCharacter>,
  store: ItemLessonStore,
  review: MorseReviewProgress,
  size: number,
): LessonEntry[] {
  const candidates = ACQUISITION_ORDER.flatMap((glyph, order) => {
    const character = byGlyph.get(glyph)
    if (!character) return []
    const support = store[character.itemId]
    // Only material the learner has actually met. A character with no stored
    // support has never been introduced and must not appear without one.
    if (support === undefined) return []
    return [{ itemId: character.itemId, glyph, character, support, order }]
  })

  return [...candidates]
    .sort(byRetrievalPriority(review))
    .slice(0, size)
    .map(({ glyph, character, support }, order) =>
      makeLessonEntry({ character, glyph, novel: false, support, introduced: true, order }),
    )
}

/**
 * An entry as a run starts, from the parts that actually differ between the
 * two rosters.
 *
 * The four run-state fields are the same for every entry in a fresh run —
 * nothing asked, nothing done, nothing held back, no last-asked time — and
 * saying so once means the review roster and the packet roster cannot start a
 * run in two different states. That is a real failure mode rather than a tidy
 * one: `notBefore` and `lastAskedAt` are exactly what the spacing rule reads.
 */
function makeLessonEntry({
  character,
  glyph,
  novel,
  support,
  introduced,
  order,
}: {
  character: AcquisitionCharacter
  glyph: MorseLetter
  novel: boolean
  support: LessonSupport
  introduced: boolean
  order: number
}): LessonEntry {
  return {
    itemId: character.itemId,
    glyph,
    pattern: character.pattern,
    novel,
    support,
    introduced,
    asked: false,
    done: false,
    notBefore: 0,
    lastAskedAt: null,
    order,
  }
}

/**
 * Letters the finished course still owes the learner, in acquisition order.
 *
 * Two kinds of debt, both about sittings and neither about time:
 *
 * - **not yet confirmed**: produced unaided, but never correctly in a sitting
 *   after the one that taught it. Readiness waits on every one of these, and
 *   the thirteen lessons cannot always supply one: Q and Y are taught in the
 *   last lesson, and the confusable-separation rule keeps B and Z (and, for a
 *   clean learner, C and J) out of the rosters that follow.
 * - **an unrepaired miss**: missed in print and not yet produced correctly in
 *   a later sitting.
 *
 * Once readiness is recorded only the second kind remains: readiness is
 * permanent, so confirmation is no longer owed.
 */
export function owedLetters(topic: Topic): MorseLetter[] {
  const byGlyph = rosterIdentity(topic)
  if (!byGlyph) return []
  const review = morseReviewOf(topic)
  return ACQUISITION_ORDER.filter((glyph) => {
    const character = byGlyph.get(glyph)
    if (!character || review.items[character.itemId] === undefined) return false
    const unconfirmed = !topic.acquisitionReadyAt && !hasLaterSittingSuccess(review, character.itemId)
    return unconfirmed || owesRepair(review, character.itemId)
  })
}

/**
 * A keyed review run after the thirteen lessons, over the letters the course
 * still owes (`owedLetters`), or `null` before the learner has met every
 * letter, or when nothing is owed.
 *
 * "Met every letter" rather than "every letter settled": a miss in one of
 * these runs rightly restores that letter's support, and the run that repairs
 * it must still be there afterwards.
 *
 * The owed letters lead, most urgent first; any room left in the roster goes
 * to the next most in need, so a run is never a single letter asked alone.
 * Unlike the in-course review, the confusable-separation rule does not apply:
 * that rule is exactly what left these letters stranded, and a roster of only
 * met, settled letters has no first meeting for it to protect.
 *
 * The caller must start it in a sitting after the one that owed the letter,
 * or a correct answer confirms nothing.
 */
export function startAfterCourse(topic: Topic): LessonRun | null {
  const byGlyph = rosterIdentity(topic)
  if (!byGlyph) return null
  const packets = lessonPackets()
  const store = topic.lessonProgress ?? {}
  if ([...byGlyph.values()].some((character) => store[character.itemId] === undefined)) return null

  const owed = new Set(owedLetters(topic))
  if (owed.size === 0) return null

  const review = morseReviewOf(topic)
  const priority = byRetrievalPriority(review)
  const met = ACQUISITION_ORDER.flatMap((glyph, order) => {
    const character = byGlyph.get(glyph)
    const support = character ? store[character.itemId] : undefined
    if (!character || support === undefined) return []
    return [{ itemId: character.itemId, glyph, character, support, order }]
  })
  const chosen = [
    ...met.filter((candidate) => owed.has(candidate.glyph)).sort(priority),
    ...met.filter((candidate) => !owed.has(candidate.glyph)).sort(priority),
  ].slice(0, DEFAULT_PACKET_PLAN.visible)

  return {
    topicId: topic.id,
    packetIndex: packets.length,
    packetCount: packets.length,
    step: 0,
    entries: chosen.map(({ glyph, character, support }, order) =>
      makeLessonEntry({ character, glyph, novel: false, support, introduced: true, order }),
    ),
    feedback: null,
    complete: false,
    finished: false,
    reviewOnly: true,
    afterCourse: true,
  }
}

/**
 * Build the lesson for a topic's current position, or `null` for a topic the
 * guided lesson does not drive.
 *
 * Takes a `Topic` and returns a `LessonRun`; it reads `lessonProgress` and
 * `morseReview` and nothing else about the learner, and it writes nothing at
 * all.
 */
export function startLesson(topic: Topic, options: StartLessonOptions = {}): LessonRun | null {
  const byGlyph = rosterIdentity(topic)
  if (!byGlyph) return null

  const packets = lessonPackets()
  const store = topic.lessonProgress ?? {}
  const packetIndex = firstUnsettledPacket(packets, byGlyph, store)

  if (options.allowNovel === false && packetIndex < packets.length) {
    const entries = reviewRoster(
      byGlyph,
      store,
      morseReviewOf(topic),
      DEFAULT_PACKET_PLAN.visible,
    )
    // Nothing met yet means nothing to review; the caller falls back rather
    // than mounting an empty run.
    if (entries.length === 0) return null
    return {
      topicId: topic.id,
      packetIndex,
      packetCount: packets.length,
      step: 0,
      entries,
      feedback: null,
      complete: false,
      finished: false,
      reviewOnly: true,
    }
  }

  if (packetIndex >= packets.length) {
    return {
      topicId: topic.id,
      packetIndex: packets.length,
      packetCount: packets.length,
      step: 0,
      entries: [],
      feedback: null,
      complete: true,
      finished: true,
    }
  }

  const packet = packets[packetIndex]
  const characters = [...packet.novel, ...ordinaryReviewRoster(byGlyph, store, morseReviewOf(topic), packet)]
  const entries: LessonEntry[] = characters.map((glyph, order) => {
    const character = byGlyph.get(glyph)
    // The roster is assembled from the packet plan and from `byGlyph`, which
    // come from two different places, so they can in principle disagree. That
    // is a construction fault rather than anything the learner did, and it has
    // to say which character went missing: without this the next line reads
    // `.itemId` off `undefined` and the run dies as an anonymous TypeError
    // several frames below where the mismatch actually is.
    if (!character) {
      throw new Error(
        `Morse lesson roster names ${glyph}, which this topic has no acquisition item for.`,
      )
    }
    const stored = store[character.itemId]
    return makeLessonEntry({
      character,
      glyph,
      novel: packet.novel.includes(glyph),
      support: stored ?? 'taught',
      // Anything with a stored support level has been through an introduction.
      // A returning character with no stored level can only come from an
      // edited or imported record; introduce it rather than assume.
      introduced: stored !== undefined,
      order,
    })
  })

  return {
    topicId: topic.id,
    packetIndex,
    packetCount: packets.length,
    step: 0,
    entries,
    feedback: null,
    complete: false,
    finished: false,
  }
}

