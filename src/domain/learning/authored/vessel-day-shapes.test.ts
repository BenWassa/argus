import { describe, expect, it } from 'vitest'
import { seedLibrary } from '../../library/catalogSeed'
import { curriculumFor, generatedCurriculum } from '../generatedCurriculum'
import { askedItemIds, checkCurriculum, MAX_STEPS_PER_STAGE } from '../stages'
import { vesselDayShapesCurriculum as curriculum } from './vessel-day-shapes'

const topic = seedLibrary().topics.find(candidate => candidate.id === 'vessel-day-shapes')!
const items = new Map(topic.items.map(item => [item.id!, item]))
const ids = new Set(items.keys())
const answers = new Set(topic.items.map(item => item.answer))
const steps = curriculum.stages.flatMap(stage => stage.steps)

describe('unregistered Vessel Day Shapes candidate', () => {
  it('passes the full-coverage figure contract for all five shipped items', () => {
    expect(ids.size).toBe(5)
    const figureItemIds = new Set(topic.items.filter(item => item.stimulus?.source.kind === 'figure').map(item => item.id!))
    expect(figureItemIds.size).toBe(5)
    expect(checkCurriculum(curriculum, ids, { figureItemIds })).toEqual([])
    expect(new Set(steps.flatMap(askedItemIds))).toEqual(ids)
    expect(new Set(steps.filter(step => step.kind !== 'checkpoint').flatMap(askedItemIds))).toEqual(ids)
  })

  it('preserves the four ordered stages within step limits', () => {
    expect(curriculum.stages.map(stage => stage.id)).toEqual([
      'shape-ball-count', 'shape-middle-diamond', 'shape-fishing-cones', 'shape-mixed-signals',
    ])
    for (const stage of curriculum.stages) {
      expect(stage.steps.length).toBeGreaterThan(0)
      expect(stage.steps.length).toBeLessThanOrEqual(MAX_STEPS_PER_STAGE)
    }
  })

  it('uses exact shipped answers with unique options and the correct answer present', () => {
    for (const step of steps) {
      if (step.kind === 'choose' || step.kind === 'complete') {
        expect(step.answer, step.id).toBe(items.get(step.itemId)!.answer)
        expect(answers.has(step.answer), step.id).toBe(true)
        expect(new Set(step.options).size, step.id).toBe(step.options.length)
        expect(step.options, step.id).toContain(step.answer)
        for (const option of step.options) expect(answers.has(option), step.id).toBe(true)
      }
    }
  })

  it('keeps authored and canonical figure alternatives free of answer meanings', () => {
    for (const item of topic.items) {
      expect(item.stimulus?.alt.trim(), item.id).toBeTruthy()
      for (const answer of answers) expect(item.stimulus!.alt.toLowerCase(), item.id).not.toContain(answer.toLowerCase())
    }
    for (const step of steps) {
      if (step.kind !== 'show' || !step.itemId) continue
      expect(step.altText?.trim(), step.id).toBeTruthy()
      for (const answer of answers) expect(step.altText!.toLowerCase(), step.id).not.toContain(answer.toLowerCase())
      expect(step.altText, step.id).not.toMatch(/anchor|aground|fishing|trawling|command|manoeuvre/i)
    }
  })

  it('leaves the seeded topic on generated lessons, outside the authored registry', () => {
    expect(curriculumFor(topic)).toEqual(generatedCurriculum(topic))
    expect(curriculumFor(topic)).not.toBe(curriculum)
    expect(curriculumFor(topic)!.stages.map(stage => stage.id)).toEqual(['lesson-1'])
  })

  it('never asks a picture question without its picture', () => {
    // A contrast step labels its tiles with item prompts and shows no figure.
    expect(steps.filter(step => step.kind === 'contrast')).toEqual([])
    for (const step of steps) if (step.kind === 'choose') expect(items.get(step.itemId)?.stimulus, step.id).toBeTruthy()
    const contrasts = steps.filter(step => step.id.endsWith('-contrast'))
    expect(contrasts.map(step => step.kind === 'choose' && step.options.length)).toEqual([2, 2])
  })
})
