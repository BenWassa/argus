import { identifiedItem, requiredDirections } from './items'
import type { IdentifiedItem, Item, ItemCueEvidence, ItemDirection, Topic } from './types'

/**
 * How many items one practice run may ask.
 *
 * Practice exists because a full twenty-six card deck is the wrong answer to
 * four wrong letters. A bound that is itself most of the deck would give the
 * shorter run back, so it stays well under a full sitting. Ten matches the
 * lesson sitting and the replay limit, which is the pace the learner already
 * knows a formative run to have.
 */
export const PRACTICE_LIMIT = 10

/**
 * One direction of one item, and why practice wants it.
 *
 * `missed` is the direction whose last recorded answer was wrong. `untried` is
 * a direction the item's own content semantics require but which holds no
 * evidence at all. Both are weaknesses; only the first is a failure, and the
 * copy on the way in is allowed to tell them apart.
 */
export type PracticeReason = 'missed' | 'untried'

export interface PracticeTarget {
  item: IdentifiedItem
  direction: ItemDirection
  reason: PracticeReason
}

/**
 * Whether this direction's durable evidence describes a miss that still stands.
 *
 * `consecutiveCorrect` is the whole test. It is zeroed by a wrong answer and
 * rebuilt by right ones, so a direction that has been attempted and whose
 * streak is zero is precisely a direction whose most recent answer was wrong.
 * Nothing needs to be remembered about *which run* that was: a later correct
 * answer lifts the streak off zero and the direction stops being a target on
 * its own, which is exactly the behaviour "the next check is what re-earns it"
 * describes.
 *
 * This is why practice needs no new durable field. The signal it selects on is
 * already written, already migrated, and already the thing the cue ladder
 * itself reads.
 */
function directionMissed(evidence: ItemCueEvidence | undefined, direction: ItemDirection): boolean {
  const seen = evidence?.directions?.[direction]
  if (!seen) return false
  return seen.attempts > 0 && seen.consecutiveCorrect === 0
}

function directionUntried(evidence: ItemCueEvidence | undefined, direction: ItemDirection): boolean {
  const seen = evidence?.directions?.[direction]
  return !seen || seen.attempts === 0
}

/**
 * When this direction was last answered, as a sort key.
 *
 * A missing or unparseable timestamp sorts oldest rather than throwing: an
 * imported v2 library can carry evidence with no `lastAt`, and a practice run
 * that refuses to start because a date is absent would be a worse outcome than
 * one whose order is merely less informative.
 */
function lastAtMs(evidence: ItemCueEvidence | undefined, direction: ItemDirection): number {
  const raw = evidence?.directions?.[direction]?.lastAt
  if (!raw) return 0
  const parsed = Date.parse(raw)
  return Number.isNaN(parsed) ? 0 : parsed
}

/**
 * Every direction this topic currently has reason to practise, weakest first.
 *
 * Order is "most recently missed first, then untried", because the miss the
 * learner just made is the one they came here about. Ties fall back to the
 * topic's own item order so the sequence is deterministic for a given library —
 * practice is a formative run, but a run that shuffles differently on every
 * mount would make it impossible to test and unpleasant to repeat.
 *
 * Untried directions are included so that practice remains useful for an
 * ordinary topic the learner has read but never tested. They sort after real
 * misses and never displace one.
 */
export function practiceTargets(topic: Topic): PracticeTarget[] {
  const evidenceStore = topic.itemEvidence ?? {}
  const missed: (PracticeTarget & { at: number; order: number })[] = []
  const untried: (PracticeTarget & { at: number; order: number })[] = []

  topic.items.forEach((item: Item, order) => {
    // A v4 fixture can still carry an item with no id. `identifiedItem` gives
    // one a stable shape to render; an item with no id has no evidence to read
    // either, so it can only ever arrive here as untried.
    const identified = item.id && item.kind ? (item as IdentifiedItem) : identifiedItem(item)
    const evidence = item.id ? evidenceStore[item.id] : undefined

    for (const direction of requiredDirections(identified)) {
      if (directionMissed(evidence, direction)) {
        missed.push({
          item: identified,
          direction,
          reason: 'missed',
          at: lastAtMs(evidence, direction),
          order,
        })
      } else if (directionUntried(evidence, direction)) {
        untried.push({
          item: identified,
          direction,
          reason: 'untried',
          at: lastAtMs(evidence, direction),
          order,
        })
      }
    }
  })

  // Most recent miss first; oldest untried first. Both then fall back to the
  // topic's item order, which is stable across mounts and across reloads.
  missed.sort((a, b) => b.at - a.at || a.order - b.order)
  untried.sort((a, b) => a.at - b.at || a.order - b.order)

  return [...missed, ...untried]
    .slice(0, PRACTICE_LIMIT)
    .map(({ item, direction, reason }) => ({ item, direction, reason }))
}

/**
 * The targets for an explicitly named set of items.
 *
 * This is the path a check's end screen takes. It matters because an ordinary
 * reveal-and-grade topic writes no per-item evidence at all — only the
 * progressive cue-ladder cards do — so for most topics the run that just ended
 * is the *only* thing that knows what was missed. Handing the ids over keeps
 * that knowledge usable for one run without inventing a durable field to store
 * it in, which is exactly the boundary batch 5 was given.
 *
 * Directions come from the item's own content semantics rather than from
 * evidence, because for those topics there is no evidence to read. An item
 * named here is asked every way it can be asked, up to the run's limit.
 */
export function targetsForItems(topic: Topic, itemIds: string[]): PracticeTarget[] {
  const wanted = new Set(itemIds)
  const targets: PracticeTarget[] = []

  for (const item of topic.items) {
    if (!item.id || !wanted.has(item.id)) continue
    const identified = item.kind ? (item as IdentifiedItem) : identifiedItem(item)
    const evidence = topic.itemEvidence?.[item.id]

    for (const direction of requiredDirections(identified)) {
      // Where evidence does exist, a direction the learner has clean is not
      // worth re-asking just because its sibling failed.
      if (evidence && !directionMissed(evidence, direction) && !directionUntried(evidence, direction)) {
        continue
      }
      targets.push({ item: identified, direction, reason: 'missed' })
    }
  }

  return targets.slice(0, PRACTICE_LIMIT)
}

/**
 * The targets practice would ask *because they were missed*.
 *
 * The offer to practise is made on this and not on `practiceTargets`, so that a
 * freshly authored topic with no evidence at all does not advertise repair work
 * it has no grounds to claim. Untried directions still get asked once a run
 * starts and there is room for them.
 */
export function missedTargets(topic: Topic): PracticeTarget[] {
  return practiceTargets(topic).filter((target) => target.reason === 'missed')
}

/**
 * Whether the topic page and a check's end screen should offer practice.
 *
 * Deliberately narrower than "has any practice target": the offer follows a
 * real miss. A topic that has simply never been tested is served by its Test
 * action, not by an offer to repair something that never broke.
 */
export function hasPractice(topic: Topic): boolean {
  return missedTargets(topic).length > 0
}

/**
 * How many distinct items a practice offer should name.
 *
 * The learner counts letters, not directions. A bidirectional item that missed
 * both ways is one thing to go and fix, and an offer that called it two would
 * overstate the damage every time.
 */
export function practiceItemCount(topic: Topic): number {
  return new Set(missedTargets(topic).map((target) => target.item.id)).size
}
