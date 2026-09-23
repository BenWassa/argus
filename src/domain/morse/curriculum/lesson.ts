import { morseAcquisitionProfile, type AcquisitionCharacter } from '../testing/acquisitionProfile'
import { hasLaterSittingSuccess, morseReviewOf, owesRepair, sittingsSinceSeen } from './review'
import { byRetrievalPriority } from './lessonPriority'
import { isConfusable } from '../../study/confusion'
import { MORSE_LETTERS, morsePattern, type MorseLetter } from '../code'
import {
  ACQUISITION_ORDER,
  ALL_MORSE_LETTERS,
  DEFAULT_PACKET_PLAN,
  buildCharacterPackets,
  complexityOrderedLetters,
  type CharacterPacket,
} from './packetOrder'
import type { Topic } from '../../library/topic'
import {
  LESSON_SUPPORTS,
  type ItemLessonStore,
  type LessonSupport,
  type MorseReviewProgress,
} from '../progress'

/**
 * The guided Morse lesson policy (#48).
 *
 * This module is the whole acquisition policy, expressed as pure functions over
 * a plain value. The React surface renders `currentStep()` and calls
 * `answerLesson()`; it holds no rules of its own, so every decision below is
 * testable without a DOM and without a scheduler.
 *
 * ## The invariant this module exists to protect
 *
 * ```text
 * retention state: learning / drilled / completed / decayed   (scheduler owns)
 * cue state:       rich / delayed-choice / reduced / free     (Test owns)
 * lesson support:  taught / cued / solo / settled             (Learn owns)
 * ```
 *
 * Learn retrieval is **formative**. Nothing here imports `scheduling.ts`,
 * `cueLadder.ts`, `distractors.ts` or `items.ts`, so a lesson answer
 * structurally cannot record a retention attempt, advance a scheduler interval,
 * write `DirectionEvidence`, satisfy bidirectional coverage or award
 * completion. The single value this
 * module hands back for persistence is an `ItemLessonStore`: one enum per item.
 *
 * ## The policy, and why each parameter has the value it has
 *
 * **Packet ordering and new-item load.** Reused verbatim from the ratified P1/P2
 * decisions in `docs/open/MORSE_CHARACTER_ORDER.md`: complexity-ascending with
 * final-element confusables split, two novel characters per packet, up to five
 * characters on the packet roster. #48 does not re-litigate them; it stops
 * presenting a packet as five cards to scroll and starts presenting it as a
 * lesson. The five-card figure was never the acquisition load and still is not:
 * a lesson introduces exactly `DEFAULT_PACKET_PLAN.novel` new mappings.
 *
 * **First retrieval after introduction.** Every not-yet-introduced character on
 * the roster is introduced first, in packet order, and retrieval begins after
 * the last of them. With two novel characters, the first character is retrieved
 * one step after its own introduction: soon enough to be retrieval rather than
 * recognition of what is still on screen, with one item of intervening material
 * so it is not an echo.
 *
 * **Fast confirmation after success.** A new character gets one supported
 * retrieval and one unaided retrieval: `taught → solo → settled`. Learn is
 * formative, so a correct answer should move the learner on rather than turn
 * a two-letter lesson into repetitive drilling. Test remains responsible for
 * durable scored evidence.
 *
 * **Errors retain repair support.** A miss restores the support that was
 * actually being withheld: one level below the *format* the check used. `solo`
 * and `settled` share the unaided format, so a miss at either records `cued`
 * rather than a level that would show nothing. The immediate confirmation is
 * still unaided: only an unaided success may settle the character.
 *
 * **Errors get one confirmation.** A miss is re-taught in feedback and returns
 * after any available intervening material. The next correct answer settles
 * it; repeated misses keep it pending until one is correct. Completed entries
 * are never reopened merely to fill time.
 *
 * **Interleaving prior material.** Returning characters are selected from
 * previously introduced material by current retrieval need. They are retrieved
 * once unaided, and a miss blocks packet advancement until its unaided
 * confirmation succeeds — interleaving is reinforcement, not decoration.
 *
 * **Packet readiness.** A packet advances only when every roster character —
 * novel and returning — is `settled`. There is no other route: the packet index
 * is derived from durable support levels rather than stored as a counter, so
 * there is no separate "current packet" field that could drift away from what
 * the learner has actually produced.
 *
 * **Leaving and resuming.** Support levels are persisted after every step, so an
 * interrupted lesson never loses ground already earned. The within-lesson queue
 * is not persisted: reopening Learn rebuilds the current packet's lesson from
 * durable support levels, skipping introductions the learner has already had.
 * One deliberate consequence: a learner who settles the new characters and
 * leaves before the returning characters come round advances the packet, and
 * meets those characters again as returning material in a later packet.
 *
 * **Returning learners.** `startLesson` always resolves to the first packet
 * that is not fully settled. A learner who has never opened Learn starts at
 * packet 1; a learner who settled through packet 6 resumes at packet 7. Nobody
 * is restarted from zero and nobody is dropped into material they never met.
 */

