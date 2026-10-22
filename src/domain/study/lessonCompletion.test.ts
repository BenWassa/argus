import { describe, expect, it } from 'vitest'
import { seedLibrary } from '../library/catalogSeed'
import type { Topic } from '../library/topic'
import {
  advanceLesson, answerLesson, currentStep, introduceLesson,
  lessonPackets, lessonProgressOf, morseAcquisitionPosition,
  startLesson, withLessonProgress,
} from '../morse/curriculum/lesson'
import { morseLessonPath } from '../morse/curriculum/lessonPath'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'
import { journeyFor, withAcquisitionReadiness } from './journey'
import { isLearned, resolveAttempt, resolveStudy } from './scheduling'

const at = new Date('2026-10-22T18:00:00.000Z')
const morse = seedLibrary().topics.find((topic) => topic.id === 'international-morse-letters-printed')!

/** The real lesson engine, one successful pass of each required packet. */
function completeOnce(): Topic {
  let topic = resolveStudy({ ...morse, history: [], lessonProgress: {}, completedAt: null }, at)
  for (let lesson = 0; lesson < lessonPackets().length; lesson += 1) {
    let run = startLesson(topic)
    expect(run?.packetIndex).toBe(lesson)
    if (!run) throw new Error('No required lesson')
    for (let guard = 0; guard < 100 && !run.complete; guard += 1) {
      const step = currentStep(run)
      if (!step) break
      run = step.kind === 'introduce'
        ? introduceLesson(run, step.entry.itemId)
        : advanceLesson(answerLesson(run, step.entry.itemId, step.entry.pattern))
    }
    expect(run.complete).toBe(true)
    topic = withAcquisitionReadiness(withLessonProgress(topic, lessonProgressOf(run)), at)
    expect(isLearned(topic)).toBe(lesson === lessonPackets().length - 1)
  }
  return topic
}

describe('#276: lessons finish once; Test is independent', () => {
  it('finishes all thirteen required lessons once and does not invent a Test', () => {
    const learned = completeOnce()
    expect(morseAcquisitionPosition(learned)?.ready).toBe(true)
    expect(startLesson(learned)?.finished).toBe(true)
    expect(learned.status).toBe('completed')
    expect(learned.completedAt).toBe(at.toISOString())
    expect(learned.acquisitionReadyAt).toBe(at.toISOString())
    expect(learned.history).toEqual([])
    expect(learned.lastTestedAt).toBeNull()
    expect(learned.itemEvidence ?? {}).toEqual({})
    expect(journeyFor(learned)).toMatchObject({ phase: 'banked', due: false, advancementEligible: true })
    expect(morseLessonPath(learned)?.every((lesson) => lesson.state === 'completed')).toBe(true)
  })

  it('does not reopen passed lessons after a later review miss or optional Test miss', () => {
    const learned = completeOnce()
    const firstId = learned.items.find((item) => item.prompt === 'E')!.id!
    const slipped = withLessonProgress(learned, { [firstId]: 'cued' })
    expect(isLearned(slipped)).toBe(true)
    expect(journeyFor(slipped).due).toBe(false)
    expect(morseLessonPath(slipped)?.every((lesson) => lesson.state === 'completed')).toBe(true)
    const scored = resolveAttempt(slipped, 0, 26, new Date('2026-10-23T18:00:00.000Z'),
      { missedItemIds: [firstId] })
    expect(scored.topic.status).toBe('completed')
    expect(scored.topic.completedAt).toBe(at.toISOString())
    expect(scored.topic.history).toHaveLength(1)
    expect(scored.topic.history[0]).toMatchObject({ correct: 0, total: 26, missedItemIds: [firstId] })
    expect(scored.topic.itemEvidence ?? {}).toEqual({})
    expect(journeyFor(scored.topic).phase).toBe('banked')
  })

  it('migrates old lesson progress and readiness without inventing evidence', () => {
    const learned = completeOnce()
    const legacy: Topic = {
      ...learned, status: 'learning', completedAt: null,
      acquisitionReadyAt: '2026-02-01T00:00:00.000Z',
      history: [{ at: '2026-01-01T00:00:00.000Z', correct: 4, total: 26, resolvedTo: 'learning' }],
    }
    const parsed = parseLibrary({ version: 5, topics: [legacy] })
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) throw new Error(parsed.error)
    const restored = parsed.library.topics[0]
    expect(isLearned(restored)).toBe(true)
    expect(journeyFor(restored).phase).toBe('banked')
    expect(restored.history).toEqual(legacy.history)
    expect(restored.itemEvidence ?? {}).toEqual(legacy.itemEvidence ?? {})
    const normalized = withAcquisitionReadiness(restored, at)
    expect(normalized.completedAt).toBe(legacy.acquisitionReadyAt)
    expect(normalized.history).toEqual(legacy.history)
    const roundTrip = parseLibrary(JSON.parse(JSON.stringify(parsed.library)))
    expect(roundTrip).toEqual(parsed)
  })

  it('does not mistake an ordinary untested topic for completed learning', () => {
    const seeded = seedLibrary().topics.find((topic) => topic.id === 'cardinal-bearings')!
    const ordinary: Topic = { ...seeded, status: 'unstarted', completedAt: null, drilledAt: null, history: [] }
    expect(isLearned(ordinary)).toBe(false)
    expect(journeyFor(ordinary).action).toBe('test')
    expect(journeyFor(ordinary).due).toBe(true)
  })
})
