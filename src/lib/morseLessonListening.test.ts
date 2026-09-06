import { describe, expect, it } from 'vitest'
import {
  advanceLesson,
  answerLesson,
  currentStep,
  introduceLesson,
  lessonProgressOf,
  startLesson,
  withLessonProgress,
  type LessonEntry,
  type LessonRun,
} from './morseLesson'
import {
  LISTENING_RETRIEVAL_INTERVAL,
  answerListeningQuestion,
  lessonListeningOptions,
  newLessonListeningState,
  recordLessonQuestion,
  shouldUseListeningQuestion,
  suppressListening,
} from './morseLessonListening'
import {
  LESSON_RETRIEVAL_TARGET,
  lessonSittingComplete,
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
  if (!topic) throw new Error('Missing Morse topic')
  return topic
}

function introducedRun(): LessonRun {
  let run = startLesson(morseTopic()) as LessonRun
  while (currentStep(run)?.kind === 'introduce') {
    const step = currentStep(run)
    if (step?.kind !== 'introduce') break
    run = introduceLesson(run, step.entry.itemId)
  }
  return run
}

function entryAtSupport(support: LessonEntry['support']): LessonEntry {
  const run = introducedRun()
  return { ...run.entries[0], support, introduced: true }
}

describe('Morse listening question scheduling', () => {
  it('uses a restrained deterministic 3rd/6th/9th retrieval cadence', () => {
    expect(LISTENING_RETRIEVAL_INTERVAL).toBe(3)
    const entry = entryAtSupport('cued')
    const state = newLessonListeningState()
    expect(shouldUseListeningQuestion(0, entry, state)).toBe(false)
    expect(shouldUseListeningQuestion(1, entry, state)).toBe(false)
    expect(shouldUseListeningQuestion(2, entry, state)).toBe(true)
    expect(shouldUseListeningQuestion(5, entry, state)).toBe(true)
    expect(shouldUseListeningQuestion(8, entry, state)).toBe(true)
  })

  it('never asks listening before the character has been introduced or before printed retrieval begins', () => {
    const run = startLesson(morseTopic()) as LessonRun
    expect(run.entries[0].introduced).toBe(false)
    expect(shouldUseListeningQuestion(2, run.entries[0], newLessonListeningState())).toBe(false)
    expect(shouldUseListeningQuestion(2, entryAtSupport('taught'), newLessonListeningState())).toBe(false)
  })

  it('does not immediately repeat the same target in another modality', () => {
    const entry = entryAtSupport('cued')
    const state = recordLessonQuestion(newLessonListeningState(), entry.itemId)
    expect(shouldUseListeningQuestion(2, entry, state)).toBe(false)
  })

  it("Can't listen now suppresses listening for the rest of this sitting without spending a retrieval", () => {
    const entry = entryAtSupport('cued')
    const sitting = newLessonSitting()
    const state = suppressListening(newLessonListeningState())

    expect(state.suppressed).toBe(true)
    expect(shouldUseListeningQuestion(2, entry, state)).toBe(false)
    expect(sitting).toEqual(newLessonSitting())
    expect(sitting.retrievals).toBe(0)
  })

  it('a new sitting resets listening suppression', () => {
    const entry = entryAtSupport('cued')
    const suppressed = suppressListening(newLessonListeningState())
    expect(shouldUseListeningQuestion(2, entry, suppressed)).toBe(false)
    expect(shouldUseListeningQuestion(2, entry, newLessonListeningState())).toBe(true)
  })
})

describe('listening letter choices', () => {
  it('contains the target and only already-introduced characters', () => {
    const run = introducedRun()
    const entry = run.entries[0]
    const options = lessonListeningOptions(run, entry)
    const introduced = new Set(run.entries.filter((candidate) => candidate.introduced).map((candidate) => candidate.glyph))

    expect(options).toContain(entry.glyph)
    expect(options.length).toBeGreaterThanOrEqual(2)
    expect(options.length).toBeLessThanOrEqual(3)
    for (const glyph of options) expect(introduced.has(glyph)).toBe(true)
  })

  it('is deterministic for the same lesson step', () => {
    const run = introducedRun()
    const entry = run.entries[0]
    expect(lessonListeningOptions(run, entry)).toEqual(lessonListeningOptions(run, entry))
  })

  it('does not rely on a future/unintroduced padding character in the first packet', () => {
    const run = introducedRun()
    const entry = run.entries[0]
    expect(run.entries.filter((candidate) => candidate.introduced)).toHaveLength(2)
    expect(lessonListeningOptions(run, entry)).toHaveLength(2)
  })
})

