import { describe, expect, it } from 'vitest'
import type { Topic } from '../library/topic'
import type { Curriculum } from './stages'
import { nextStage, stageDone, stagesRemaining, withStageCompleted } from './stageProgress'

const curriculum: Curriculum = { stages: [
  { id: 'first', title: 'First', steps: [] },
  { id: 'second', title: 'Second', steps: [] },
] }
const now = new Date('2026-10-01T12:00:00.000Z')
const later = new Date('2026-10-02T12:00:00.000Z')
function fresh(): Topic {
  return {
    id: 'test', title: 'Test', scope: 'Two stages', track: 'learning', items: [],
    status: 'unstarted', createdAt: now.toISOString(), drilledAt: null, learningAt: null,
    completedAt: null, lastTestedAt: null, spotCheckedAt: null, history: [],
  }
}

describe('stage progress', () => {
  it('treats permanent completion as every lesson done (D5)', () => {
    const topic = { ...fresh(), completedAt: now.toISOString() }
    expect(stageDone(topic, 'first')).toBe(true)
    expect(stagesRemaining(topic, curriculum)).toEqual([])
    expect(nextStage(topic, curriculum)).toBeUndefined()
    expect(stageDone(fresh(), 'toString')).toBe(false)
  })

  it('is immutable, idempotent and monotonic without touching evidence or history', () => {
    const topic = fresh()
    const first = withStageCompleted(topic, curriculum, 'first', now)
    expect(topic.stageProgress).toBeUndefined()
    expect(first).toEqual({ ...topic, stageProgress: { first: now.toISOString() } })
    expect(first.history).toBe(topic.history)
    expect(withStageCompleted(first, curriculum, 'first', later)).toBe(first)
    const second = withStageCompleted(first, curriculum, 'second', later)
    expect(second.stageProgress).toEqual({ first: now.toISOString(), second: later.toISOString() })
    expect(stagesRemaining(second, curriculum)).toEqual([])
    expect(nextStage(second, curriculum)).toBeUndefined()
    expect(withStageCompleted(second, curriculum, 'second', now)).toBe(second)
  })

  it('uses ids independently of curriculum order and retains removed ticks', () => {
    const topic = { ...fresh(), stageProgress: { first: now.toISOString(), removed: now.toISOString() } }
    const reversed = { stages: [...curriculum.stages].reverse() }
    expect(nextStage(topic, reversed)?.id).toBe('second')
    expect(stagesRemaining(topic, reversed).map((stage) => stage.id)).toEqual(['second'])
    expect(withStageCompleted(topic, reversed, 'second', later).stageProgress?.removed).toBe(now.toISOString())
  })

  it('ignores unknown ids, including with an empty curriculum', () => {
    const topic = fresh()
    expect(withStageCompleted(topic, curriculum, 'unknown', now)).toBe(topic)
    expect(withStageCompleted(topic, { stages: [] }, 'first', now)).toBe(topic)
  })

  it('sets completion and status together only once all stages have ticks', () => {
    const first = withStageCompleted(fresh(), curriculum, 'second', now)
    expect(first.completedAt).toBeNull()
    expect(first.status).toBe('unstarted')
    const done = withStageCompleted(first, curriculum, 'first', later)
    expect(done.completedAt).toBe(later.toISOString())
    expect(done.status).toBe('completed')
  })

  it('preserves existing completion while adding stage ticks to completed topics', () => {
    const topic: Topic = { ...fresh(), completedAt: now.toISOString(), status: 'completed' }
    const first = withStageCompleted(topic, curriculum, 'first', later)
    const done = withStageCompleted(first, curriculum, 'second', later)
    expect(done.completedAt).toBe(now.toISOString())
    expect(done.status).toBe('completed')
    expect(Object.keys(done.stageProgress!)).toEqual(['first', 'second'])
  })
})

it('does not turn a legacy drilled topic review into a new completion', () => {
  const topic: Topic = { ...fresh(), status: 'drilled' }
  const updated = withStageCompleted(topic, curriculum, 'first', later)
  expect(updated.stageProgress?.first).toBe(later.toISOString())
  expect(updated.completedAt).toBeNull()
  expect(updated.status).toBe('drilled')
})
