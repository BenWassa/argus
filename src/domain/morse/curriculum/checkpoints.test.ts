import { describe, expect, it } from 'vitest'
import { lessonPackets } from './lesson'
import { morseLessonPath } from './lessonPath'
import type { MorseLetter } from '../code'
import {
  checkpointEligibleLetters,
  checkpointNewlyUnlocked,
  checkpointTargetKey,
  checkpointTargets,
  morseWordCheckpointPath,
  morseWordCheckpoints,
  withCheckpointRetry,
} from './checkpoints'
import { parseLibrary } from '../../../infrastructure/persistence/libraryParser'
import { seedLibrary } from '../../library/catalogSeed'
import type { Topic } from '../../library/topic'
import type { ItemLessonStore } from '../progress'

const MORSE_ID = 'international-morse-letters-printed'

function topic(): Topic {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  const found = parsed.library.topics.find((candidate) => candidate.id === MORSE_ID)
  if (!found) throw new Error('Missing seeded Morse topic.')
  return found
}

function itemIdForGlyph(value: Topic, glyph: string): string {
  const item = value.items.find((candidate) => candidate.prompt === glyph)
  if (!item?.id) throw new Error(`Missing item for ${glyph}.`)
  return item.id
}

function settledThroughLesson(value: Topic, lessonNumber: number): Topic {
  const progress: ItemLessonStore = { ...(value.lessonProgress ?? {}) }
  for (const packet of lessonPackets().slice(0, lessonNumber)) {
    for (const glyph of packet.characters) progress[itemIdForGlyph(value, glyph)] = 'settled'
  }
  return { ...value, lessonProgress: progress }
}

