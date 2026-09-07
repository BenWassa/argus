import { morseAcquisitionProfile, type AcquisitionCharacter } from './acquisition'
import {
  firstUnsettledPacket,
  lessonPackets,
  type LessonEntry,
  type LessonRun,
} from './morseLesson'
import type { MorseLetter } from './morse'
import type { Topic } from './types'

export type MorseLessonPathState = 'completed' | 'current' | 'unlocked' | 'locked'

export interface MorseLessonPathItem {
  /** Zero-based curriculum packet index. */
  index: number
  /** Human-facing 1-based lesson number. */
  number: number
  /** The two mappings introduced by this lesson. */
  novel: MorseLetter[]
  /** Previously learned mappings deliberately interleaved by the packet policy. */
  review: MorseLetter[]
  state: MorseLessonPathState
  replayable: boolean
}

function identity(topic: Topic): Map<MorseLetter, AcquisitionCharacter> | null {
  const profile = morseAcquisitionProfile(topic)
  if (!profile || profile.size !== 26) return null
  const byGlyph = new Map<MorseLetter, AcquisitionCharacter>()
  for (const character of profile.values()) byGlyph.set(character.glyph as MorseLetter, character)
  return byGlyph.size === 26 ? byGlyph : null
}

/**
 * The visible curriculum path (#75), derived from the same packets and durable
 * support store that drive Learn. There is no second unlock/progress database.
 *
 * A later lesson having any durable novel-item support is proof that it was
 * reached. That matters when a returning miss temporarily sends the current
 * acquisition policy back to repair an older packet: already reached later
 * lessons stay visibly unlocked rather than pretending the learner never saw
 * them.
 */
export function morseLessonPath(topic: Topic): MorseLessonPathItem[] | null {
  const byGlyph = identity(topic)
  if (!byGlyph) return null
  const packets = lessonPackets()
  const store = topic.lessonProgress ?? {}
  const currentIndex = firstUnsettledPacket(packets, byGlyph, store)

  let highestReached = 0
  for (const packet of packets) {
    if (packet.index === 0 || packet.novel.some((glyph) => {
      const character = byGlyph.get(glyph)
      return character ? store[character.itemId] !== undefined : false
    })) {
      highestReached = Math.max(highestReached, packet.index)
    }
  }

  const ready = currentIndex >= packets.length

  return packets.map((packet) => {
    let state: MorseLessonPathState
    if (ready || packet.index < currentIndex) state = 'completed'
    else if (packet.index === currentIndex) state = 'current'
    else if (packet.index <= highestReached) state = 'unlocked'
    else state = 'locked'

    return {
      index: packet.index,
      number: packet.index + 1,
      novel: [...packet.novel],
      review: [...packet.review],
      state,
      replayable: state === 'completed' || state === 'unlocked',
    }
  })
}

/**
 * Build an ephemeral refresher for an already reached lesson.
 *
 * Every roster mapping starts uncued (`solo`) and introduced. A correct answer
 * settles it locally; a miss may restore local support and reteach inside the
 * replay, but none of that run is persisted by the replay surface. This is real
 * formative retrieval without rewriting the canonical lesson, Test evidence,
 * retention state or an in-progress sitting.
 */
export function startReplayLesson(topic: Topic, packetIndex: number): LessonRun | null {
  const path = morseLessonPath(topic)
  const byGlyph = identity(topic)
  if (!path || !byGlyph) return null
  const pathItem = path[packetIndex]
  if (!pathItem?.replayable) return null

  const packet = lessonPackets()[packetIndex]
  if (!packet) return null

  const entries: LessonEntry[] = packet.characters.map((glyph, order) => {
    const character = byGlyph.get(glyph)
    if (!character) throw new Error(`Missing Morse acquisition character ${glyph}.`)
    return {
      itemId: character.itemId,
      glyph,
      pattern: character.pattern,
      novel: packet.novel.includes(glyph),
      support: 'solo',
      introduced: true,
      asked: false,
      done: false,
      notBefore: 0,
      lastAskedAt: null,
      order,
    }
  })

  return {
    topicId: topic.id,
    packetIndex,
    packetCount: lessonPackets().length,
    step: 0,
    entries,
    feedback: null,
    complete: false,
    finished: false,
  }
}
