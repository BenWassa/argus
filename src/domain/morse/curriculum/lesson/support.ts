// Lesson value types, support transitions and check constants.
import type { MorseLetter } from '../../code'
import { LESSON_SUPPORTS, type LessonSupport } from '../../progress'

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
  /**
   * True for a run after the thirteen lessons, over the letters the course still
   * owes the learner (`startAfterCourse`). It introduces nothing and is always
   * review-only.
   */
  afterCourse?: boolean
}

export type LessonStep =
  | { kind: 'introduce'; entry: LessonEntry }
  | { kind: 'check'; entry: LessonEntry; format: LessonCheckFormat }

