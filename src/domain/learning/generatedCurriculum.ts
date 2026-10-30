import type { Item, Topic } from '../library/topic'
import { morseLessonPath } from '../morse/curriculum/lessonPath'
import { MAX_STAGES, type Curriculum, type LessonStep } from './stages'
import { nextStage } from './stageProgress'
import { gridNorthMapBearingsCurriculum } from './authored/grid-north-map-bearings'
import { northReferencesDeclinationCurriculum } from './authored/north-references-declination'
import { oodaLoopCurriculum } from './authored/ooda-loop'
import { reciprocalBearingsCurriculum } from './authored/reciprocal-bearings'
import { wholeCircleBearingsCurriculum } from './authored/whole-circle-bearings'

/** v5 items always have ids; the fallback keeps legacy in-memory fixtures usable. */
export function learningItemId(item: Item, index: number): string {
  return item.id ?? `item-${index + 1}`
}

export function hash(value: string): number {
  let result = 2166136261
  for (const character of value) result = Math.imul(result ^ character.charCodeAt(0), 16777619)
  return result >>> 0
}

/** A fixed shuffle: same seed, same order, so a lesson reads the same every time. */
export function ordered(values: string[], seed: string): string[] {
  return values.map(value => ({ value, key: hash(`${seed}:${value}`) }))
    .sort((a, b) => a.key - b.key || (a.value < b.value ? -1 : a.value > b.value ? 1 : 0))
    .map(({ value }) => value)
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
        body: item.stimulus ? '' : item.answer, itemId, ...(item.stimulus ? { altText: item.stimulus.alt } : {}) }, ask]
    })
    steps.push({ kind: 'checkpoint', id: `${id}-checkpoint`, itemIds: ids })
    return { id, title: `Lesson ${index + 1}`, steps }
  }) }
}

/** Authored curricula can override the generated default (owner, 2026-10-29). */
const AUTHORED: ReadonlyMap<string, Curriculum> = new Map([
  ['ooda-loop', oodaLoopCurriculum],
  ['whole-circle-bearings', wholeCircleBearingsCurriculum],
  ['reciprocal-bearings', reciprocalBearingsCurriculum],
  ['north-references-declination', northReferencesDeclinationCurriculum],
  ['grid-north-map-bearings', gridNorthMapBearingsCurriculum],
])

const curricula = new WeakMap<Topic, Curriculum | undefined>()

export function curriculumFor(topic: Topic): Curriculum | undefined {
  if (curricula.has(topic)) return curricula.get(topic)
  const curriculum = !topic.items.length || morseLessonPath(topic)
    ? undefined : AUTHORED.get(topic.id) ?? generatedCurriculum(topic)
  curricula.set(topic, curriculum)
  return curriculum
}

export function nextLesson(topic: Topic) {
  const curriculum = curriculumFor(topic)
  return curriculum && (nextStage(topic, curriculum) ?? curriculum.stages[0])
}

export function lessonForItem(topic: Topic, itemId: string) {
  return curriculumFor(topic)?.stages.find(stage => stage.steps.some(step =>
    ('itemId' in step && step.itemId === itemId) || ('itemIds' in step && step.itemIds.includes(itemId))))
}