describe('Morse word checkpoint curriculum', () => {
  it('derives every milestone letter set mechanically from canonical lessonPackets()', () => {
    for (const lesson of [4, 7, 10, 13]) {
      const expected = lessonPackets().slice(0, lesson).flatMap((packet) => packet.novel)
      expect(checkpointEligibleLetters(lesson)).toEqual(expected)
    }

    expect(checkpointEligibleLetters(4)).toEqual(['E', 'I', 'T', 'A', 'N', 'S', 'M', 'U'])
    expect(checkpointEligibleLetters(7)).toEqual(['E', 'I', 'T', 'A', 'N', 'S', 'M', 'U', 'R', 'D', 'W', 'K', 'G', 'H'])
    expect(checkpointEligibleLetters(7)).not.toContain('O')
    expect(checkpointEligibleLetters(13)).toHaveLength(26)
  })

  it('validates every curated warm-up and word against the live milestone set', () => {
    const checkpoints = morseWordCheckpoints()
    expect(checkpoints).toHaveLength(4)

    for (const checkpoint of checkpoints) {
      const eligible = new Set(checkpoint.eligibleLetters)
      expect(checkpoint.warmups).toHaveLength(4)
      expect(checkpoint.warmups.every((letter) => eligible.has(letter))).toBe(true)
      for (const word of checkpoint.words) {
        expect(Array.from(word).every((letter) => eligible.has(letter as MorseLetter))).toBe(true)
      }
    }

    expect(checkpoints[0].words).toEqual(['TIME'])
    expect(checkpoints[1].words).toEqual(['TRAIN', 'GARDEN'])
    expect(checkpoints[1].words.join('')).not.toContain('O')
    expect(checkpoints[2].warmups).toEqual(['V', 'F', 'B', 'P'])
    expect(checkpoints[2].words).toEqual(['FLOW', 'PLANT'])
    expect(checkpoints[3].warmups).toEqual(['X', 'C', 'J', 'Q'])
    expect(checkpoints[3].words).toEqual(['BOX', 'COZY', 'JAZZ', 'QUIZ'])

    const late = new Set(['X', 'C', 'Z', 'J', 'Y', 'Q'])
    const finalMaterial = `${checkpoints[3].warmups.join('')}${checkpoints[3].words.join('')}`
    for (const glyph of late) expect(finalMaterial).toContain(glyph)
  })

  it('unlocks exactly after lessons 4, 7, 10 and 13 without gating or renumbering the 13 lessons', () => {
    const fresh = topic()
    expect(morseLessonPath(fresh)).toHaveLength(13)
    expect(morseWordCheckpointPath(fresh)!.map((checkpoint) => checkpoint.unlocked)).toEqual([false, false, false, false])

    const after4 = settledThroughLesson(fresh, 4)
    expect(morseWordCheckpointPath(after4)!.map((checkpoint) => checkpoint.unlocked)).toEqual([true, false, false, false])
    expect(morseLessonPath(after4)).toHaveLength(13)
    expect(morseLessonPath(after4)![4].state).toBe('current')

    const after7 = settledThroughLesson(fresh, 7)
    expect(morseWordCheckpointPath(after7)!.map((checkpoint) => checkpoint.unlocked)).toEqual([true, true, false, false])
    expect(morseLessonPath(after7)).toHaveLength(13)
    expect(morseLessonPath(after7)![7].state).toBe('current')

    const after10 = settledThroughLesson(fresh, 10)
    expect(morseWordCheckpointPath(after10)!.map((checkpoint) => checkpoint.unlocked)).toEqual([true, true, true, false])
    expect(morseLessonPath(after10)).toHaveLength(13)
    expect(morseLessonPath(after10)![10].state).toBe('current')

    const after13 = settledThroughLesson(fresh, 13)
    expect(morseWordCheckpointPath(after13)!.map((checkpoint) => checkpoint.unlocked)).toEqual([true, true, true, true])
    expect(morseLessonPath(after13)).toHaveLength(13)
  })

  it('keeps reached checkpoints available when later repair moves canonical Learn backwards', () => {
    const base = settledThroughLesson(topic(), 13)
    const progress: ItemLessonStore = { ...(base.lessonProgress ?? {}) }
    progress[itemIdForGlyph(base, lessonPackets()[0].novel[0])] = 'cued'
    const repairing = { ...base, lessonProgress: progress }

    expect(morseLessonPath(repairing)![0].state).toBe('current')
    expect(morseWordCheckpointPath(repairing)!.map((checkpoint) => checkpoint.unlocked)).toEqual([true, true, true, true])
  })

  it('is a pure projection that cannot mutate saved learner state', () => {
    const value = settledThroughLesson(topic(), 13)
    const before = JSON.stringify(value)
    morseWordCheckpointPath(value)
    morseWordCheckpoints()
    expect(JSON.stringify(value)).toBe(before)
  })

  it('flags the exact crossing for #88 automatic handoff, never a render-time read of one path alone', () => {
    const fresh = topic()
    const before = morseLessonPath(fresh)!
    const after4 = morseLessonPath(settledThroughLesson(fresh, 4))!
    const after7 = morseLessonPath(settledThroughLesson(fresh, 7))!
    const after10 = morseLessonPath(settledThroughLesson(fresh, 10))!
    const after13 = morseLessonPath(settledThroughLesson(fresh, 13))!

    expect(checkpointNewlyUnlocked(before, after4, 4)).toBe(true)
    expect(checkpointNewlyUnlocked(before, after4, 7)).toBe(false)
    expect(checkpointNewlyUnlocked(after4, after7, 4)).toBe(false)
    expect(checkpointNewlyUnlocked(after4, after7, 7)).toBe(true)
    expect(checkpointNewlyUnlocked(after7, after10, 10)).toBe(true)
    expect(checkpointNewlyUnlocked(after10, after13, 13)).toBe(true)
  })

  it('does not re-flag a milestone when later repair regresses and re-settles an older lesson', () => {
    const base = settledThroughLesson(topic(), 13)
    const progress = { ...(base.lessonProgress ?? {}) }
    progress[itemIdForGlyph(base, lessonPackets()[0].novel[0])] = 'cued'
    const repairing = { ...base, lessonProgress: progress }
    const repaired = settledThroughLesson(repairing, 13)

    const duringRepair = morseLessonPath(repairing)!
    const afterRepair = morseLessonPath(repaired)!
    expect(checkpointNewlyUnlocked(duringRepair, afterRepair, 4)).toBe(false)
    expect(checkpointNewlyUnlocked(duringRepair, afterRepair, 13)).toBe(false)
  })

  it('flattens four warm-ups before deterministic whole-word character targets', () => {
    for (const checkpoint of morseWordCheckpoints()) {
      const targets = checkpointTargets(checkpoint)
      expect(targets.slice(0, 4).map((target) => target.kind)).toEqual(['warmup', 'warmup', 'warmup', 'warmup'])
      expect(targets.slice(4).filter((target) => target.kind === 'word').map((target) => target.letter).join('')).toBe(checkpoint.words.join(''))
    }
  })

  it('requeues one missed target after two intervening targets when available', () => {
    const targets = checkpointTargets(morseWordCheckpoints()[2])
    const missed = targets[4]
    const retried = withCheckpointRetry(targets, 4, missed)

    expect(retried).toHaveLength(targets.length + 1)
    expect(checkpointTargetKey(retried[7])).toBe(checkpointTargetKey(missed))
    expect(retried[5]).toBe(targets[5])
    expect(retried[6]).toBe(targets[6])
  })

  it('keeps retry insertion finite at the end of a checkpoint', () => {
    const targets = checkpointTargets(morseWordCheckpoints()[0])
    const last = targets.at(-1)!
    const retried = withCheckpointRetry(targets, targets.length - 1, last)
    expect(retried).toHaveLength(targets.length + 1)
    expect(checkpointTargetKey(retried.at(-1)!)).toBe(checkpointTargetKey(last))
  })
})
