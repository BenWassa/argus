import { useLibrary } from '../../../services/library/LibraryProvider'
import {
  lessonProgressOf,
  withLessonProgress,
  type LessonRun,
} from '../../../domain/morse/curriculum/lesson'
import {
  withLessonSitting,
  withoutLessonSitting,
  type LessonSitting,
} from '../../../domain/morse/curriculum/lessonSitting'
import {
  completeSitting,
  morseReviewOf,
  recordIntroduced,
  recordListeningRetrieval,
  recordPrintedRetrieval,
  withMorseReview,
} from '../../../domain/morse/curriculum/review'
import { withAcquisitionReadiness } from '../../../domain/study/journey'

/**
 * Everything the Morse lesson writes down, and the only place it writes.
 *
 * Every update is functional against `current` rather than against a copy the
 * lesson captured when it opened (#62): a Test banked minutes ago, or a sibling
 * write, may have moved this topic since, and writing back a captured object
 * would quietly undo it. Each function touches exactly one field family, so a
 * lesson answer can never reach retention evidence by accident.
 */
export function useLessonRecord(topicId: string) {
  const { updateTopic } = useLibrary()

  return {
    /**
     * Persist one lesson step. `withAcquisitionReadiness` stamps the readiness
     * anchor in the same update as the answer that earned it, so the retention
     * clock starts at readiness rather than one render later.
     */
    commitProgress(run: LessonRun) {
      const progress = lessonProgressOf(run)
      updateTopic(topicId, (current) =>
        withAcquisitionReadiness(withLessonProgress(current, progress)),
      )
    },

    persistSitting(sitting: LessonSitting) {
      updateTopic(topicId, (current) => withLessonSitting(current, sitting))
    },

    /**
     * Acknowledge an introduction, and record which sitting it happened in.
     *
     * The sitting ordinal is what makes #90 §4's "succeeded in a later sitting"
     * answerable at all, and it can only be captured here — by the time the
     * character is being retrieved, the fact of when it was first met is gone.
     */
    recordIntroduction(itemId: string) {
      updateTopic(topicId, (current) =>
        withMorseReview(current, recordIntroduced(morseReviewOf(current), itemId)),
      )
    },

    recordPrinted(itemId: string, correct: boolean) {
      updateTopic(topicId, (current) =>
        withMorseReview(current, recordPrintedRetrieval(morseReviewOf(current), itemId, correct)),
      )
    },

    /**
     * Record one listening retrieval. Kept in its own counters, so it can
     * neither satisfy the printed claim nor reset printed staleness (#90 §5, #29).
     */
    recordListening(itemId: string, correct: boolean) {
      updateTopic(topicId, (current) =>
        withMorseReview(current, recordListeningRetrieval(morseReviewOf(current), itemId, correct)),
      )
    },

    /**
     * Close the finite sitting. Counted here, when the learner actually moves
     * on, rather than when a sitting is merely abandoned — an abandoned sitting
     * must not satisfy #90 §4 for work the learner never came back to. A clean
     * next sitting is the absent field rather than stored zeroes.
     */
    closeSitting() {
      updateTopic(topicId, (current) =>
        withMorseReview(withoutLessonSitting(current), completeSitting(morseReviewOf(current))),
      )
    },
  }
}
