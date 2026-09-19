import { describe, expect, it } from 'vitest'
import { lessonPackets, startLesson } from './lesson'
import { morseLessonPath, nextReplayLesson, startReplayLesson } from './lessonPath'
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

function withProgress(value: Topic, progress: ItemLessonStore): Topic {
  return { ...value, lessonProgress: progress }
}

/** Every character in the first `lessons` packets settled, and nothing after. */
function settledThrough(value: Topic, lessons: number): ItemLessonStore {
  const progress: ItemLessonStore = {}
  for (const packet of lessonPackets().slice(0, lessons)) {
    for (const glyph of packet.characters) progress[itemIdForGlyph(value, glyph)] = 'settled'
  }
  return progress
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

  it('reruns the canonical first-exposure lesson rather than a stripped quiz (#117)', () => {
    const value = topic()
    const first = lessonPackets()[0]
    const progressed = withProgress(value, settledThrough(value, 1))
    const before = JSON.stringify(progressed)

    const replay = startReplayLesson(progressed, 0)
    expect(replay).not.toBeNull()
    expect(replay!.packetIndex).toBe(0)
    expect(replay!.entries.map((entry) => entry.glyph)).toEqual(first.characters)
    // The novel pair is met again the way it was met the first time: taught,
    // not yet introduced, so the mnemonic/canonical/audio introduction screen
    // is shown before any retrieval is asked for.
    const novel = replay!.entries.filter((entry) => entry.novel)
    expect(novel.map((entry) => entry.glyph)).toEqual([...first.novel])
    expect(novel.every((entry) => entry.support === 'taught')).toBe(true)
    expect(novel.every((entry) => entry.introduced === false)).toBe(true)
    expect(JSON.stringify(progressed)).toBe(before)
  })

  it('builds every replay from the canonical lesson builder, so the roster cannot drift', () => {
    const value = topic()
    for (let index = 0; index < lessonPackets().length; index += 1) {
      // A learner who has settled everything can replay any lesson; the run
      // must match what a learner standing at that position would be given.
      const completed = withProgress(value, settledThrough(value, lessonPackets().length))
      const atPosition = withProgress(value, settledThrough(value, index))

      const replay = startReplayLesson(completed, index)
      const canonical = startLesson(atPosition)
      expect(replay).not.toBeNull()
      expect(canonical).not.toBeNull()
      expect(replay!.packetIndex).toBe(index)
      expect(replay!.entries.map((entry) => entry.glyph)).toEqual(
        canonical!.entries.map((entry) => entry.glyph),
      )
    }
  })

  it('walks the printed curriculum and stops after the last lesson', () => {
    const value = topic()
    const completed = withProgress(value, settledThrough(value, lessonPackets().length))
    const last = lessonPackets().length - 1

    expect(nextReplayLesson(completed, 0)!.packetIndex).toBe(1)
    expect(nextReplayLesson(completed, last - 1)!.packetIndex).toBe(last)
    expect(nextReplayLesson(completed, last)).toBeNull()
  })

  it('never reports the end-of-curriculum run, whatever the learner has settled', () => {
    const value = topic()
    const completed = withProgress(value, settledThrough(value, lessonPackets().length))
    // `startLesson` hands a fully settled learner the finished screen. A replay
    // asks about an earlier position, so it must always produce a real lesson.
    expect(startLesson(completed)!.finished).toBe(true)
    for (let index = 0; index < lessonPackets().length; index += 1) {
      const replay = startReplayLesson(completed, index)
      expect(replay!.finished).toBe(false)
      expect(replay!.complete).toBe(false)
      expect(replay!.entries.length).toBeGreaterThan(0)
    }
  })
})
