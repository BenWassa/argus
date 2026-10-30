import { describe, expect, it } from 'vitest'
import { seedLibrary } from '../library/catalogSeed'
import type { Topic } from '../library/topic'
import { checkCurriculum, MAX_STAGES, MAX_STEPS_PER_STAGE } from './stages'
import { curriculumFor, generatedCurriculum, learningItemId, lessonForItem, nextLesson } from './generatedCurriculum'

const base = seedLibrary().topics.find(topic => topic.id === 'nato-phonetic')!
function topic(count: number): Topic {
  return { ...base, status: 'unstarted', drilledAt: null, completedAt: null, items: Array.from({ length: count }, (_, index) => ({
    id: `item-${index}`, prompt: `Prompt ${index}`, answer: `Answer ${index}`,
  })) }
}
const sizes = (count: number) => generatedCurriculum(topic(count)).stages.map(stage => stage.steps.filter(step => step.kind === 'show').length)

describe('generated curricula', () => {
  it.each([[1, [1]], [2, [2]], [4, [4]], [5, [5]], [6, [3, 3]], [7, [4, 3]], [9, [4, 5]], [10, [4, 3, 3]], [26, [4, 4, 4, 4, 4, 3, 3]]])('chunks %i items without a tiny trailing lesson', (count, expected) => {
    expect(sizes(count as number)).toEqual(expected)
  })

  it('keeps stored order, paired show/ask steps and a final checkpoint', () => {
    const input = topic(9)
    const curriculum = generatedCurriculum(input)
    expect(curriculum.stages.map(stage => stage.id)).toEqual(['lesson-1', 'lesson-2'])
    expect(curriculum.stages.map(stage => stage.title)).toEqual(['Lesson 1', 'Lesson 2'])
    expect(curriculum.stages.flatMap(stage => stage.steps.filter(step => step.kind === 'show').map(step => step.itemId))).toEqual(input.items.map(item => item.id))
    for (const stage of curriculum.stages) {
      for (let index = 0; index < stage.steps.length - 1; index += 2) {
        expect(stage.steps[index].kind).toBe('show')
        const show = stage.steps[index]
        expect(stage.steps[index + 1]).toMatchObject({ kind: 'choose', itemId: show.kind === 'show' ? show.itemId : undefined })
      }
      expect(stage.steps.at(-1)).toMatchObject({ kind: 'checkpoint', itemIds: stage.steps.filter(step => step.kind === 'show').map(step => step.itemId) })
    }
  })

  it('is deterministic and chooses distinct topic answers with the correct answer exactly once', () => {
    const input = topic(20)
    input.items[1].answer = input.items[0].answer
    const curriculum = generatedCurriculum(input)
    expect(generatedCurriculum(input)).toEqual(curriculum)
    const answerPositions = new Set<number>()
    for (const step of curriculum.stages.flatMap(stage => stage.steps)) {
      if (step.kind !== 'choose') continue
      expect(step.options).toHaveLength(4)
      expect(new Set(step.options).size).toBe(4)
      expect(step.options.filter(answer => answer === step.answer)).toHaveLength(1)
      expect(step.options.every(answer => input.items.some(item => item.answer === answer))).toBe(true)
      answerPositions.add(step.options.indexOf(step.answer))
    }
    expect(answerPositions.size).toBeGreaterThan(1)
  })

  it('uses recall for one distinct answer and only available options for a tiny topic', () => {
    const input = topic(3)
    input.items.forEach(item => { item.answer = 'Same' })
    expect(generatedCurriculum(input).stages[0].steps.filter(step => step.kind === 'recall')).toHaveLength(3)
    expect(generatedCurriculum(topic(2)).stages[0].steps.find(step => step.kind === 'choose')).toMatchObject({ options: expect.arrayContaining(['Answer 0', 'Answer 1']) })
  })

  it('validates every supported size, growing lessons after 48 items', () => {
    for (let count = 1; count <= 84; count++) {
      const input = topic(count)
      const curriculum = generatedCurriculum(input)
      expect(checkCurriculum(curriculum, new Set(input.items.map((item, index) => learningItemId(item, index)))), `size ${count}`).toEqual([])
      expect(curriculum.stages.length).toBeLessThanOrEqual(MAX_STAGES)
      expect(curriculum.stages.every(stage => stage.steps.length <= MAX_STEPS_PER_STAGE)).toBe(true)
    }
    expect(sizes(49).some(size => size > 4)).toBe(true)
    // A learner's own very large topic never throws; it gets longer lessons and
    // stays within the stored progress limit.
    const large = generatedCurriculum(topic(200))
    expect(large.stages.length).toBeLessThanOrEqual(MAX_STAGES)
    expect(large.stages.flatMap(stage => stage.steps.filter(step => step.kind === 'show'))).toHaveLength(200)
  })

  it('covers every shipped ordinary topic and preserves figure alternatives and text', () => {
    for (const input of seedLibrary().topics) {
      const curriculum = curriculumFor(input)
      if (!curriculum) continue
      const ids = new Set(input.items.map((item, index) => learningItemId(item, index)))
      const figureItemIds = new Set(input.items.flatMap((item, index) => item.stimulus ? [learningItemId(item, index)] : []))
      expect(checkCurriculum(curriculum, ids, { figureItemIds }), input.id).toEqual([])
      for (const step of curriculum.stages.flatMap(stage => stage.steps)) {
        if (step.kind !== 'show') continue
        const item = input.items.find((item, index) => learningItemId(item, index) === step.itemId)!
        expect(step).toMatchObject({ title: item.stimulus ? item.answer : item.prompt, body: item.stimulus ? '' : item.answer })
        if (item.stimulus) expect(step.altText).toBe(item.stimulus.alt)
      }
    }
  })

  it('excludes Morse and empty topics and selects the next or missed lesson', () => {
    expect(curriculumFor(seedLibrary().topics.find(topic => topic.id === 'international-morse-letters-printed')!)).toBeUndefined()
    expect(curriculumFor(topic(0))).toBeUndefined()
    const input = topic(12)
    expect(nextLesson(input)?.id).toBe('lesson-1')
    expect(nextLesson({ ...input, stageProgress: { 'lesson-1': '2026-10-29T00:00:00Z' } })?.id).toBe('lesson-2')
    expect(lessonForItem(input, 'item-9')?.id).toBe('lesson-3')
    expect(nextLesson({ ...input, completedAt: '2026-10-29T00:00:00Z' })?.id).toBe('lesson-1')
  })
})

it('memoizes curricula by immutable topic object', () => {
  const input = topic(8)
  expect(curriculumFor(input)).toBe(curriculumFor(input))
  expect(curriculumFor({ ...input })).not.toBe(curriculumFor(input))
})
