/**
 * Durable formative progress through the Morse programme.
 *
 * Every record here is formative: it describes how much help the guided lesson
 * is still giving and where the learner is in a sitting. None of it is evidence,
 * none of it can qualify a completion, and none of it may reach the scored Test
 * boundary — `domain/study/evidence.ts` is the only thing that speaks for that.
 */
/**
 * Formative Learn-lesson support levels (#48).
 *
 * Deliberately a *different* ladder from `CueState`, stored in a different
 * field, because it answers a different question. `CueState` is how much
 * scaffolding the scored Test surface still offers an item; `LessonSupport` is
 * how much scaffolding the guided Learn lesson still offers it. Collapsing the
 * two would let a formative Learn answer change what formal Test shows, and
 * `DirectionEvidence` — whose `unassistedCorrect` counter
 * `hasCompleteDirectionalCoverage` reads to gate a bidirectional retention
 * attempt — must never receive a Learn answer at all.
 *
 *   taught   introduced; retrieved with the whole rhythmic phrase in view
 *   cued     retrieved with element count and optional canonical audio only
 *   solo     retrieved with nothing but the glyph, by keying the pattern
 *   settled  produced unaided at least once; the lesson stops scaffolding it
 *
 * `settled` is a statement about lesson scaffolding and nothing else. It is not
 * retention, it is not completion, and it cannot satisfy any part of the Test
 * boundary.
 */
export const LESSON_SUPPORTS = ['taught', 'cued', 'solo', 'settled'] as const
export type LessonSupport = (typeof LESSON_SUPPORTS)[number]

/** Per-item durable Learn support, keyed by the same stable id as Test evidence. */
export type ItemLessonStore = Record<string, LessonSupport>

/**
 * Durable progress through the current finite Morse Learn sitting (#59, #66).
 * This is formative session bookkeeping only: it resumes the actual
 * sitting across exit/reload and cannot satisfy Test or scheduler evidence.
 *
 * `Topic.lessonSitting` is the single durable authority for this state (#66).
 * Absent means a fresh sitting, and a fresh sitting is always written as the
 * absent field rather than as zeroed counters, so "where am I in this sitting"
 * has exactly one representation in a stored or exported record.
 *
 * `listeningSuppressed` is here rather than in runtime state because the sitting
 * itself is now durable. `Can't listen now` is a statement about the sitting the
 * learner is in; resuming that same sitting after six retrievals and silently regaining
 * listening would contradict what they said. Audio errors, playback position and
 * the within-lesson queue remain transient.
 */
export interface MorseLessonSittingProgress {
  retrievals: number
  correct: number
  revisitItemIds: string[]
  /** Learner declined listening questions for this sitting. Absent means no. */
  listeningSuppressed?: boolean
}

/**
 * Per-item formative review history for the Morse lesson (#90 batch 6).
 *
 * `lessonProgress` says what support the lesson currently offers an item. It
 * cannot say *when* that support was earned, and the acquisition boundary
 * #90 §4 asks for — "succeeded at least once in a sitting later than the one
 * that introduced it" — is not derivable from a support level alone. Nor can a
 * support level say which characters the listening cadence has actually
 * reached, which is what makes #90 §5's coverage claim checkable.
 *
 * So this records the smallest thing that answers both: which sitting an item
 * was introduced in, which sittings have retrieved it since, and how much
 * listening it has had. Sittings are counted rather than timestamped because
 * the question is "a different sitting", not "how long ago" — a counter cannot
 * drift with the clock, survives export/import unchanged, and keeps the
 * simulations deterministic.
 *
 * Formative throughout. Nothing here is evidence, nothing here can qualify a
 * completion, and auditory counters deliberately make no competency claim —
 * #29 remains the boundary for any auditory claim.
 */
export interface MorseReviewItem {
  /** Sitting ordinal in which this item was first introduced. */
  introducedIn: number
  /** Latest sitting ordinal in which it was retrieved in print, right or wrong. */
  lastSeenIn: number
  /** Correct printed retrievals earned in a sitting later than `introducedIn`. */
  laterCorrect: number
  /** Every printed retrieval. Used only to break equal review need fairly. */
  printed: number
  /** Listening retrievals offered. Formative support, never a claim. */
  heard: number
  /** Listening retrievals answered correctly. */
  heardCorrect: number
}

/**
 * The lesson's review history for one topic.
 *
 * `sittings` counts sittings *completed*, so the sitting in progress is always
 * `sittings + 1`. Counting completions rather than starts means an abandoned
 * sitting cannot inflate the ordinal and quietly satisfy "a later sitting" for
 * work the learner never came back to.
 */
export interface MorseReviewProgress {
  sittings: number
  items: Record<string, MorseReviewItem>
}
