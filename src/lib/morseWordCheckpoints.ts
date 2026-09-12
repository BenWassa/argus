import { lessonPackets } from './morseLesson'
import { morseLessonPath, type MorseLessonPathItem } from './morseLessonPath'
import type { MorseLetter } from './morse'
import type { Topic } from './types'

export type MorseWordCheckpointId = 'after-4' | 'after-7'

interface CuratedCheckpoint {
  id: MorseWordCheckpointId
  afterLesson: 4 | 7
  warmups: readonly MorseLetter[]
  words: readonly string[]
}

export interface MorseWordCheckpoint {
  id: MorseWordCheckpointId
  afterLesson: 4 | 7
  warmups: MorseLetter[]
  words: string[]
  eligibleLetters: MorseLetter[]
}

export interface MorseWordCheckpointPathItem extends MorseWordCheckpoint {
  unlocked: boolean
}

export interface MorseCheckpointTarget {
  kind: 'warmup' | 'word'
  letter: MorseLetter
  word: string | null
  wordIndex: number | null
  characterIndex: number | null
}

const CURATED_CHECKPOINTS: readonly CuratedCheckpoint[] = [
  {
    id: 'after-4',
    afterLesson: 4,
    warmups: ['E', 'T', 'A', 'U'],
    words: ['TIME'],
  },
  {
    id: 'after-7',
    afterLesson: 7,
    warmups: ['R', 'D', 'K', 'H'],
    words: ['TRAIN', 'GARDEN'],
  },
]

/** Canonical letters introduced through a lesson milestone, derived only from lessonPackets(). */
export function checkpointEligibleLetters(afterLesson: number): MorseLetter[] {
  const packets = lessonPackets()
  if (!Number.isInteger(afterLesson) || afterLesson < 1 || afterLesson > packets.length) {
    throw new RangeError(`Checkpoint lesson must be between 1 and ${packets.length}.`)
  }

  const seen = new Set<MorseLetter>()
  for (const packet of packets.slice(0, afterLesson)) {
    for (const glyph of packet.novel) seen.add(glyph)
  }
  return [...seen]
}

function validateCheckpoint(definition: CuratedCheckpoint): MorseWordCheckpoint {
  const eligibleLetters = checkpointEligibleLetters(definition.afterLesson)
  const eligible = new Set<MorseLetter>(eligibleLetters)

  if (definition.warmups.length !== 4) {
    throw new Error(`${definition.id} must contain exactly four warm-up letters.`)
  }

  const validateLetter = (letter: string, source: string): MorseLetter => {
    if (letter.length !== 1 || !eligible.has(letter as MorseLetter)) {
      throw new Error(`${definition.id} contains ineligible ${source} letter ${letter}.`)
    }
    return letter as MorseLetter
  }

  const warmups = definition.warmups.map((letter) => validateLetter(letter, 'warm-up'))
  const words = definition.words.map((word) => {
    const normalized = word.toUpperCase()
    if (!normalized || !/^[A-Z]+$/.test(normalized)) {
      throw new Error(`${definition.id} contains invalid word ${word}.`)
    }
    for (const letter of normalized) validateLetter(letter, `word ${normalized}`)
    return normalized
  })

  return {
    id: definition.id,
    afterLesson: definition.afterLesson,
    warmups,
    words,
    eligibleLetters,
  }
}

/** Tiny deterministic corpus, validated mechanically against the live packet authority. */
export function morseWordCheckpoints(): MorseWordCheckpoint[] {
  return CURATED_CHECKPOINTS.map(validateCheckpoint)
}

/**
 * A milestone is available once its lesson is complete now, or once any later
 * lesson has been reached. The latter is durable proof the milestone was
 * completed before a returning-item repair moved the canonical current lesson
 * backwards.
 */
export function checkpointUnlocked(
  path: readonly MorseLessonPathItem[],
  afterLesson: number,
): boolean {
  const milestoneIndex = afterLesson - 1
  const milestone = path[milestoneIndex]
  if (!milestone) return false
  if (milestone.state === 'completed') return true
  return path.slice(afterLesson).some((lesson) => lesson.state !== 'locked')
}

export function morseWordCheckpointPath(topic: Topic): MorseWordCheckpointPathItem[] | null {
  const lessonPath = morseLessonPath(topic)
  if (!lessonPath) return null
  return morseWordCheckpoints().map((checkpoint) => ({
    ...checkpoint,
    unlocked: checkpointUnlocked(lessonPath, checkpoint.afterLesson),
  }))
}

/**
 * True exactly on the crossing (#88): `afterLesson` was locked in `before` and
 * is unlocked in `after`.
 *
 * `checkpointUnlocked` is forever-true once a milestone is reached, so reading
 * it alone at render time cannot tell "just now" from "weeks ago" — the same
 * reason a later repair that regresses and re-settles an older lesson must not
 * replay the first-unlock moment, because by then a later lesson had already
 * kept the checkpoint unlocked throughout. Comparing two path snapshots, rather
 * than reading one index, is what stays correct if lesson support changes.
 */
export function checkpointNewlyUnlocked(
  before: readonly MorseLessonPathItem[],
  after: readonly MorseLessonPathItem[],
  afterLesson: number,
): boolean {
  return !checkpointUnlocked(before, afterLesson) && checkpointUnlocked(after, afterLesson)
}

/** Flatten the fixed warm-up → word run without creating a progress or practice subsystem. */
export function checkpointTargets(checkpoint: MorseWordCheckpoint): MorseCheckpointTarget[] {
  const targets: MorseCheckpointTarget[] = checkpoint.warmups.map((letter) => ({
    kind: 'warmup',
    letter,
    word: null,
    wordIndex: null,
    characterIndex: null,
  }))

  checkpoint.words.forEach((word, wordIndex) => {
    Array.from(word).forEach((letter, characterIndex) => {
      targets.push({
        kind: 'word',
        letter: letter as MorseLetter,
        word,
        wordIndex,
        characterIndex,
      })
    })
  })

  return targets
}