/** How many steps a missed character is barred from returning for when another pending item can intervene. */
export const WEAK_ITEM_DELAY_STEPS = 2

/** Alternatives on a supported lesson check: the answer plus two distractors. */
export const LESSON_CHOICE_OPTIONS = 3

const SUPPORT_INDEX = new Map<LessonSupport, number>(
  LESSON_SUPPORTS.map((support, index) => [support, index]),
)

function supportIndex(support: LessonSupport): number {
  return SUPPORT_INDEX.get(support) ?? 0
}

/** The three check formats. `settled` is retrieved exactly like `solo`. */
export type LessonCheckFormat = 'taught' | 'cued' | 'solo'

export function checkFormat(support: LessonSupport): LessonCheckFormat {
  return support === 'settled' ? 'solo' : support
}

/** A supported success earns the unaided confirmation; that confirmation settles it. */
export function fadedSupport(support: LessonSupport): LessonSupport {
  if (support === 'settled') return 'settled'
  return support === 'solo' ? 'settled' : 'solo'
}

/**
 * A miss restores one level below the format that was actually used, so a miss
 * at `settled` lands on `cued` rather than on the identical unaided format.
 */
export function restoredSupport(support: LessonSupport): LessonSupport {
  const format = checkFormat(support)
  return LESSON_SUPPORTS[Math.max(0, supportIndex(format) - 1)]
}

export interface LessonEntry {
  itemId: string
  glyph: MorseLetter
  pattern: string
  /** True for a character this packet introduces; false for returning material. */
  novel: boolean
  support: LessonSupport
  introduced: boolean
  /** Retrieved at least once in this lesson. */
  asked: boolean
  /** A miss is awaiting one successful confirmation before the item settles. */
  recovery?: boolean
  /** Settled *and* retrieved this lesson. Packet readiness needs every entry done. */
  done: boolean
  /** Step index before which this entry may not be asked again. */
  notBefore: number
  lastAskedAt: number | null
  /** Position on the roster: novel first, then returning. A stable tie-break. */
  order: number
}

export interface LessonFeedback {
  glyph: MorseLetter
  pattern: string
  correct: boolean
  response: string
  supportBefore: LessonSupport
  supportAfter: LessonSupport
  /** A miss reteaches: the full phrase, drawing, audio and canonical pattern. */
  reteach: boolean
}

export interface LessonRun {
  topicId: string
  /** Zero-based index into `buildCharacterPackets()`. */
  packetIndex: number
  packetCount: number
  /** Steps taken in this lesson: introductions and checks alike. */
  step: number
  entries: LessonEntry[]
  /** Set by `answerLesson`, cleared by `advanceLesson`. */
  feedback: LessonFeedback | null
  /** True once every roster character is settled and retrieved this lesson. */
  complete: boolean
  /** True when every packet in the programme is already settled. */
  finished: boolean
  /**
   * True for a run that introduces nothing, because this sitting has already
   * had its novel pair (#90 §3). The surface says so rather than looking like
   * a stalled lesson.
   */
  reviewOnly?: boolean
}

export type LessonStep =
  | { kind: 'introduce'; entry: LessonEntry }
  | { kind: 'check'; entry: LessonEntry; format: LessonCheckFormat }

