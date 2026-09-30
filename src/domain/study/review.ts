import { requiredDirections } from '../library/items'
import type { Item, Topic } from '../library/topic'
import type { ItemCueEvidence } from './evidence'
import { journeyFor } from './journey'

/**
 * A short review, chosen by the learner beside the full check.
 *
 * Once the alphabet is acquired, a full check asks all twenty-six letters and
 * can move the ladder. Some days the learner wants a few minutes over the
 * letters they hold least firmly instead, so the topic page offers both and the
 * learner picks (owner, 2026-09-29: the learner chooses when to test).
 *
 * A review asks `REVIEW_LENGTH` letters, weakest first, uncued, and records the
 * answers as the per-item evidence they are. It is not an attempt: it resolves
 * nothing, appends no history and touches no scheduler field, so the full check
 * keeps its whole-deck contract exactly as before.
 */
export const REVIEW_LENGTH = 10

/**
 * True when this topic can run a review at all: a progressive topic whose
 * acquisition is finished, where every answer is uncued and per-item evidence
 * exists to choose from. Whether a run *is* a review is the learner's choice,
 * carried on the route; a topic needing repair is offered only the full check.
 */
export function isReviewTopic(topic: Topic): boolean {
  const journey = journeyFor(topic)
  return (
    journey.acquisition.progressive &&
    journey.acquisition.ready &&
    journey.action === 'test' &&
    journey.phase !== 'repair' &&
    topic.items.length > 0
  )
}

interface Ranked {
  item: Item
  tier: number
  /** Within a tier, lower comes first. */
  key: number
  order: number
}

function stamp(raw: string | null | undefined): number {
  if (!raw) return 0
  const parsed = Date.parse(raw)
  return Number.isNaN(parsed) ? 0 : parsed
}

function rank(item: Item, evidence: ItemCueEvidence | undefined, order: number): Ranked {
  const directions = requiredDirections(item).map((direction) => evidence?.directions?.[direction])

  const missed = directions.filter((seen) => seen && seen.attempts > 0 && seen.consecutiveCorrect === 0)
  if (missed.length > 0) {
    // Most recent miss first.
    return { item, tier: 0, key: -Math.max(...missed.map((seen) => stamp(seen?.lastAt))), order }
  }

  if (directions.some((seen) => !seen || seen.attempts === 0)) {
    return { item, tier: 1, key: 0, order }
  }

  const attempts = directions.reduce((sum, seen) => sum + (seen?.attempts ?? 0), 0)
  const unaided = directions.reduce((sum, seen) => sum + (seen?.unassistedCorrect ?? 0), 0)
  const accuracy = attempts === 0 ? 0 : unaided / attempts
  const lastAt = Math.max(...directions.map((seen) => stamp(seen?.lastAt)))

  // Shaky letters next, least accurate first; then everything else, least
  // recently asked first, so successive reviews rotate through the roster
  // instead of re-asking the same ten.
  return accuracy < 0.8
    ? { item, tier: 2, key: accuracy, order }
    : { item, tier: 3, key: lastAt, order }
}

/** The items a review asks, weakest first. Order within the run is the caller's. */
export function reviewItems(topic: Topic, count: number = REVIEW_LENGTH): Item[] {
  return topic.items
    .map((item, order) => rank(item, item.id ? topic.itemEvidence?.[item.id] : undefined, order))
    .sort((a, b) => a.tier - b.tier || a.key - b.key || a.order - b.order)
    .slice(0, count)
    .map((ranked) => ranked.item)
}
