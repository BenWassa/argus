import type { ItemEvidenceStore } from '../study/evidence'
import type {
  ItemLessonStore,
  MorseLessonSittingProgress,
  MorseReviewProgress,
} from '../morse/progress'
import type { MorseFluencyProgress } from '../morse/fluency/progress'
import type { LearnContent } from '../learning/content'

/**
 * The library model: what a topic is, what it holds, and the ladder it sits on.
 *
 * A `Topic` is the aggregate the learner owns, so it carries references to
 * every other part of the model — evidence, lesson progress, learn content.
 * Those modules deliberately do not point back at it.
 */
export const TRACKS = ['learning', 'survival', 'tradecraft'] as const
export type Track = (typeof TRACKS)[number]

/**
 * The status ladder. Every topic sits on exactly one rung, and the rung
 * decides both what the topic looks like and when it comes back.
 *
 *   unstarted -> learning -> drilled -> completed
 *                              ^           |
 *                              +- decayed -+
 *
 * `completed` is permanent: decay routes a topic back to drilling without
 * erasing the fact that it was once completed.
 */
export const STATUSES = ['unstarted', 'learning', 'drilled', 'completed', 'decayed'] as const
export type Status = (typeof STATUSES)[number]

/**
 * Durable provenance. `catalog` marks a topic delivered by the shipped Argus
 * catalog; `user` marks anything the learner authored or imported themselves.
 * Ownership decides only whether catalog reconciliation may deliver an id — it
 * never grants permission to rewrite a topic that already exists locally.
 */
export const TOPIC_ORIGINS = ['catalog', 'user'] as const
export type TopicOrigin = (typeof TOPIC_ORIGINS)[number]

/**
 * Item semantics are content definition. Existing/legacy items are forward
 * unless normalized to another explicit kind by the v5 storage boundary.
 */
export const ITEM_KINDS = ['forward', 'bidirectional'] as const
export type ItemKind = (typeof ITEM_KINDS)[number]

/**
 * `id` and `kind` are optional only on the broad in-memory Topic shape so old
 * fixtures and v4 seed authoring remain structurally compatible. Every v5
 * library produced by storage contains both fields for every item.
 */
export interface Item {
  id?: string
  kind?: ItemKind
  prompt: string
  answer: string
}

export interface IdentifiedItem extends Item {
  id: string
  kind: ItemKind
}

export interface Attempt {
  at: string
  correct: number
  total: number
  /** Status the topic held after this attempt resolved. */
  resolvedTo: Status
}

export interface Topic {
  id: string
  title: string
  /** The hard boundary. A topic cannot exist without one. */
  scope: string
  track: Track
  /** Finite scored recall material. Learn support never changes this set. */
  items: Item[]
  /** Optional explanatory support shown only in Learn. */
  learn?: LearnContent
  status: Status
  createdAt: string
  /** When the topic first reached `drilled`. Starts the delayed-recall clock. */
  drilledAt: string | null
  /** First exposure timestamp. Starts the one-day learning gap. */
  learningAt: string | null
  /** Set once, the first time the topic completes. Never cleared by decay. */
  completedAt: string | null
  /** Most recent scored Test, whether scheduled or voluntary. */
  lastTestedAt: string | null
  /** Most recent due completed-topic Test. Starts the spot-check clock. */
  spotCheckedAt: string | null
  history: Attempt[]
  /** v5 acquisition evidence. Optional only for legacy/internal Topic fixtures. */
  itemEvidence?: ItemEvidenceStore
  /**
   * Formative Learn-lesson per-item support (#48). Additive within v5: absent
   * means this learner has no item support progress yet.
   */
  lessonProgress?: ItemLessonStore
  /**
   * Current finite Morse Learn sitting (#59, #66). Additive within v5: absent
   * means a fresh 0/10 sitting. This is portable formative state only and is
   * never formal evidence. Since #66 it is the sole durable authority: no
   * sidecar store competes with it.
   */
  lessonSitting?: MorseLessonSittingProgress
  /**
   * Formative Morse review history (#90 batch 6). Additive within v5: absent
   * means a learner whose record predates it, and such a record is read as
   * "no review history yet" rather than being back-filled with successes that
   * never happened. A learner already past `acquisitionReadyAt` stays ready.
   */
  morseReview?: MorseReviewProgress
  /**
   * Post-acquisition Fluency statistics (#119). Additive within v5: absent
   * means a learner who has done no Fluency, which is the only honest reading
   * — there is nothing to back-fill, because speed is not derivable from any
   * other field.
   *
   * A fourth formative store, deliberately separate from `morseReview` for the
   * same reason `lessonProgress` is separate from `itemEvidence`: it answers a
   * different question. `morseReview` records what the guided lesson covered;
   * this records how quickly and how stably a character comes back by ear.
   * Neither can qualify the other, and nothing here reaches Test evidence,
   * retention state or completion.
   */
  morseFluency?: MorseFluencyProgress
  /**
   * When progressive acquisition first became ready — for Morse, when every
   * required item had been produced unaided at least once in Learn (#67).
   *
   * Durable because it cannot be derived: `lessonProgress` says what support the
   * lesson currently offers each item, never when the last one first settled,
   * and a later miss legitimately restores support. Permanent for the same
   * reason `completedAt` is: reaching the acquisition boundary is a historical
   * fact, so a topic already past it is never dragged back to `Continue lesson`.
   *
   * It anchors the qualifying `learning → drilled` gap for progressive topics,
   * so a programme spanning weeks does not arrive at its first scored Test with
   * a clock that expired while the learner was still on packet 2. Absent on a
   * topic whose acquisition is already complete means a record written before
   * this field existed; the journey layer then falls back to `learningAt`, which
   * is exactly the pre-#62 behaviour and can only ever be more permissive.
   */
  acquisitionReadyAt?: string | null
  /**
   * Catalog provenance. Optional only on the broad in-memory Topic shape so
   * seed authoring and old fixtures stay structurally compatible; storage
   * always resolves it for every topic it returns.
   */
  origin?: TopicOrigin
}
