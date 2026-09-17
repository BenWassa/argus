import { journeyFor } from '../../domain/study/journey'
import { resolveAttempt, type Resolution } from '../../domain/study/scheduling'
import { retentionCorrectCount, type AttemptAnswer } from '../../domain/library/items'
import type { Topic } from '../../domain/library/topic'
import type { ItemEvidenceStore } from '../../domain/study/evidence'

/**
 * A banked attempt, and whether progressive-acquisition readiness withheld its
 * advancement (#67). The end screen has to be able to say why a clean run left
 * the ladder where it was; "held at learning" alone reads like a bug.
 */
export interface BankedAttempt {
  resolution: Resolution
  withheldByAcquisition: boolean
  /**
   * True when the learner answered every card correctly and the run still could
   * not bank, because the bidirectional claim does not yet hold independent
   * evidence in both directions. Recorded work, not a failed recall (#90).
   */
  nonQualifying: boolean
}

/**
 * What one finished topic's attempt resolves to, and why.
 *
 * Pure: it decides, and the caller writes. Three gates stand between a run of
 * correct answers and an advancement, and keeping them here rather than inside
 * the component means each can be stated as a case rather than reached through
 * a rendered deck.
 */
export function resolveBankedAttempt(
  topic: Topic,
  attempt: { correct: number; total: number },
  evidence: ItemEvidenceStore,
  answers: AttemptAnswer[],
  now: Date = new Date(),
): BankedAttempt {
  // The scheduler resolves the attempt exactly as it always has. Cue evidence
  // is merged in afterwards, as a separate field, and changes nothing the
  // resolution decided.
  const mergedEvidence = { ...(topic.itemEvidence ?? {}), ...evidence }
  // Acquisition evidence remains separate state. It is used here only as a
  // safety gate: neither an incomplete direction nor a supported answer can be
  // presented to the unchanged scheduler as a passing attempt for a
  // bidirectional boundary. The attempt's own answers are passed alongside the
  // store so a run carried by cued history cannot bank a claim of independent
  // recall (#68).
  const schedulerCorrect = retentionCorrectCount(topic.items, mergedEvidence, attempt.correct, answers)
  // The second gate, and the one #67 adds. Early Test stays reachable for a
  // topic still in progressive acquisition — it is a legitimate thing to want
  // to try — but a run given before the learner has met every letter cannot
  // bank retention the acquisition programme has not yet earned. The journey
  // layer decides that; the scheduler is simply told the answer.
  const { advancementEligible: journeyEligible } = journeyFor(topic)
  // The third gate, and the one #90 asks for. A run the learner answered
  // correctly end to end, which still cannot qualify because the bidirectional
  // claim has not accumulated independent evidence in both directions, is
  // recorded work rather than a failed recall. Scoring it as a failure would
  // reset the one-day clock and route twenty-six correct answers back to
  // drilling, which is both untrue and the opposite of what happened.
  const cleanRun = attempt.total > 0 && attempt.correct === attempt.total
  const nonQualifying = cleanRun && schedulerCorrect < attempt.total
  const advancementEligible = journeyEligible && !nonQualifying

  return {
    resolution: resolveAttempt(topic, schedulerCorrect, attempt.total, now, { advancementEligible }),
    withheldByAcquisition: !journeyEligible,
    nonQualifying,
  }
}
