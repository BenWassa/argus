import type { Topic } from '../../library/topic'
import type { MorseReviewItem, MorseReviewProgress } from '../progress'

/**
 * How many correct retrievals in a *later* sitting a character needs before the
 * programme will call it acquired (#90 §4).
 *
 * One, deliberately, and the issue says to start here and gather local data
 * before moving it. The claim this supports is modest — that a character
 * survived the gap between two sittings at least once — and a higher number
 * would lengthen the programme on a guess rather than on evidence.
 */
export const LATER_SITTING_SUCCESSES = 1

/**
 * How many listening retrievals a character needs before listening coverage is
 * complete (#90 §5).
 *
 * Also one. Listening here is formative support for printed recall, not a
 * competency in its own right; #29 owns any auditory claim. One retrieval is
 * enough to say the character has been met in sound, which is all this
 * programme is entitled to say.
 */
export const LISTENING_COVERAGE_TARGET = 1

/**
 * The most any character's listening count may exceed another's while coverage
 * is still incomplete (#90 §5).
 *
 * The old fixed third-slot cadence had no such bound, which is how it managed
 * to land repeatedly on the same handful of letters. One is the tightest bound
 * that is still satisfiable when the eligible pool changes size between slots.
 */
export const LISTENING_IMBALANCE_ALLOWANCE = 1

// Runtime-only marker for an item established independently by placement (or
// legacy data). It is derived from settled support and never persisted.
const INDEPENDENTLY_ESTABLISHED = 0

function independentlyEstablishedItem(currentSittingOrdinal: number): MorseReviewItem {
  return {
    introducedIn: INDEPENDENTLY_ESTABLISHED,
    lastSeenIn: currentSittingOrdinal,
    laterCorrect: 0,
    printed: 0,
    heard: 0,
    heardCorrect: 0,
  }
}

function isIndependentlyEstablished(item: MorseReviewItem | undefined): boolean {
  return item?.introducedIn === INDEPENDENTLY_ESTABLISHED
}

export function newMorseReview(): MorseReviewProgress {
  return { sittings: 0, items: {} }
}

/**
 * Read a topic's review history, defaulting to empty.
 *
 * A record written before this field existed reads as "no history yet" rather
 * than being back-filled. That is the conservative half of the migration: a
 * learner mid-programme keeps every support level they earned, and simply has
 * not yet demonstrated a later-sitting success, because they genuinely have
 * not — nothing was recording it. What stops that from dragging an already
 * finished learner backwards is `acquisitionReadyAt`, which is permanent and
 * is checked before any of this.
 */
export function morseReviewOf(
  topic: Pick<Topic, 'morseReview' | 'lessonProgress'>,
): MorseReviewProgress {
  const stored = topic.morseReview
  const review = stored
    ? { sittings: stored.sittings, items: { ...stored.items } }
    : newMorseReview()
  const ordinal = review.sittings + 1
  for (const [itemId, support] of Object.entries(topic.lessonProgress ?? {})) {
    if (support === 'settled' && review.items[itemId] === undefined) {
      review.items[itemId] = independentlyEstablishedItem(ordinal)
    }
  }
  return review
}

/** The ordinal of the sitting currently in progress. Completed sittings plus one. */
export function currentSitting(review: MorseReviewProgress): number {
  return review.sittings + 1
}

export function newReviewItem(sitting: number): MorseReviewItem {
  return { introducedIn: sitting, lastSeenIn: sitting, laterCorrect: 0, printed: 0, heard: 0, heardCorrect: 0 }
}

/**
 * True for a review record holding nothing worth persisting.
 *
 * Mirrors `lessonSittingIsFresh`: an empty history has exactly one durable
 * representation — the absent field — so an export never distinguishes "no
 * history because it is new" from "no history because something wrote zeroes".
 */
export function morseReviewIsFresh(review: MorseReviewProgress): boolean {
  return review.sittings === 0 && Object.keys(review.items).length === 0
}

