import { describe, expect, it } from 'vitest'
import { lessonPackets } from './morseLesson'
import { morseLessonPath } from './morseLessonPath'
import {
  checkpointEligibleLetters,
  checkpointTargets,
  morseWordCheckpointPath,
  morseWordCheckpoints,
} from './morseWordCheckpoints'
import { parseLibrary } from './storage'
import { seedLibrary } from './seed'
import type { ItemLessonStore, Topic } from './types'

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
  it('derives milestone letters mechanically from canonical lessonPackets()', () => {
    const lesson4 = lessonPackets().slice(0, 4).flatMap((packet) => packet.novel)
    const lesson7 = lessonPackets().slice(0, 7).flatMap((packet) => packet.novel)

    expect(checkpointEligibleLetters(4)).toEqual(lesson4)
    expect(checkpointEligibleLetters(7)).toEqual(lesson7)
    expect(checkpointEligibleLetters(4)).toEqual(['E', 'I', 'T', 'A', 'N', 'S', 'M', 'U'])
    expect(checkpointEligibleLetters(7)).toEqual(['E', 'I', 'T', 'A', 'N', 'S', 'M', 'U', 'R', 'D', 'W', 'K', 'G', 'H'])
    expect(checkpointEligibleLetters(7)).not.toContain('O')
  })

  it('validates every curated warm-up and word against the live milestone set', () => {
    const checkpoints = morseWordCheckpoints()
    expect(checkpoints).toHaveLength(2)

    for (const checkpoint of checkpoints) {
      const eligible = new Set(checkpoint.eligibleLetters)
      expect(checkpoint.warmups).toHaveLength(4)
      expect(checkpoint.warmups.every((letter) => eligible.has(letter))).toBe(true)
      for (const word of checkpoint.words) {
        expect(Array.from(word).every((letter) => eligible.has(letter as never))).toBe(true)
      }
    }

    expect(checkpoints[0].words).toEqual(['TIME'])
    expect(checkpoints[1].words).toEqual(['TRAIN', 'GARDEN'])
    expect(checkpoints[1].words.join('')).not.toContain('O')
  })

  it('unlocks exactly after lessons 4 and 7 without gating or renumbering the 13 lessons', () => {
    const fresh = topic()
    expect(morseLessonPath(fresh)).toHaveLength(13)
    expect(morseWordCheckpointPath(fresh)!.map((checkpoint) => checkpoint.unlocked)).toEqual([false, false])

    const after4 = settledThroughLesson(fresh, 4)
    expect(morseWordCheckpointPath(after4)!.map((checkpoint) => checkpoint.unlocked)).toEqual([true, false])
    expect(morseLessonPath(after4)).toHaveLength(13)
    expect(morseLessonPath(after4)![4].state).toBe('current')

    const after7 = settledThroughLesson(fresh, 7)
    expect(morseWordCheckpointPath(after7)!.map((checkpoint) => checkpoint.unlocked)).toEqual([true, true])
    expect(morseLessonPath(after7)).toHaveLength(13)
    expect(morseLessonPath(after7)![7].state).toBe('current')
  })

  it('keeps both checkpoints available when later repair moves canonical Learn backwards', () => {
    const base = settledThroughLesson(topic(), 8)
    const progress: ItemLessonStore = { ...(base.lessonProgress ?? {}) }
    progress[itemIdForGlyph(base, lessonPackets()[0].novel[0])] = 'cued'
    const repairing = { ...base, lessonProgress: progress }

    expect(morseLessonPath(repairing)![0].state).toBe('current')
    expect(morseWordCheckpointPath(repairing)!.map((checkpoint) => checkpoint.unlocked)).toEqual([true, true])
  })

  it('is a pure projection that cannot mutate saved learner state', () => {
    const value = settledThroughLesson(topic(), 7)
    const before = JSON.stringify(value)
    morseWordCheckpointPath(value)
    morseWordCheckpoints()
    expect(JSON.stringify(value)).toBe(before)
  })

  it('flattens four warm-ups before deterministic whole-word character targets', () => {
    const [first, second] = morseWordCheckpoints()
    const firstTargets = checkpointTargets(first)
    const secondTargets = checkpointTargets(second)

    expect(firstTargets.slice(0, 4).map((target) => target.kind)).toEqual(['warmup', 'warmup', 'warmup', 'warmup'])
    expect(firstTargets.slice(4).map((target) => target.letter).join('')).toBe('TIME')
    expect(secondTargets.slice(0, 4).map((target) => target.kind)).toEqual(['warmup', 'warmup', 'warmup', 'warmup'])
    expect(secondTargets.slice(4).filter((target) => target.kind === 'word').map((target) => target.letter).join('')).toBe('TRAINGARDEN')
  })
})
