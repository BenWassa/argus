import { isLearned } from '../study/scheduling'
import type { Topic } from '../library/topic'
import type { Curriculum, LessonStage } from './stages'

export function stageDone(topic: Topic, stageId: string): boolean {
  return isLearned(topic) || Object.hasOwn(topic.stageProgress ?? {}, stageId)
}

export function stagesRemaining(topic: Topic, curriculum: Curriculum): LessonStage[] {
  return curriculum.stages.filter((stage) => !stageDone(topic, stage.id))
}

export function nextStage(topic: Topic, curriculum: Curriculum): LessonStage | undefined {
  return stagesRemaining(topic, curriculum)[0]
}

/** Formative ticks only; completion is permanent and never adds Test evidence. */
export function withStageCompleted(
  topic: Topic,
  curriculum: Curriculum,
  stageId: string,
  now: Date = new Date(),
): Topic {
  if (!curriculum.stages.some((stage) => stage.id === stageId)) return topic
  const updated = Object.hasOwn(topic.stageProgress ?? {}, stageId)
    ? topic
    : { ...topic, stageProgress: { ...topic.stageProgress, [stageId]: now.toISOString() } }
  if (updated.completedAt === null && stagesRemaining(updated, curriculum).length === 0) {
    return { ...updated, completedAt: now.toISOString(), status: 'completed' }
  }
  return updated
}
