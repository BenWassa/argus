import { describe, expect, it } from 'vitest'
import { seedLibrary } from '../../library/catalogSeed'
import { curriculumFor } from '../generatedCurriculum'
import { askedItemIds, checkCurriculum } from '../stages'
import { cloudGeneraCurriculum as curriculum } from './cloud-genera'

const topic = seedLibrary().topics.find(entry => entry.id === 'cloud-genera')!
const ids = new Set(topic.items.map(item => item.id!))
const steps = curriculum.stages.flatMap(stage => stage.steps)

describe('registered Cloud Genera curriculum', () => {
  it('is served for the topic and passes the full-coverage check', () => {
    expect(curriculumFor(topic)).toBe(curriculum)
    expect(ids.size).toBe(10)
    expect(checkCurriculum(curriculum, ids)).toEqual([])
    expect(new Set(steps.filter(step => step.kind === 'choose').flatMap(askedItemIds))).toEqual(ids)
  })

  it('shows each photograph and name before it asks, three or fewer at a time', () => {
    for (const stage of curriculum.stages) {
      const shown = new Set<string>()
      for (const step of stage.steps) {
        if (step.kind === 'show') shown.add(step.itemId!)
        if (step.kind === 'choose') expect(shown.has(step.itemId), step.id).toBe(true)
      }
      expect(shown.size).toBeLessThanOrEqual(3)
      expect(stage.steps.findIndex(step => step.kind === 'choose')).toBe(shown.size)
    }
  })

  it('pairs every show and question with the photograph and the exact shipped name', () => {
    const items = new Map(topic.items.map(item => [item.id!, item]))
    for (const step of steps) {
      if (step.kind === 'show' || step.kind === 'choose') {
        expect(step.visual?.source.kind, step.id).toBe('image')
        expect(step.visual?.credit, step.id).toMatch(/CC BY-SA/)
      }
      if (step.kind === 'show') expect(step.title).toBe(items.get(step.itemId!)!.answer)
      if (step.kind === 'choose') {
        expect(step.answer).toBe(items.get(step.itemId)!.answer)
        expect(step.options).toContain(step.answer)
        expect(step.options).toHaveLength(4)
      }
    }
  })

  it('never names the cloud in the description of a picture it asks about', () => {
    for (const step of steps) {
      if (step.kind !== 'choose') continue
      const alt = step.visual!.alt.toLowerCase()
      expect(alt, step.id).not.toContain(step.answer.toLowerCase())
      expect(alt.length, step.id).toBeGreaterThan(0)
    }
  })

  it('leaves the scored vocabulary Test exactly as shipped', () => {
    expect(topic.items.map(item => [item.id, item.prompt, item.answer])).toEqual([
      ['cloud-genera-item-01', 'Ci', 'Cirrus'], ['cloud-genera-item-02', 'Cc', 'Cirrocumulus'],
      ['cloud-genera-item-03', 'Cs', 'Cirrostratus'], ['cloud-genera-item-04', 'Ac', 'Altocumulus'],
      ['cloud-genera-item-05', 'As', 'Altostratus'], ['cloud-genera-item-06', 'Ns', 'Nimbostratus'],
      ['cloud-genera-item-07', 'St', 'Stratus'], ['cloud-genera-item-08', 'Sc', 'Stratocumulus'],
      ['cloud-genera-item-09', 'Cu', 'Cumulus'], ['cloud-genera-item-10', 'Cb', 'Cumulonimbus'],
    ])
  })
})