/**
 * Record that an item was introduced, if this is the first time.
 *
 * Idempotent on purpose. Re-introducing a character after a lapse must not
 * reset `introducedIn`, or the later-sitting requirement would restart every
 * time support was restored and the programme would never end for a learner
 * who misses one character repeatedly.
 */
export function recordIntroduced(
  review: MorseReviewProgress,
  itemId: string,
  sitting: number = currentSitting(review),
): MorseReviewProgress {
  if (review.items[itemId]) return review
  return { ...review, items: { ...review.items, [itemId]: newReviewItem(sitting) } }
}

/**
 * Record one printed retrieval.
 *
 * `laterCorrect` moves only for a correct answer given in a sitting after the
 * one that introduced the character — the whole point of the counter. An item
 * with no record yet is treated as introduced now, so a retrieval can never
 * arrive for an item this module has never heard of.
 */
export function recordPrintedRetrieval(
  review: MorseReviewProgress,
  itemId: string,
  correct: boolean,
  sitting: number = currentSitting(review),
): MorseReviewProgress {
  const existing = review.items[itemId] ?? newReviewItem(sitting)
  const later = correct && sitting > existing.introducedIn
  const missedIn = repairDebt(existing, correct, sitting)
  const next: MorseReviewItem = {
    ...existing,
    lastSeenIn: Math.max(existing.lastSeenIn, sitting),
    laterCorrect: existing.laterCorrect + (later ? 1 : 0),
    printed: existing.printed + 1,
  }
  // A present-or-absent key rather than an explicit `undefined`, so a repaired
  // character serialises identically to one that was never missed and the
  // storage boundary never sees an undefined value.
  if (missedIn === undefined) delete next.missedIn
  else next.missedIn = missedIn
  return { ...review, items: { ...review.items, [itemId]: next } }
}

/**
 * How one printed answer moves the repair debt.
 *
 * A miss opens it, stamped with the sitting it happened in. A correct answer
 * closes it only from a *later* sitting than the miss: the confirmation the
 * lesson asks for immediately afterwards proves the learner can copy a
 * correction that is still on the screen, which is not the same claim, and
 * treating it as repair is exactly how a struggling character used to vanish
 * from review the moment its support level went back up.
 *
 * Reopening is idempotent on the ordinal rather than on the flag: missing the
 * same character twice in one sitting leaves one debt from that sitting, and
 * missing it again next sitting moves the debt forward.
 */
function repairDebt(
  existing: MorseReviewItem,
  correct: boolean,
  sitting: number,
): number | undefined {
  if (!correct) return sitting
  if (existing.missedIn === undefined) return undefined
  return sitting > existing.missedIn ? undefined : existing.missedIn
}

/**
 * Record one listening retrieval.
 *
 * Kept in its own counters and never touching `laterCorrect` or `lastSeenIn`,
 * because a listening answer must not be able to satisfy a printed claim. This
 * is the same separation `answerListeningQuestion` already keeps against
 * `LessonSupport`, expressed once more where the durable state lives.
 */
export function recordListeningRetrieval(
  review: MorseReviewProgress,
  itemId: string,
  correct: boolean,
  sitting: number = currentSitting(review),
): MorseReviewProgress {
  const existing = review.items[itemId] ?? newReviewItem(sitting)
  const next: MorseReviewItem = {
    ...existing,
    heard: existing.heard + 1,
    heardCorrect: existing.heardCorrect + (correct ? 1 : 0),
  }
  return { ...review, items: { ...review.items, [itemId]: next } }
}

/** Close the current sitting. The next retrieval belongs to a later one. */
export function completeSitting(review: MorseReviewProgress): MorseReviewProgress {
  return { ...review, sittings: review.sittings + 1 }
}

