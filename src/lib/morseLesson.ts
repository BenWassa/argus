import { morseAcquisitionProfile, type AcquisitionCharacter } from './acquisition'
import { isConfusable } from './confusion'
import { MORSE_LETTERS, morsePattern, type MorseLetter } from './morse'
import {
  ALL_MORSE_LETTERS,
  buildCharacterPackets,
  complexityOrderedLetters,
  type CharacterPacket,
} from './morseOrder'
import { LESSON_SUPPORTS, type ItemLessonStore, type LessonSupport, type Topic } from './types'

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
 * decisions in `docs/MORSE_CHARACTER_ORDER.md`: complexity-ascending with
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
 * **Cue reduction after success.** One correct retrieval at a support level
 * fades that item one level: `taught → cued → solo → settled`. This is
 * deliberately faster than Test's `CUE_FADE_STREAK` of two. Test's streak
 * governs durable *evidence* about scored performance; a lesson is a few
 * minutes long and its job is to hand the learner to the uncued format quickly,
 * per the diminishing-cues finding in PRD §5.5. Nothing is claimed by reaching
 * `settled` except that the lesson will stop scaffolding that character.
 *
 * **Errors restore support.** A miss restores the support that was actually
 * being withheld: one level below the *format* the check used. `solo` and
 * `settled` share the unaided format, so a miss at either returns the learner to
 * `cued` rather than to a level that would show nothing. A miss never resets to
 * the bottom — an error is evidence about this character, not about the learner.
 *
 * **Delayed recurrence of weak items.** A missed character is barred from the
 * next `WEAK_ITEM_DELAY_STEPS` steps, so it always returns *after* intervening
 * material. `nextStepIndex` additionally guarantees that a missed item is never
 * the very next step, by reopening already-settled roster material as genuine
 * interleaved retrieval when nothing else is pending. There is therefore no
 * miss → reteach → same-question loop where the answer is still on screen.
 *
 * **Interleaving prior-packet material.** The roster's returning characters are
 * prior-packet material chosen by `buildCharacterPackets`. They are retrieved
 * unaided, and a miss on one drops it back down the support ladder and blocks
 * packet advancement until it is produced unaided again — which is the whole
 * point of interleaving rather than decoration.
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

/** How many steps a missed character is barred from returning for. */
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

/** One correct retrieval fades one level. `settled` is the top of the ladder. */
export function fadedSupport(support: LessonSupport): LessonSupport {
  return LESSON_SUPPORTS[Math.min(LESSON_SUPPORTS.length - 1, supportIndex(support) + 1)]
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

export function lessonPackets(): CharacterPacket[] {
  return buildCharacterPackets()
}

/**
 * The first packet the learner has not fully settled — the whole of the
 * lesson's durable position. Returns `packets.length` when every packet is
 * settled, which is the finished state rather than an index.
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
 * Build the lesson for a topic's current position, or `null` for a topic the
 * guided lesson does not drive.
 *
 * Takes a `Topic` and returns a `LessonRun`; it reads `lessonProgress` and
 * nothing else about the learner, and it writes nothing at all.
 */
export function startLesson(topic: Topic): LessonRun | null {
  const byGlyph = rosterIdentity(topic)
  if (!byGlyph) return null

  const packets = lessonPackets()
  const store = topic.lessonProgress ?? {}
  const packetIndex = firstUnsettledPacket(packets, byGlyph, store)

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
  const entries: LessonEntry[] = packet.characters.map((glyph, order) => {
    const character = byGlyph.get(glyph) as AcquisitionCharacter
    const stored = store[character.itemId]
    const support = stored ?? 'taught'
    return {
      itemId: character.itemId,
      glyph,
      pattern: character.pattern,
      novel: packet.novel.includes(glyph),
      support,
      // Anything with a stored support level has been through an introduction.
      // A returning character with no stored level can only come from an
      // edited or imported record; introduce it rather than assume.
      introduced: stored !== undefined,
      asked: false,
      done: false,
      notBefore: 0,
      lastAskedAt: null,
      order,
    }
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
 * Which entry the next step belongs to, and whether the queue had to reopen
 * settled material to avoid repeating the item the learner just saw the answer
 * to. Returns `null` when the lesson is complete.
 */
function nextStepIndex(run: LessonRun): { at: number; reopen: boolean } | null {
  const pending = run.entries.filter((entry) => !entry.done)
  if (pending.length === 0) return null

  const eligible = pending.filter((entry) => entry.notBefore <= run.step)
  if (eligible.length > 0) {
    const chosen = [...eligible].sort(byStaleness)[0]
    return { at: run.entries.indexOf(chosen), reopen: false }
  }

  // Nothing is eligible, which happens exactly when the learner has just
  // answered the only pending item. Bring back the roster's least recently
  // retrieved settled character instead: real interleaved retrieval, and never
  // the question whose answer is still on screen.
  const settled = run.entries.filter((entry) => entry.done)
  if (settled.length > 0) {
    const chosen = [...settled].sort(byStaleness)[0]
    return { at: run.entries.indexOf(chosen), reopen: true }
  }

  const chosen = [...pending].sort((a, b) => a.notBefore - b.notBefore || byStaleness(a, b))[0]
  return { at: run.entries.indexOf(chosen), reopen: false }
}

/**
 * The one dominant task on screen. An entry that has never been introduced is
 * introduced first, in roster order; everything after that is retrieval.
 */
export function currentStep(run: LessonRun): LessonStep | null {
  if (run.complete) return null

  const uninitiated = run.entries
    .filter((entry) => !entry.introduced)
    .sort((a, b) => a.order - b.order)
  if (uninitiated.length > 0) return { kind: 'introduce', entry: uninitiated[0] }

  const next = nextStepIndex(run)
  if (!next) return null
  const entry = run.entries[next.at]
  return { kind: 'check', entry, format: checkFormat(entry.support) }
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
  const support = correct ? fadedSupport(entry.support) : restoredSupport(entry.support)
  const step = run.step + 1

  const next: LessonEntry = {
    ...entry,
    support,
    asked: true,
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
 * Dismiss feedback and expose the next step. Reopening settled material as a
 * spacer happens here, so the reopened entry is visible in the run rather than
 * conjured inside a render.
 */
export function advanceLesson(run: LessonRun): LessonRun {
  const cleared: LessonRun = { ...run, feedback: null }
  if (cleared.complete) return cleared

  const next = nextStepIndex(cleared)
  if (!next || !next.reopen) return cleared

  const entries = cleared.entries.map((entry, at) =>
    at === next.at ? { ...entry, asked: false, done: false, notBefore: cleared.step } : entry,
  )
  return { ...cleared, entries, complete: false }
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
