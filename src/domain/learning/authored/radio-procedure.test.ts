import { describe, expect, it } from 'vitest'
import { seedLibrary } from '../../library/catalogSeed'
import { curriculumFor } from '../generatedCurriculum'
import { askedItemIds, checkCurriculum, MAX_STEPS_PER_STAGE } from '../stages'
import { radioProcedureCurriculum as curriculum } from './radio-procedure'

const topic = seedLibrary().topics.find(entry => entry.id === 'radio-procedure')!
const items = new Map(topic.items.map(item => [item.id!, item]))
const ids = new Set(items.keys())
const wordAnswers = new Set(topic.items.slice(0, 12).map(item => item.answer))
const steps = curriculum.stages.flatMap(stage => stage.steps)
const publishedOrders = new Map([
  ['radio-procedure-item-13', ['Called station', 'THIS IS', 'Calling station', 'Invitation to reply']],
  ['radio-procedure-item-14', ['ALL STATIONS', 'THIS IS', 'Calling station', 'Invitation to reply']],
  ['radio-procedure-item-15', ['Call', 'Addressee reply', 'Message', 'Acknowledgement or ending']],
])

describe('authored Radio Procedure curriculum', () => {
  it('passes the full-coverage contract for all fifteen shipped items', () => {
    expect(ids.size).toBe(15)
    expect(checkCurriculum(curriculum, ids)).toEqual([])
    expect(new Set(steps.flatMap(askedItemIds))).toEqual(ids)
    expect(new Set(steps.filter(step => step.kind !== 'checkpoint').flatMap(askedItemIds))).toEqual(ids)
  })

  it('has readable title-case stages that end summary then checkpoint', () => {
    expect(curriculum.stages.map(stage => stage.id)).toEqual([
      'words-that-agree', 'ending-and-turns', 'fixing-mistakes', 'call-order', 'putting-it-together',
    ])
    for (const stage of curriculum.stages) {
      expect(stage.id).not.toMatch(/^lesson-/)
      expect(stage.title.length).toBeLessThanOrEqual(40)
      expect(stage.title).toMatch(/^[A-Z][a-z]+(?: (?:and|that|the|[A-Z][a-z]+))*$/)
      expect(stage.steps.at(-1)?.kind).toBe('checkpoint')
      expect(stage.steps.at(-2)?.kind).toBe('summary')
      expect(stage.steps.length).toBeLessThanOrEqual(MAX_STEPS_PER_STAGE)
    }
  })

  it('uses exact shipped meanings, answer-first, with only shipped answers as options', () => {
    for (const step of steps) {
      if (step.kind !== 'choose') continue
      expect(step.answer, step.id).toBe(items.get(step.itemId)!.answer)
      expect(step.options[0], step.id).toBe(step.answer)
      expect(new Set(step.options).size, step.id).toBe(step.options.length)
      for (const option of step.options) expect(wordAnswers.has(option), step.id).toBe(true)
      expect(step.explain, step.id).not.toBe(step.answer)
    }
    for (const step of steps.filter(step => step.kind === 'show' && step.itemId)) {
      if (step.kind === 'show') expect(step.body, step.id).toBe(items.get(step.itemId!)!.answer)
    }
  })

  it('builds each published call order exactly, once', () => {
    const orders = steps.filter(step => step.kind === 'order')
    expect(orders).toHaveLength(3)
    for (const step of orders) {
      if (step.kind !== 'order') continue
      expect(step.blocks, step.id).toEqual(publishedOrders.get(step.itemId))
      expect(step.blocks.join(' → '), step.id).toBe(items.get(step.itemId)!.answer)
      expect(step.prompt, step.id).toBe(items.get(step.itemId)!.prompt)
    }
  })

  it('keeps contrasts to word items, whose prompts are the tile labels', () => {
    const contrasts = steps.filter(step => step.kind === 'contrast')
    expect(contrasts.length).toBeGreaterThan(0)
    for (const step of contrasts) {
      if (step.kind !== 'contrast') continue
      expect(step.itemIds.includes(step.answerItemId), step.id).toBe(true)
      for (const id of step.itemIds) expect(items.get(id)!.stimulus, step.id).toBeUndefined()
      expect(step.prompt, step.id).toBe(items.get(step.answerItemId)!.answer)
    }
  })

  it('serves the authored curriculum for the seeded topic', () => {
    expect(curriculumFor(topic)).toBe(curriculum)
  })
})
