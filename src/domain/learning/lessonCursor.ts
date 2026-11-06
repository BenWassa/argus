import type { Topic } from '../library/topic'
import type { LessonStage } from './stages'

/**
 * Versioned, formative-only bookmark for an unfinished ordinary lesson (#296).
 *
 * This is deliberately separate from completed stage receipts, scored Test
 * history, item evidence and the specialist Morse sitting. The bookmark is
 * merely the next safe point to display. It never proves an answer was right.
 *
 * Parsing support must ship before a runner starts writing this field: an
 * older reader cannot safely round-trip a field it does not recognize.
 */
export interface LessonCursor {
  version: 1
  stageId: string
  stepId: string
  cardIndex: number
  stageKey: string
}

const STAGE_KEY = /^[0-9a-f]{16}$/
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/

/** Deterministic, non-cryptographic change detector, not a security signature. */
export function stageKey(stage: LessonStage): string {
  const serialized = JSON.stringify(stage)
  let first = 2166136261
  let second = 2246822519
  for (let i = 0; i < serialized.length; i += 1) {
    const char = serialized.charCodeAt(i)
    first = Math.imul(first ^ char, 16777619)
    second = Math.imul(second ^ (char + i), 3266489917)
  }
  return (first >>> 0).toString(16).padStart(8, '0') +
    (second >>> 0).toString(16).padStart(8, '0')
}

/** Strict import validation; an unknown version cannot be silently truncated. */
export function parseLessonCursor(value: unknown): LessonCursor | null | undefined {
  if (value === undefined) return undefined
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const record = value as Record<string, unknown>
  const keys = Object.keys(record)
  if (keys.length !== 5 || keys.some(key => !['version', 'stageId', 'stepId', 'cardIndex', 'stageKey'].includes(key))) return null
  if (record.version !== 1 || typeof record.stageId !== 'string' || !ID.test(record.stageId) ||
      typeof record.stepId !== 'string' || !ID.test(record.stepId) ||
      !Number.isSafeInteger(record.cardIndex) || (record.cardIndex as number) < 0 ||
      typeof record.stageKey !== 'string' || !STAGE_KEY.test(record.stageKey)) return null
  return record as unknown as LessonCursor
}

/**
 * A changed lesson (including content, order, prompts or answer keys) starts
 * at step one. Old completed-stage timestamps are never altered or inferred.
 * Checkpoint card position can resume only inside the same unchanged step.
 */
export function lessonResumePoint(topic: Topic, stage: LessonStage): { stepIndex: number; cardIndex: number } {
  const cursor = topic.lessonCursor
  if (!cursor || cursor.version !== 1 || cursor.stageId !== stage.id ||
      cursor.stageKey !== stageKey(stage)) return { stepIndex: 0, cardIndex: 0 }
  const stepIndex = stage.steps.findIndex(step => step.id === cursor.stepId)
  if (stepIndex < 0) return { stepIndex: 0, cardIndex: 0 }
  const step = stage.steps[stepIndex]
  const cardIndex = step.kind === 'checkpoint'
    ? Math.min(cursor.cardIndex, Math.max(0, step.itemIds.length - 1))
    : 0
  return { stepIndex, cardIndex }
}

/**
 * The host persists this through its existing UID-scoped functional topic
 * transaction. Calling it does not change progression, status or formal scores.
 * Save a cursor only after the prior interaction is safely completed, never as
 * a record of an unanswered or incorrectly answered question.
 */
export function withLessonCursor(topic: Topic, stage: LessonStage, stepId: string, cardIndex = 0): Topic {
  const step = stage.steps.find(step => step.id === stepId)
  if (!step || !Number.isSafeInteger(cardIndex) || cardIndex < 0) return topic
  if (step.kind === 'checkpoint' ? cardIndex >= step.itemIds.length : cardIndex !== 0) return topic
  const cursor: LessonCursor = { version: 1, stageId: stage.id, stepId, cardIndex, stageKey: stageKey(stage) }
  if (JSON.stringify(topic.lessonCursor) === JSON.stringify(cursor)) return topic
  return { ...topic, lessonCursor: cursor }
}

/** Clear only this stage's bookmark; never discard an unrelated concurrent cursor. */
export function withoutLessonCursor(topic: Topic, stageId: string): Topic {
  if (!topic.lessonCursor || topic.lessonCursor.stageId !== stageId) return topic
  const { lessonCursor: _discarded, ...rest } = topic
  return rest
}
