import { requiredDirections } from '../../domain/library/items'
import { sequenceFor } from '../../domain/library/catalog'
import { hasTestAnswer } from '../../domain/study/cueLadder'
import { journeyFor } from '../../domain/study/journey'
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

export function itemStanding(topic: Topic, item: Item, phase = journeyFor(topic).phase): ItemStanding {
  const evidence = item.id ? topic.itemEvidence?.[item.id] : undefined
  if (hasTestAnswer(evidence)) {
    const directions = requiredDirections(item).map((direction) => evidence!.directions[direction])
    if (directions.some((seen) => seen && seen.attempts > 0 && seen.consecutiveCorrect === 0)) {
      return phase === 'repair' ? 'repair' : 'missed'
    }
    if (directions.every((seen) => (seen?.consecutiveCorrect ?? 0) > 0)) return 'settled'
    return 'seen'
  }
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
  const entry = (item: Item, marker: string): TopicItemEntry => ({ item, marker, standing: itemStanding(topic, item, phase) })
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

/** Items whose standing is settled: the header bar's value. */
export function settledCount(topic: Topic): number {
  const phase = journeyFor(topic).phase
  return topic.items.filter((item) => itemStanding(topic, item, phase) === 'settled').length
}