/** Whether this item has survived the gap between sittings often enough. */
export function hasLaterSittingSuccess(review: MorseReviewProgress, itemId: string): boolean {
  const item = review.items[itemId]
  return isIndependentlyEstablished(item) || (item?.laterCorrect ?? 0) >= LATER_SITTING_SUCCESSES
}

/**
 * Whether this character owes a repair: missed in print, and not yet produced
 * correctly in a sitting after the one it was missed in.
 *
 * This is the question review selection now leads on. An item established by
 * placement rather than by the lesson has no such history and owes nothing.
 */
export function owesRepair(review: MorseReviewProgress, itemId: string): boolean {
  const item = review.items[itemId]
  if (!item || isIndependentlyEstablished(item)) return false
  return item.missedIn !== undefined
}

/**
 * Sittings since the unrepaired miss, or `null` when nothing is owed. Orders
 * one outstanding repair against another: the oldest unpaid debt goes first.
 */
export function sittingsSinceMissed(
  review: MorseReviewProgress,
  itemId: string,
): number | null {
  const item = review.items[itemId]
  if (!item || item.missedIn === undefined || isIndependentlyEstablished(item)) return null
  return Math.max(0, currentSitting(review) - item.missedIn)
}

/** Whether this item has been met in sound often enough. */
export function hasListeningCoverage(review: MorseReviewProgress, itemId: string): boolean {
  const item = review.items[itemId]
  return isIndependentlyEstablished(item) || (item?.heard ?? 0) >= LISTENING_COVERAGE_TARGET
}

/**
 * How many sittings have passed since this item was last retrieved in print.
 *
 * The staleness term of the priority function. An item with no record is
 * maximally stale: it has never been seen, which is the strongest reason to
 * ask it.
 */
export function sittingsSinceSeen(review: MorseReviewProgress, itemId: string): number {
  const item = review.items[itemId]
  if (!item) return Number.MAX_SAFE_INTEGER
  if (isIndependentlyEstablished(item)) return 0
  return Math.max(0, currentSitting(review) - item.lastSeenIn)
}

function persistableReview(review: MorseReviewProgress): MorseReviewProgress {
  return {
    sittings: review.sittings,
    items: Object.fromEntries(
      Object.entries(review.items).filter(([, item]) => !isIndependentlyEstablished(item)),
    ),
  }
}

/**
 * Persist review history, dropping it entirely when it holds nothing.
 *
 * Every other field is copied through verbatim so a review write composes with
 * concurrent support, sitting and scheduler writes rather than reinstating a
 * stale snapshot of them — the same discipline `withLessonSitting` keeps.
 */
export function withMorseReview(topic: Topic, review: MorseReviewProgress): Topic {
  const persistable = persistableReview(review)
  if (morseReviewIsFresh(persistable)) return withoutMorseReview(topic)
  return { ...topic, morseReview: { sittings: persistable.sittings, items: { ...persistable.items } } }
}

export function withoutMorseReview(topic: Topic): Topic {
  if (topic.morseReview === undefined) return topic
  const { morseReview: _dropped, ...rest } = topic
  return rest
}

/**
 * Drop review records for items an author has actually deleted.
 *
 * The sitting count stays: those sittings happened, and the count is how far
 * through the programme the learner is rather than a tally of the letters
 * still listed. Leaving a dead id would be worse than untidy — the storage
 * boundary rejects a record referencing an item its topic does not have, so an
 * unpruned edit would make the whole library unloadable on the next start.
 */
export function pruneMorseReview(
  review: MorseReviewProgress | undefined,
  items: { id?: string }[],
): MorseReviewProgress | undefined {
  if (!review) return undefined
  const live = new Set(items.flatMap((item) => (item.id ? [item.id] : [])))
  const entries = Object.entries(review.items).filter(([itemId]) => live.has(itemId))
  const pruned: MorseReviewProgress = { sittings: review.sittings, items: Object.fromEntries(entries) }
  return morseReviewIsFresh(pruned) ? undefined : pruned
}