describe('auditory answers stay outside printed acquisition evidence', () => {
  it('does not fade, restore, settle, or mark the target as printed-retrieved', () => {
    let run = introducedRun()
    const step = currentStep(run)
    if (step?.kind !== 'check') throw new Error('expected printed check')

    // Establish the character once in print so it is eligible for listening.
    run = answerLesson(run, step.entry.itemId, step.entry.pattern)
    run = advanceLesson(run)
    const target = run.entries.find((entry) => entry.itemId === step.entry.itemId)
    if (!target) throw new Error('target disappeared')
    const before = { ...target }
    const durableBefore = lessonProgressOf(run)

    const answered = answerListeningQuestion(run, target.itemId, target.glyph)
    if (!answered) throw new Error('expected listening answer')
    const after = answered.run.entries.find((entry) => entry.itemId === target.itemId)

    expect(answered.feedback.correct).toBe(true)
    expect(after?.support).toBe(before.support)
    expect(after?.asked).toBe(before.asked)
    expect(after?.done).toBe(before.done)
    expect(lessonProgressOf(answered.run)).toEqual(durableBefore)
  })

  it('an auditory miss also carries no printed-support penalty', () => {
    const run = introducedRun()
    const target = { ...run.entries[0], support: 'cued' as const }
    const prepared: LessonRun = {
      ...run,
      entries: run.entries.map((entry) => entry.itemId === target.itemId ? target : entry),
    }
    const answered = answerListeningQuestion(prepared, target.itemId, target.glyph === 'E' ? 'I' : 'E')
    if (!answered) throw new Error('expected listening answer')
    expect(answered.feedback.correct).toBe(false)
    expect(answered.run.entries.find((entry) => entry.itemId === target.itemId)?.support).toBe('cued')
  })

  it('defers the listened target so the next task is not the same answer visually', () => {
    const run = introducedRun()
    const target = { ...run.entries[0], support: 'cued' as const }
    const prepared: LessonRun = {
      ...run,
      entries: run.entries.map((entry) => entry.itemId === target.itemId ? target : entry),
    }
    const answered = answerListeningQuestion(prepared, target.itemId, target.glyph)
    if (!answered) throw new Error('expected listening answer')
    const next = currentStep(answered.run)
    expect(next?.kind).toBe('check')
    if (next?.kind === 'check') expect(next.entry.itemId).not.toBe(target.itemId)
  })
})

describe('visual-only fallback preserves the finite #51 sitting', () => {
  it('an all-audio-skipped/suppressed sitting still reaches exactly 10 completed retrievals', () => {
    let topic = morseTopic()
    let run = startLesson(topic) as LessonRun
    let sitting = newLessonSitting()
    const listening = suppressListening(newLessonListeningState())

    for (let guard = 0; guard < 250 && !lessonSittingComplete(sitting); guard += 1) {
      const step = currentStep(run)
      if (!step) {
        if (!run.complete) throw new Error('no visual work available')
        topic = withLessonProgress(topic, lessonProgressOf(run))
        run = startLesson(topic) as LessonRun
        continue
      }
      if (step.kind === 'introduce') {
        run = introduceLesson(run, step.entry.itemId)
        topic = withLessonProgress(topic, lessonProgressOf(run))
        continue
      }

      expect(shouldUseListeningQuestion(sitting.retrievals, step.entry, listening)).toBe(false)
      run = answerLesson(run, step.entry.itemId, step.entry.pattern)
      if (!run.feedback) throw new Error('expected visual feedback')
      sitting = recordLessonRetrieval(sitting, step.entry.itemId, run.feedback.correct)
      topic = withLessonProgress(topic, lessonProgressOf(run))
      if (!lessonSittingComplete(sitting)) {
        run = advanceLesson(run)
        if (run.complete) run = startLesson(topic) as LessonRun
      }
    }

    expect(sitting.retrievals).toBe(LESSON_RETRIEVAL_TARGET)
    expect(sitting.correct).toBe(LESSON_RETRIEVAL_TARGET)
    expect(lessonSittingComplete(sitting)).toBe(true)
  })
})
