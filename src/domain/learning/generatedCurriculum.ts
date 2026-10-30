import type { Item, Topic } from '../library/topic'
import { morseLessonPath } from '../morse/curriculum/lessonPath'
import { morseProgressPath } from '../morse/curriculum/progressPath'
import { MAX_STAGES, type Curriculum, type LessonStep } from './stages'
import { nextStage } from './stageProgress'

/** v5 items always have ids; the fallback keeps legacy in-memory fixtures usable. */
export function learningItemId(item: Item, index: number): string {
  return item.id ?? `item-${index + 1}`
}

function hash(value: string): number {
  let result = 2166136261
  for (const character of value) result = Math.imul(result ^ character.charCodeAt(0), 16777619)
  return result >>> 0
}

function ordered(values: string[], seed: string): string[] {
  return [...values].sort((a, b) => hash(`${seed}:${a}`) - hash(`${seed}:${b}`) || (a < b ? -1 : a > b ? 1 : 0))
}

/** Existing scored text only. No new instructional claims or evidence. */
export function generatedCurriculum(topic: Topic): Curriculum {
  // Never more than MAX_STAGES lessons: stored progress has a hard stage-count
  // limit that older builds enforce when parsing. A very large topic (only a
  // learner's own can be) gets longer lessons instead; every shipped topic stays
  // within the authored step limit too.
  const size = Math.max(4, Math.ceil(topic.items.length / MAX_STAGES))
  const chunks: Item[][] = []
  for (let index = 0; index < topic.items.length; index += size) chunks.push(topic.items.slice(index, index + size))
  const tail = chunks.at(-1)
  if (tail && tail.length < 3 && chunks.length > 1) {
    const joined = [...chunks[chunks.length - 2], ...tail]
    chunks.splice(-2, 2, ...(joined.length <= 5 ? [joined] : [joined.slice(0, 3), joined.slice(3)]))
  }
  const answers = [...new Set(topic.items.map(item => item.answer))]
  let itemIndex = 0
  return { stages: chunks.map((items, index) => {
    const id = `lesson-${index + 1}`
    const ids: string[] = []
    const steps = items.flatMap((item, position): LessonStep[] => {
      const itemId = learningItemId(item, itemIndex++)
      ids.push(itemId)
      const base = `${id}-${position + 1}`
      const ask: LessonStep = answers.length < 2
        ? { kind: 'recall', id: `${base}-recall`, itemId }
        : { kind: 'choose', id: `${base}-choose`, itemId, prompt: item.prompt,
          answer: item.answer, explain: item.answer,
          options: ordered([item.answer, ...ordered(answers.filter(answer => answer !== item.answer), itemId).slice(0, 3)], `${itemId}:options`) }
      return [{ kind: 'show', id: `${base}-show`, title: item.stimulus ? item.answer : item.prompt,
        body: item.answer, itemId, ...(item.stimulus ? { altText: item.stimulus.alt } : {}) }, ask]
    })
    steps.push({ kind: 'checkpoint', id: `${id}-checkpoint`, itemIds: ids })
    return { id, title: `Lesson ${index + 1}`, steps }
  }) }
}

/** Authored curricula can override the generated default (owner, 2026-10-29). */
const AUTHORED: ReadonlyMap<string, Curriculum> = new Map()

export function curriculumFor(topic: Topic): Curriculum | undefined {
  if (!topic.items.length || morseLessonPath(topic) || morseProgressPath(topic)) return undefined
  return AUTHORED.get(topic.id) ?? generatedCurriculum(topic)
}

export function nextLesson(topic: Topic) {
  const curriculum = curriculumFor(topic)
  return curriculum && (nextStage(topic, curriculum) ?? curriculum.stages[0])
}

export function lessonForItem(topic: Topic, itemId: string) {
  return curriculumFor(topic)?.stages.find(stage => stage.steps.some(step =>
    ('itemId' in step && step.itemId === itemId) || ('itemIds' in step && step.itemIds.includes(itemId))))
}
