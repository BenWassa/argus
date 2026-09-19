import { morseAcquisitionProfile, type AcquisitionCharacter } from '../testing/acquisitionProfile'
import {
  firstUnsettledPacket,
  lessonPackets,
  startLesson,
  type LessonRun,
} from './lesson'
import type { MorseLetter } from '../code'
import type { ItemLessonStore } from '../progress'
import type { Topic } from '../../library/topic'

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
 * The learner's lesson record as it stood the moment `packetIndex` was first
 * opened: everything before it settled, and the lesson itself untouched.
 *
 * This is the whole of the replay mechanism (#117). Replay is not a second
 * curriculum with its own entry builder — it is the canonical lesson builder
 * asked to answer the question it always answers, about an earlier position.
 * Feeding `startLesson` a rewound copy is what guarantees a replay cannot drift
 * from first-time acquisition: the packet, the roster, the novel pair, the
 * interleaved review selection and the introduce-then-retrieve shape are all
 * produced by exactly the code that produced them the first time.
 *
 * The copy exists only for the length of this call. It is never persisted, and
 * the real topic's support, sitting, review history and evidence are untouched.
 */
function rewoundTopic(
  topic: Topic,
  byGlyph: Map<MorseLetter, AcquisitionCharacter>,
  packetIndex: number,
): Topic {
  const progress: ItemLessonStore = {}
  for (const packet of lessonPackets().slice(0, packetIndex)) {
    for (const glyph of packet.characters) {
      const character = byGlyph.get(glyph)
      if (character) progress[character.itemId] = 'settled'
    }
  }
  return { ...topic, lessonProgress: progress }
}

/**
 * Build the replay of an already reached lesson: the same lesson the learner
 * met the first time, from its first-exposure introductions onward.
 *
 * Replay used to hand back a flat uncued quiz — every mapping `solo` and
 * already introduced — which is how a learner who asked to go back over Lesson
 * 1 was shown a bare glyph and a key instead of the rhythmic mnemonic, the
 * canonical pattern and the sound that taught it. #117 is explicit that this is
 * wrong: replay reruns the acquisition progression, it does not substitute a
 * simplified review for it.
 *
 * What still differs is consequence, and consequence alone. The run is built
 * from a rewound copy, so nothing here reads or moves durable state, and the
 * surface running it suppresses every write at the record boundary.
 */
export function startReplayLesson(topic: Topic, packetIndex: number): LessonRun | null {
  const path = morseLessonPath(topic)
  const byGlyph = identity(topic)
  if (!path || !byGlyph) return null
  if (!path[packetIndex]?.replayable) return null

  return startLesson(rewoundTopic(topic, byGlyph, packetIndex))
}

/**
 * The next lesson a replay should offer, or `null` at the end of the
 * curriculum. Replay walks the printed order rather than the learner's durable
 * position, because the durable position is exactly what it is not moving.
 */
export function nextReplayLesson(topic: Topic, packetIndex: number): LessonRun | null {
  return packetIndex + 1 < lessonPackets().length
    ? startReplayLesson(topic, packetIndex + 1)
    : null
}