/** Which character each scored item maps to, for a topic the lesson can drive. */
function rosterIdentity(topic: Topic): Map<MorseLetter, AcquisitionCharacter> | null {
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

function isDone(entry: LessonEntry): boolean {
  return entry.support === 'settled' && entry.asked
}

/**
 * Least recently asked first, so retrieval alternates across the roster instead
 * of drilling one character. Never-asked material leads; ties fall back to the
 * roster order, so the sequence is fully determined by the answers given.
 */
function byStaleness(a: LessonEntry, b: LessonEntry): number {
  return (
    (a.lastAskedAt ?? -1) - (b.lastAskedAt ?? -1) ||
    a.notBefore - b.notBefore ||
    // Among characters nobody has retrieved yet, the ones this packet just
    // introduced go first: that is what makes the first retrieval follow its
    // introduction rather than trail three returning characters.
    Number(b.novel) - Number(a.novel) ||
    a.order - b.order
  )
}

/**
 * Which unfinished entry belongs to the next step. Returns `null` when the
 * lesson is complete. A completed entry is never reopened as a spacer.
 */
function nextStepIndex(run: LessonRun): number | null {
  const pending = run.entries.filter((entry) => !entry.done)
  if (pending.length === 0) return null

  const eligible = pending.filter((entry) => entry.notBefore <= run.step)
  if (eligible.length > 0) {
    const chosen = [...eligible].sort(byStaleness)[0]
    return run.entries.indexOf(chosen)
  }

  // No other unfinished item can provide spacing. Revisit the earliest pending
  // correction rather than reopening a character the learner already completed.
  const chosen = [...pending].sort((a, b) => a.notBefore - b.notBefore || byStaleness(a, b))[0]
  return run.entries.indexOf(chosen)
}

/**
 * The one dominant task on screen. An entry that has never been introduced is
 * introduced first, in roster order; everything after that is retrieval. A
 * post-miss confirmation is always solo, even while its stored support keeps
 * the repair level for a resumed lesson.
 */
export function currentStep(run: LessonRun): LessonStep | null {
  if (run.complete) return null

  const uninitiated = run.entries
    .filter((entry) => !entry.introduced)
    .sort((a, b) => a.order - b.order)
  if (uninitiated.length > 0) return { kind: 'introduce', entry: uninitiated[0] }

  const next = nextStepIndex(run)
  if (next === null) return null
  const entry = run.entries[next]
  return { kind: 'check', entry, format: entry.recovery ? 'solo' : checkFormat(entry.support) }
}

function replaceEntry(run: LessonRun, itemId: string, next: LessonEntry): LessonEntry[] {
  return run.entries.map((entry) => (entry.itemId === itemId ? next : entry))
}

function settle(run: LessonRun, entries: LessonEntry[]): LessonRun {
  return { ...run, entries, complete: entries.every(isDone) }
}

/** Acknowledge an introduction. Nothing is scored and no support level moves. */
export function introduceLesson(run: LessonRun, itemId: string): LessonRun {
  const entry = run.entries.find((candidate) => candidate.itemId === itemId)
  if (!entry || entry.introduced) return run
  const next: LessonEntry = { ...entry, introduced: true }
  return settle({ ...run, step: run.step + 1, feedback: null }, replaceEntry(run, itemId, next))
}

/**
 * Fold one formative retrieval into the lesson.
 *
 * Takes and returns a `LessonRun`. It never receives a `Topic`, so — exactly
 * like `recordAnswer` in the Test ladder — it *cannot* touch status, history,
 * retention timestamps, cue evidence or directional coverage.
 */
export function answerLesson(run: LessonRun, itemId: string, response: string): LessonRun {
  const entry = run.entries.find((candidate) => candidate.itemId === itemId)
  if (!entry || run.feedback) return run

  const normalised = response.replace(/\s+/g, '')
  const correct = normalised.length > 0 && normalised === entry.pattern
  // A correction is an unaided check for a fluke: one success after any miss
  // settles the item, while another miss leaves it awaiting that same check.
  const support = correct && entry.recovery ? 'settled' : correct ? fadedSupport(entry.support) : restoredSupport(entry.support)
  const step = run.step + 1

  const next: LessonEntry = {
    ...entry,
    support,
    asked: true,
    recovery: correct ? undefined : true,
    lastAskedAt: run.step,
    // A correct answer needs one item of intervening material before it returns;
    // a miss needs the full weak-item delay so the correction is not an echo.
    notBefore: step + (correct ? 1 : WEAK_ITEM_DELAY_STEPS),
  }
  next.done = isDone(next)

  const feedback: LessonFeedback = {
    glyph: entry.glyph,
    pattern: entry.pattern,
    correct,
    response: normalised,
    supportBefore: entry.support,
    supportAfter: support,
    reteach: !correct,
  }

  return settle({ ...run, step, feedback }, replaceEntry(run, itemId, next))
}

/**
 * Dismiss feedback and expose the next unfinished step.
 */
export function advanceLesson(run: LessonRun): LessonRun {
  const cleared: LessonRun = { ...run, feedback: null }
  return cleared
}

/** The durable delta: one support level per roster item, and nothing else. */
export function lessonProgressOf(run: LessonRun): ItemLessonStore {
  const store: ItemLessonStore = {}
  for (const entry of run.entries) {
    if (entry.introduced) store[entry.itemId] = entry.support
  }
  return store
}

/**
 * Apply lesson progress to a topic without touching anything else about it.
 *
 * Deliberately the only function in this module that sees a `Topic`, and it
 * copies every other field through verbatim, so lesson state, cue state and
 * retention state stay independently observable and independently settable.
 */
export function withLessonProgress(topic: Topic, updates: ItemLessonStore): Topic {
  if (Object.keys(updates).length === 0) return topic
  const merged = { ...(topic.lessonProgress ?? {}), ...updates }
  const current = topic.lessonProgress ?? {}
  const unchanged =
    Object.keys(merged).length === Object.keys(current).length &&
    Object.entries(merged).every(([itemId, support]) => current[itemId] === support)
  if (unchanged) return topic
  return { ...topic, lessonProgress: merged }
}

/** Drop lesson progress for items an author has removed. */
export function pruneLessonProgress(
  store: ItemLessonStore | undefined,
  items: { id?: string }[],
): ItemLessonStore {
  if (!store) return {}
  const live = new Set(items.flatMap((item) => (item.id ? [item.id] : [])))
  return Object.fromEntries(Object.entries(store).filter(([itemId]) => live.has(itemId)))
}

/**
 * Alternatives for a supported check.
 *
 * Deterministic rather than random, so the sequence a learner sees is a
 * property of their own answers and can be asserted. Distractors are drawn from
 * characters the learner has actually met, never from a final-element
 * confusable of the target: during acquisition those are kept apart (Rothkopf
 * 1958), and contrasting them is the Test ladder's job once both are
 * established, not the introduction lesson's.
 */
export function lessonOptions(run: LessonRun, entry: LessonEntry): string[] {
  const target = entry.pattern
  const admissible = (glyph: MorseLetter) =>
    glyph !== entry.glyph && !isConfusable(target, morsePattern(glyph))

  const met = run.entries
    .filter((candidate) => candidate.introduced && admissible(candidate.glyph))
    .sort((a, b) => a.order - b.order)
    .map((candidate) => candidate.pattern)

  const padding = complexityOrderedLetters()
    .filter(admissible)
    .map((glyph) => MORSE_LETTERS[glyph] as string)

  // Same length first. The `cued` check discloses how many signals the answer
  // has, so alternatives of a different length would let the learner solve it
  // off the count rather than off the rhythm.
  const candidates = [...met, ...padding]
  const ranked = [
    ...candidates.filter((pattern) => pattern.length === target.length),
    ...candidates.filter((pattern) => pattern.length !== target.length),
  ]

  const options: string[] = []
  for (const pattern of ranked) {
    if (options.length >= LESSON_CHOICE_OPTIONS - 1) break
    if (pattern !== target && !options.includes(pattern)) options.push(pattern)
  }

  // The answer's position rotates with the step so it is neither fixed nor
  // random: the same lesson replayed answers-for-answers looks identical.
  const at = run.step % LESSON_CHOICE_OPTIONS
  const ordered = [...options]
  ordered.splice(Math.min(at, ordered.length), 0, target)
  return ordered
}

/** Roster characters settled this lesson, for the progress indicator. */
export function lessonProgressCount(run: LessonRun): { done: number; total: number } {
  return {
    done: run.entries.filter(isDone).length,
    total: run.entries.length,
  }
}
