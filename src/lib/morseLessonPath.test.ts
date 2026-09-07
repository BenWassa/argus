import { describe, expect, it } from 'vitest'
import { lessonPackets } from './morseLesson'
import { morseLessonPath, startReplayLesson } from './morseLessonPath'
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

function withProgress(value: Topic, progress: ItemLessonStore): Topic {
  return { ...value, lessonProgress: progress }
}

describe('Morse lesson path', () => {
  it('shows the first of all 13 canonical packets as current and the rest locked for a fresh learner', () => {
    const value = topic()
    const path = morseLessonPath(value)
    expect(path).not.toBeNull()
    expect(path).toHaveLength(lessonPackets().length)
    expect(path).toHaveLength(13)
    expect(path![0].state).toBe('current')
    expect(path![0].novel).toEqual(lessonPackets()[0].novel)
    expect(path!.slice(1).every((lesson) => lesson.state === 'locked')).toBe(true)
    expect(path!.every((lesson) => lesson.replayable === false)).toBe(true)
  })

  it('unlocks the next lesson from the same durable support state that drives acquisition', () => {
    const value = topic()
    const first = lessonPackets()[0]
    const progress: ItemLessonStore = {}
    for (const glyph of first.characters) progress[itemIdForGlyph(value, glyph)] = 'settled'

    const path = morseLessonPath(withProgress(value, progress))!
    expect(path[0].state).toBe('completed')
    expect(path[0].replayable).toBe(true)
    expect(path[1].state).toBe('current')
    expect(path[2].state).toBe('locked')
  })

  it('keeps already reached later lessons unlocked if returning material temporarily needs repair', () => {
    const value = topic()
    const packets = lessonPackets()
    const progress: ItemLessonStore = {}

    // Prove lessons 1–3 were reached by giving their novel mappings durable
    // support, then weaken one lesson-1 mapping as a returning-item repair.
    for (let index = 0; index <= 2; index += 1) {
      for (const glyph of packets[index].novel) progress[itemIdForGlyph(value, glyph)] = 'settled'
    }
    progress[itemIdForGlyph(value, packets[0].novel[0])] = 'cued'

    const path = morseLessonPath(withProgress(value, progress))!
    expect(path[0].state).toBe('current')
    expect(path[1].state).toBe('unlocked')
    expect(path[2].state).toBe('unlocked')
    expect(path[3].state).toBe('locked')
    expect(path[1].replayable).toBe(true)
  })

  it('marks every lesson completed once acquisition is ready', () => {
    const value = topic()
    const progress: ItemLessonStore = {}
    for (const item of value.items) {
      if (item.id) progress[item.id] = 'settled'
    }
    const path = morseLessonPath(withProgress(value, progress))!
    expect(path.every((lesson) => lesson.state === 'completed')).toBe(true)
    expect(path.every((lesson) => lesson.replayable)).toBe(true)
  })
})

describe('completed lesson replay', () => {
  it('refuses current or locked lessons', () => {
    const value = topic()
    expect(startReplayLesson(value, 0)).toBeNull()
    expect(startReplayLesson(value, 12)).toBeNull()
  })

  it('creates an ephemeral uncued run for a completed lesson without changing the topic', () => {
    const value = topic()
    const first = lessonPackets()[0]
    const progress: ItemLessonStore = {}
    for (const glyph of first.characters) progress[itemIdForGlyph(value, glyph)] = 'settled'
    const progressed = withProgress(value, progress)
    const before = JSON.stringify(progressed)

    const replay = startReplayLesson(progressed, 0)
    expect(replay).not.toBeNull()
    expect(replay!.packetIndex).toBe(0)
    expect(replay!.entries.map((entry) => entry.glyph)).toEqual(first.characters)
    expect(replay!.entries.every((entry) => entry.support === 'solo')).toBe(true)
    expect(replay!.entries.every((entry) => entry.introduced)).toBe(true)
    expect(JSON.stringify(progressed)).toBe(before)
  })
})
