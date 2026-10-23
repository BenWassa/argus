// Durable lesson support deltas, topic merging and removed-item pruning.
import type { Topic } from '../../../library/topic'
import type { ItemLessonStore } from '../../progress'
import type { LessonRun } from './support'

/** The durable delta: one support level per roster item, and nothing else. */
export function lessonProgressOf(run: LessonRun): ItemLessonStore {
  const store: ItemLessonStore = {}
  for (const entry of run.entries) {
    if (entry.introduced) store[entry.itemId] = entry.support
  }
  return store
}

/**
 * Apply lesson progress to a topic without touching anything else about it.
 *
 * Deliberately the only function in this module that sees a `Topic`, and it
 * copies every other field through verbatim, so lesson state, cue state and
 * retention state stay independently observable and independently settable.
 */
export function withLessonProgress(topic: Topic, updates: ItemLessonStore): Topic {
  if (Object.keys(updates).length === 0) return topic
  const current = topic.lessonProgress ?? {}
  // Settled acquisition is permanent. A run may restore scaffolding after a
  // miss, but its local support must not reopen a completed lesson.
  const durable = Object.fromEntries(Object.entries(updates).map(([id, support]) =>
    [id, current[id] === 'settled' ? 'settled' : support]))
  const merged = { ...current, ...durable }
  const unchanged =
    Object.keys(merged).length === Object.keys(current).length &&
    Object.entries(merged).every(([itemId, support]) => current[itemId] === support)
  if (unchanged) return topic
  return { ...topic, lessonProgress: merged }
}

/** Drop lesson progress for items an author has removed. */
export function pruneLessonProgress(
  store: ItemLessonStore | undefined,
  items: { id?: string }[],
): ItemLessonStore {
  if (!store) return {}
  const live = new Set(items.flatMap((item) => (item.id ? [item.id] : [])))
  return Object.fromEntries(Object.entries(store).filter(([itemId]) => live.has(itemId)))
}

