import { describe, expect, it } from 'vitest'
import { seedLibrary } from '../library/catalogSeed'
import type { Topic } from '../library/topic'
import type { LessonStage } from './stages'
import { withStageCompleted } from './stageProgress'
import {
  lessonResumePoint, parseLessonCursor, stageKey,
  withLessonCursor, withoutLessonCursor,
} from './lessonCursor'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'

const stage: LessonStage = {
  id: 'visual-recognition',
  title: 'Visual Recognition',
  steps: [
    { kind: 'show', id: 'intro', title: 'Recognise this', body: 'A visual example.' },
    { kind: 'choose', id: 'answer', itemId: 'a', prompt: 'Which is this?',
      answer: 'A', options: ['A', 'B'], explain: 'Look for the distinguishing mark.' },
    { kind: 'checkpoint', id: 'recap', itemIds: ['a', 'b', 'c'] },
    { kind: 'summary', id: 'finish', text: 'You have seen these designs.' },
  ],
}

function topic(): Topic {
  const base = seedLibrary().topics.find(t => t.id === 'nato-phonetic')!
  return {
    ...base, status: 'unstarted', completedAt: null, stageProgress: undefined,
    history: [{ at: '2026-09-01T00:00:00.000Z', correct: 4, total: 26, resolvedTo: 'learning' }],
  }
}

describe('versioned lesson resume bookmark', () => {
  it('is stable for the same content and changed for a reordered, retitled or rekeyed stage', () => {
    expect(stageKey(structuredClone(stage))).toBe(stageKey(stage))
    expect(stageKey(stage)).toMatch(/^[0-9a-f]{16}$/)
    expect(stageKey({ ...stage, title: 'Visual Recognition Updated' })).not.toBe(stageKey(stage))
    expect(stageKey({ ...stage, steps: [...stage.steps].reverse() })).not.toBe(stageKey(stage))
    expect(stageKey({ ...stage, steps: stage.steps.map(step =>
      step.kind === 'choose' ? { ...step, answer: 'B' } : step) })).not.toBe(stageKey(stage))
  })

  it('is formative only and persists a safe next-step cursor without changing earned records', () => {
    const before = topic()
    const after = withLessonCursor(before, stage, 'answer')
    expect(before.lessonCursor).toBeUndefined()
    expect(after.lessonCursor).toEqual({
      version: 1, stageId: stage.id, stepId: 'answer', cardIndex: 0, stageKey: stageKey(stage),
    })
    expect(lessonResumePoint(after, stage)).toEqual({ stepIndex: 1, cardIndex: 0 })
    expect(after.history).toBe(before.history)
    expect(after.itemEvidence).toBe(before.itemEvidence)
    expect(after.audioEvidence).toBe(before.audioEvidence)
    expect(after.completedAt).toBeNull()
    expect(after.stageProgress).toBeUndefined()
    expect(withLessonCursor(after, stage, 'answer')).toBe(after)
  })

  it('resumes an exact checkpoint card, never a disclosed answer or an invalid card', () => {
    const before = topic()
    const withCard = withLessonCursor(before, stage, 'recap', 2)
    expect(lessonResumePoint(withCard, stage)).toEqual({ stepIndex: 2, cardIndex: 2 })
    expect(withLessonCursor(withCard, stage, 'recap', 3)).toBe(withCard)
    expect(withLessonCursor(withCard, stage, 'answer', 1)).toBe(withCard)
    expect(withLessonCursor(withCard, stage, 'missing')).toBe(withCard)
    expect(withLessonCursor(withCard, stage, 'recap', -1)).toBe(withCard)
  })

  it('resets a stale cursor without erasing legacy lesson receipts or a prior completion', () => {
    const old = withLessonCursor(topic(), stage, 'recap', 1)
    const revised = { ...stage, steps: [...stage.steps.slice(0, 1), {
      kind: 'show' as const, id: 'new-explanation', title: 'More detail', body: 'New distinction.',
    }, ...stage.steps.slice(1)] }
    expect(lessonResumePoint(old, revised)).toEqual({ stepIndex: 0, cardIndex: 0 })
    expect(lessonResumePoint(old, { ...stage, id: 'different-stage' })).toEqual({ stepIndex: 0, cardIndex: 0 })
    const learned = { ...old, completedAt: '2026-10-01T00:00:00.000Z', status: 'completed' as const,
      stageProgress: { 'visual-recognition': '2026-10-01T00:00:00.000Z' } }
    expect(lessonResumePoint(learned, revised)).toEqual({ stepIndex: 0, cardIndex: 0 })
    expect(learned.completedAt).toBe('2026-10-01T00:00:00.000Z')
    expect(learned.stageProgress).toEqual(old.stageProgress ? {
      ...old.stageProgress, 'visual-recognition': '2026-10-01T00:00:00.000Z',
    } : { 'visual-recognition': '2026-10-01T00:00:00.000Z' })
  })

  it('clears only the matching stage on completion, without Test evidence or history writes', () => {
    const initial = withLessonCursor(topic(), stage, 'finish')
    const curriculum = { stages: [stage] }
    const finished = withStageCompleted(initial, curriculum, stage.id, new Date('2026-11-03T15:00:00.000Z'))
    expect(finished.lessonCursor).toBeUndefined()
    expect(finished.completedAt).toBe('2026-11-03T15:00:00.000Z')
    expect(finished.status).toBe('completed')
    expect(finished.history).toBe(initial.history)
    expect(finished.itemEvidence).toBe(initial.itemEvidence)
    const otherStage = { ...stage, id: 'later-stage' }
    const different = withLessonCursor(topic(), otherStage, 'intro')
    expect(withoutLessonCursor(different, stage.id)).toBe(different)
    expect(withStageCompleted(different, curriculum, stage.id).lessonCursor).toEqual(different.lessonCursor)
  })

  it('parses and round-trips alongside historical progress in a v5 export', () => {
    const before = withLessonCursor(topic(), stage, 'recap', 1)
    const parsed = parseLibrary({ version: 5, topics: [before] })
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.library.topics[0].lessonCursor).toEqual(before.lessonCursor)
    expect(parsed.library.topics[0].history).toEqual(before.history)
    const again = parseLibrary(JSON.parse(JSON.stringify(parsed.library)))
    expect(again.ok).toBe(true)
    if (again.ok) expect(again.library.topics[0].lessonCursor).toEqual(before.lessonCursor)
    const legacy = parseLibrary({ version: 5, topics: [{ ...before, lessonCursor: undefined }] })
    expect(legacy.ok).toBe(true)
    if (legacy.ok) expect(legacy.library.topics[0].lessonCursor).toBeUndefined()
  })

  it('rejects corrupt or unsupported cursor versions without inventing a bookmark', () => {
    const good = withLessonCursor(topic(), stage, 'intro').lessonCursor!
    const invalid = [
      { ...good, version: 2 }, { ...good, cardIndex: -1 },
      { ...good, stageKey: 'wrong' }, { ...good, stepId: 'UPPER' },
      { ...good, unexpected: true }, [], null, 'intro',
    ]
    for (const cursor of invalid) {
      expect(parseLessonCursor(cursor)).toBeNull()
      expect(parseLibrary({ version: 5, topics: [{ ...topic(), lessonCursor: cursor }] }).ok).toBe(false)
    }
    expect(parseLessonCursor(undefined)).toBeUndefined()
  })
})
