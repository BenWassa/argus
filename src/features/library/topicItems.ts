import { requiredDirections } from '../../domain/library/items'
import { sequenceFor } from '../../domain/library/catalog'
import { hasTestAnswer } from '../../domain/study/cueLadder'
import { journeyFor } from '../../domain/study/journey'
import { lastTestMissedIds } from '../../domain/study/practiceTargets'
import type { Item, Topic } from '../../domain/library/topic'

/**
 * Where one item of an ordinary topic stands, read from what is already
 * durable. Nothing here is stored and nothing reads a clock.
 *
 * Per-item evidence exists only where Test wrote it (choice, ladder and audio
 * cards). A reveal-and-grade item has none, so it takes the topic's own rung:
 * a banked topic passed a run of every item, and anything else is seen once
 * tested and unseen before. Copper marks only an item with a recorded miss; a
 * decayed topic says so once, in its header, rather than on every row.
 */
export type ItemStanding = 'settled' | 'missed' | 'seen' | 'unseen' | 'repair'

export function itemStanding(
  topic: Topic,
  item: Item,
  phase = journeyFor(topic).phase,
  lastMissed: readonly string[] = lastTestMissedIds(topic),
): ItemStanding {
  const evidence = item.id ? topic.itemEvidence?.[item.id] : undefined
  if (hasTestAnswer(evidence)) {
    const directions = requiredDirections(item).map((direction) => evidence!.directions[direction])
    if (directions.some((seen) => seen && seen.attempts > 0 && seen.consecutiveCorrect === 0)) {
      return phase === 'repair' ? 'repair' : 'missed'
    }
    if (directions.every((seen) => (seen?.consecutiveCorrect ?? 0) > 0)) return 'settled'
    return 'seen'
  }
  // No per-item evidence: the last Test is the only record of a miss.
  if (item.id && lastMissed.includes(item.id)) return phase === 'repair' ? 'repair' : 'missed'
  if (phase === 'banked') return 'settled'
  return topic.history.length > 0 ? 'seen' : 'unseen'
}

export interface TopicItemEntry {
  item: Item
  /** The visible marker: an authored sequence letter, or the item's number. */
  marker: string
  standing: ItemStanding
}

export interface TopicItemGroup {
  /** Present only for an authored sequence (ACTS, PROVE). */
  label?: string
  entries: TopicItemEntry[]
}

/** The scored set in reading order, grouped where the catalog authored a sequence. */
export function topicItemGroups(topic: Topic): TopicItemGroup[] {
  const phase = journeyFor(topic).phase
  const lastMissed = lastTestMissedIds(topic)
  const entry = (item: Item, marker: string): TopicItemEntry => ({ item, marker, standing: itemStanding(topic, item, phase, lastMissed) })
  const groups = sequenceFor(topic)?.groups
  if (groups) {
    return groups.map((group) => ({
      label: group.label,
      entries: group.itemIds.flatMap((id, index) => {
        const item = topic.items.find((candidate) => candidate.id === id)
        return item ? [entry(item, Array.from(group.letters)[index] ?? String(index + 1))] : []
      }),
    }))
  }
  return [{ entries: topic.items.map((item, index) => entry(item, String(index + 1))) }]
}

/** Items whose standing is settled. */
export function settledCount(topic: Topic): number {
  const phase = journeyFor(topic).phase
  const lastMissed = lastTestMissedIds(topic)
  return topic.items.filter((item) => itemStanding(topic, item, phase, lastMissed) === 'settled').length
}

export interface TopicBar {
  value: number
  max: number
  /** The bar's accessible name. */
  label: string
}

/**
 * The header bar's value, from the best record the topic has.
 *
 * Settled items lead. A reveal-and-grade topic writes no per-item evidence, so
 * once it is out of the banked state nothing is "settled" even straight after a
 * 22 of 26 Test; the bar then reads that Test instead of a false 0. With no
 * settled item and no Test to read there is no value, and no bar is drawn.
 */
export function topicBar(topic: Topic): TopicBar | null {
  const total = topic.items.length
  if (total === 0) return null
  const settled = settledCount(topic)
  const recent = topic.history[topic.history.length - 1]
  // Only a Test that still describes this topic reads: one taken before the
  // item set was edited, or one whose outcome the status no longer reflects
  // (a topic that fell into repair on a pass), would say something untrue.
  const last = recent && recent.total === total && recent.resolvedTo === topic.status ? recent : undefined
  const tested = last ? last.correct : 0
  if (tested > settled) {
    return { value: tested, max: total, label: `${tested} of ${total} correct in the last Test` }
  }
  if (settled > 0) {
    return { value: settled, max: total, label: `${settled} of ${total} ${total === 1 ? 'item' : 'items'} settled` }
  }
  // A real Test that got nothing right is a reading; having no Test is not.
  if (last) {
    return { value: 0, max: total, label: `0 of ${total} correct in the last Test` }
  }
  return null
}
