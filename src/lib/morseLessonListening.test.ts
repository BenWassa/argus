import { describe, expect, it } from 'vitest'
import {
  answerLesson,
  currentStep,
  introduceLesson,
  startLesson,
  type LessonEntry,
  type LessonRun,
} from './morseLesson'
import {
  LISTENING_RETRIEVAL_INTERVAL,
  lessonListeningOptions,
  newLessonListeningState,
  recordLessonQuestion,
  shouldUseListeningQuestion,
  suppressListening,
} from './morseLessonListening'
import { newLessonSitting } from './morseLessonSitting'
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

  it("Can't listen now suppresses listening for the rest of this sitting without touching XP", () => {
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
