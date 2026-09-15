import { hasLaterSittingSuccess, hasListeningCoverage, sittingsSinceSeen } from './morseReview'
import type { LessonSupport, MorseReviewProgress } from './types'

/**
 * How urgently a character wants retrieving (#90 §2).
 *
 * The issue asks for "a transparent weighted priority with documented
 * invariants" rather than an opaque formula presented as optimal, so every term
 * here is a plain number with a stated reason, and the weights are spaced far
 * enough apart that the ordering between categories is decided by the category
 * and not by an accumulation of smaller terms. That is what makes the tests
 * below able to assert "weak outranks strong" as a rule rather than as an
 * observation about particular values.
 *
 * Higher is more urgent. The terms, in the order they dominate:
 *
 *   unconsolidated   a character that has never survived a gap between sittings
 *                    is the whole point of the programme's later stages, and
 *                    outranks everything else (#90 §4)
 *   support          scaffolding still on screen means the character is not yet
 *                    produced unaided; weaker support is more urgent
 *   staleness        sittings since it was last retrieved in print, capped so a
 *                    long-untouched character cannot outrank an actively weak one
 *   listening        a character never met in sound wants a slot, but this is
 *                    the smallest term: it is formative support for printed
 *                    recall, not a claim of its own (#90 §5, and #29 keeps the
 *                    auditory boundary)
 */
export const PRIORITY_UNCONSOLIDATED = 100
export const PRIORITY_PER_SUPPORT_RUNG = 20
export const PRIORITY_PER_STALE_SITTING = 3
export const PRIORITY_STALENESS_CAP = 5
export const PRIORITY_NO_LISTENING = 1

/**
 * Support rungs, weakest first. A character still being taught wants retrieval
 * more than one already produced solo, which wants it more than a settled one.
 */
const SUPPORT_URGENCY: Record<LessonSupport, number> = {
  taught: 3,
  cued: 2,
  solo: 1,
  settled: 0,
}

export interface PriorityCandidate {
  itemId: string
  support: LessonSupport
  /** Position in the acquisition order. The stable tie-break. */
  order: number
}

/**
 * Score one candidate. Pure, and deliberately independent of React, storage and
 * the clock, so the whole-programme simulations can drive it directly.
 */
export function retrievalPriority(
  candidate: PriorityCandidate,
  review: MorseReviewProgress,
): number {
  const { itemId, support } = candidate

  const unconsolidated = hasLaterSittingSuccess(review, itemId) ? 0 : PRIORITY_UNCONSOLIDATED
  const scaffolding = SUPPORT_URGENCY[support] * PRIORITY_PER_SUPPORT_RUNG
  const stale =
    Math.min(sittingsSinceSeen(review, itemId), PRIORITY_STALENESS_CAP) * PRIORITY_PER_STALE_SITTING
  const unheard = hasListeningCoverage(review, itemId) ? 0 : PRIORITY_NO_LISTENING

  return unconsolidated + scaffolding + stale + unheard
}

/**
 * Order candidates most urgent first.
 *
 * Ties fall back to acquisition order, which is fixed for a given topic. That
 * is the "stable seeded tie-breaking" #90 §2 asks for: repeatable in tests
 * without teaching the learner one permanently fixed sequence, because the
 * priority terms themselves move as the learner's history moves.
 */
export function byRetrievalPriority(
  review: MorseReviewProgress,
): (a: PriorityCandidate, b: PriorityCandidate) => number {
  return (a, b) => {
    const need = retrievalPriority(b, review) - retrievalPriority(a, review)
    if (need !== 0) return need

    // The original final acquisition-order tie-break was deterministic, but
    // it also meant that an otherwise equal E was always selected before a
    // later character. `printed` is not another need term: it only shares a
    // tie with genuinely equal need, and gives the less-exposed character the
    // next turn. It is durable so reload cannot reset the fairness rule.
    const printed = (review.items[a.itemId]?.printed ?? 0) - (review.items[b.itemId]?.printed ?? 0)
    if (printed !== 0) return printed
    return a.order - b.order
  }
}
