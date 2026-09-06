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
  lessonSittingRemaining,
  newLessonSitting,
  recordLessonRetrieval,
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
})
