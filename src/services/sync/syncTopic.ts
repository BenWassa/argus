import { parseLibrary } from '../../infrastructure/persistence/libraryParser'
import type { Topic } from '../../domain/library/topic'

/**
 * A topic arriving from another device goes through the same v5 parse boundary
 * a stored or imported one does. Nothing reaches the library that could not
 * have been loaded from disk, so sync cannot widen what a topic is allowed to
 * be — which is the whole reason the record travels as its own JSON.
 */
export function parseSyncedTopic(json: string, topicId?: string): Topic | null {
  try {
    const parsed: unknown = JSON.parse(json)
    if (!parsed || typeof parsed !== 'object') return null
    const result = parseLibrary({ version: 5, topics: [parsed] })
    if (!result.ok || result.library.topics.length !== 1) return null
    const topic = result.library.topics[0]
    // A document filed under one topic that holds another is damaged, and
    // taking it would overwrite the wrong topic.
    if (topicId !== undefined && topic.id !== topicId) return null
    return topic
  } catch {
    return null
  }
}

