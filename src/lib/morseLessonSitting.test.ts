import { describe, expect, it } from 'vitest'
import {
  advanceLesson,
  answerLesson,
  currentStep,
  introduceLesson,
  lessonProgressOf,
  startLesson,
  withLessonProgress,
  type LessonRun,
} from './morseLesson'
import {
  LESSON_RETRIEVAL_TARGET,
  lessonSittingComplete,
  lessonSittingIsFresh,
  lessonSittingOf,
  lessonSittingRemaining,
  newLessonSitting,
  recordLessonRetrieval,
  suppressSittingListening,
  withLessonSitting,
  withoutLessonSitting,
} from './morseLessonSitting'
import { parseLibrary } from './storage'
import { seedLibrary } from './seed'
import type { Topic } from './types'

function morseTopic(): Topic {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  const topic = parsed.library.topics.find((candidate) => candidate.id === 'international-morse-letters-printed')
  if (!topic) throw new Error('The seeded Morse topic is missing.')
  return topic
}

describe('finite Morse Learn sittings', () => {
  it('starts with a simple ten-retrieval target', () => {
    const sitting = newLessonSitting()
    expect(LESSON_RETRIEVAL_TARGET).toBe(10)
    expect(sitting).toEqual({ retrievals: 0, correct: 0, revisitItemIds: [] })
    expect(lessonSittingRemaining(sitting)).toBe(10)
    expect(lessonSittingComplete(sitting)).toBe(false)
  })

  it('awards exactly one session point per answered retrieval, even when wrong', () => {
    let sitting = newLessonSitting()
    sitting = recordLessonRetrieval(sitting, 'a', true)
    sitting = recordLessonRetrieval(sitting, 'b', false)

    expect(sitting.retrievals).toBe(2)
    expect(sitting.correct).toBe(1)
    expect(sitting.revisitItemIds).toEqual(['b'])
    expect(lessonSittingRemaining(sitting)).toBe(8)
  })

  it('tracks an item to revisit once rather than inflating the summary on repeat misses', () => {
    let sitting = newLessonSitting()
    sitting = recordLessonRetrieval(sitting, 'weak-item', false)
    sitting = recordLessonRetrieval(sitting, 'weak-item', false)
    expect(sitting.revisitItemIds).toEqual(['weak-item'])
  })

  it('cannot extend beyond the configured target', () => {
    let sitting = newLessonSitting()
    for (let at = 0; at < LESSON_RETRIEVAL_TARGET + 5; at += 1) {
      sitting = recordLessonRetrieval(sitting, `item-${at}`, at % 2 === 0)
    }
    expect(sitting.retrievals).toBe(LESSON_RETRIEVAL_TARGET)
    expect(lessonSittingRemaining(sitting)).toBe(0)
    expect(lessonSittingComplete(sitting)).toBe(true)
  })

  it('still ends predictably when every formative answer is wrong', () => {
    const topic = morseTopic()
    let run = startLesson(topic) as LessonRun
    let sitting = newLessonSitting()

    for (let guard = 0; guard < 200 && !lessonSittingComplete(sitting); guard += 1) {
      const step = currentStep(run)
      if (!step) break
      if (step.kind === 'introduce') {
        run = introduceLesson(run, step.entry.itemId)
        continue
      }

      run = answerLesson(run, step.entry.itemId, `${step.entry.pattern}.`)
      if (!run.feedback) throw new Error('Expected lesson feedback after an answer.')
      sitting = recordLessonRetrieval(sitting, step.entry.itemId, run.feedback.correct)
      if (!lessonSittingComplete(sitting)) run = advanceLesson(run)
    }

    expect(sitting.retrievals).toBe(LESSON_RETRIEVAL_TARGET)
    expect(sitting.correct).toBe(0)
    expect(lessonSittingComplete(sitting)).toBe(true)
    expect(run.complete).toBe(false)
  })

  it('does not count introductions as session points', () => {
    const topic = morseTopic()
    let run = startLesson(topic) as LessonRun
    const sitting = newLessonSitting()

    const first = currentStep(run)
    if (first?.kind !== 'introduce') throw new Error('Expected first introduction.')
    run = introduceLesson(run, first.entry.itemId)

    const second = currentStep(run)
    if (second?.kind !== 'introduce') throw new Error('Expected second introduction.')
    run = introduceLesson(run, second.entry.itemId)

    expect(currentStep(run)?.kind).toBe('check')
    expect(sitting.retrievals).toBe(0)
  })

  it('carries acquisition state into a later finite sitting without falsely advancing the packet', () => {
    const topic = morseTopic()
    let run = startLesson(topic) as LessonRun
    let sitting = newLessonSitting()

    while (!lessonSittingComplete(sitting)) {
      const step = currentStep(run)
      if (!step) throw new Error('Lesson ended before the sitting budget.')
      if (step.kind === 'introduce') {
        run = introduceLesson(run, step.entry.itemId)
        continue
      }
      run = answerLesson(run, step.entry.itemId, `${step.entry.pattern}.`)
      if (!run.feedback) throw new Error('Expected feedback.')
      sitting = recordLessonRetrieval(sitting, step.entry.itemId, false)
      if (!lessonSittingComplete(sitting)) run = advanceLesson(run)
    }

    const persisted = withLessonProgress(topic, lessonProgressOf(run))
    const resumed = startLesson(persisted) as LessonRun
    expect(resumed.packetIndex).toBe(0)
    expect(resumed.entries.some((entry) => entry.introduced)).toBe(true)
    expect(resumed.entries.some((entry) => entry.support !== 'settled')).toBe(true)
    expect(newLessonSitting().retrievals).toBe(0)
  })

  it('can settle a packet and continue the same sitting in the next packet', () => {
    let topic = morseTopic()
    let run = startLesson(topic) as LessonRun
    let sitting = newLessonSitting()
    const firstPacket = run.packetIndex

    for (let guard = 0; guard < 200 && !lessonSittingComplete(sitting); guard += 1) {
      const step = currentStep(run)
      if (!step) {
        if (!run.complete) throw new Error('No step before packet readiness.')
        topic = withLessonProgress(topic, lessonProgressOf(run))
        run = startLesson(topic) as LessonRun
        continue
      }
      if (step.kind === 'introduce') {
        run = introduceLesson(run, step.entry.itemId)
        topic = withLessonProgress(topic, lessonProgressOf(run))
        continue
      }

      run = answerLesson(run, step.entry.itemId, step.entry.pattern)
      if (!run.feedback) throw new Error('Expected feedback.')
      sitting = recordLessonRetrieval(sitting, step.entry.itemId, true)
      topic = withLessonProgress(topic, lessonProgressOf(run))
      if (!lessonSittingComplete(sitting)) {
        run = advanceLesson(run)
        if (run.complete) run = startLesson(topic) as LessonRun
      }
    }

    expect(sitting.retrievals).toBe(LESSON_RETRIEVAL_TARGET)
    expect(run.packetIndex).toBeGreaterThan(firstPacket)
  })

  it('keeps the sitting durable on the topic and nowhere else (#66)', () => {
    const sitting = recordLessonRetrieval(newLessonSitting(), 'item-a', false)
    const topic = morseTopic()

    // A fresh topic carries no sitting: absent is the fresh sitting.
    expect(topic).not.toHaveProperty('lessonSitting')
    expect(lessonSittingOf(topic)).toEqual(newLessonSitting())

    const resumed = withLessonSitting(topic, sitting)
    expect(resumed.lessonSitting).toEqual({ retrievals: 1, correct: 0, revisitItemIds: ['item-a'] })
    // The sitting is the only field it touches. Nothing about the scheduler,
    // the cue ladder or lesson support may ride along with a sitting write.
    expect({ ...resumed, lessonSitting: undefined }).toEqual({ ...topic, lessonSitting: undefined })
    // No economy: there is no score, currency or XP field anywhere on the topic.
    expect(topic).not.toHaveProperty('xp')
    expect(resumed).not.toHaveProperty('xp')
  })

  it('normalises a spent sitting back to the absent field when the next one starts', () => {
    const topic = withLessonSitting(morseTopic(), {
      retrievals: 10,
      correct: 8,
      revisitItemIds: ['item-a'],
      listeningSuppressed: true,
    })
    expect(topic.lessonSitting?.listeningSuppressed).toBe(true)

    // Starting the next sitting drops the field rather than storing zeroes, so
    // "fresh" has one representation and the learner's listening declination
    // lifts with the sitting it belonged to.
    const next = withoutLessonSitting(topic)
    expect(next).not.toHaveProperty('lessonSitting')
    expect(withLessonSitting(topic, newLessonSitting())).not.toHaveProperty('lessonSitting')
    expect(lessonSittingIsFresh(lessonSittingOf(next))).toBe(true)
  })

  it('carries the learner\'s listening declination with the sitting', () => {
    const suppressed = suppressSittingListening(
      recordLessonRetrieval(newLessonSitting(), 'item-a', true),
    )
    expect(suppressed.listeningSuppressed).toBe(true)
    // Still just bookkeeping: suppression changes no counter.
    expect(suppressed.retrievals).toBe(1)
    expect(suppressed.correct).toBe(1)

    const topic = withLessonSitting(morseTopic(), suppressed)
    expect(lessonSittingOf(topic).listeningSuppressed).toBe(true)
  })
})
