import { describe, expect, it } from 'vitest'
import { seedLibrary } from '../../library/catalogSeed'
import { FLAG_CONFUSION_SETS } from '../../maritime/flags'
import { curriculumFor } from '../generatedCurriculum'
import { askedItemIds, checkCurriculum, MAX_STEPS_PER_STAGE } from '../stages'
import { signalFlagsCurriculum as curriculum } from './signal-flags'

const topic = seedLibrary().topics.find(entry => entry.id === 'signal-flags')!
const items = new Map(topic.items.map(item => [item.id!, item]))
const ids = new Set(items.keys())
const answers = new Set(topic.items.map(item => item.answer))
const steps = curriculum.stages.flatMap(stage => stage.steps)

describe('authored Signal Flags curriculum', () => {
  it('passes the full-coverage figure contract for all twelve shipped items', () => {
    expect(ids.size).toBe(12)
    const figureItemIds = new Set(topic.items.filter(item => item.stimulus?.source.kind === 'figure').map(item => item.id!))
    expect(figureItemIds.size).toBe(12)
    expect(checkCurriculum(curriculum, ids, { figureItemIds })).toEqual([])
    expect(new Set(steps.flatMap(askedItemIds))).toEqual(ids)
    // Every flag is asked directly, not only inside a checkpoint.
    expect(new Set(steps.filter(step => step.kind !== 'checkpoint').flatMap(askedItemIds))).toEqual(ids)
  })

  it('has readable title-case stages that end summary then checkpoint', () => {
    expect(curriculum.stages.map(stage => stage.id)).toEqual([
      'serious-signals', 'danger-and-assistance', 'difficulty-disabled-stopped', 'fire-stop-and-anchor', 'all-twelve',
    ])
    for (const stage of curriculum.stages) {
      expect(stage.id).not.toMatch(/^lesson-/)
      expect(stage.title.length).toBeLessThanOrEqual(40)
      expect(stage.title).toMatch(/^[A-Z][a-z]+(?:,? (?:and|the|[A-Z][a-z]+))*$/)
      expect(stage.steps.at(-1)?.kind).toBe('checkpoint')
      expect(stage.steps.at(-2)?.kind).toBe('summary')
      expect(stage.steps.length).toBeLessThanOrEqual(MAX_STEPS_PER_STAGE)
    }
  })

  it('uses exact shipped answers, answer-first, with only shipped answers as options', () => {
    for (const step of steps) {
      if (step.kind !== 'choose') continue
      expect(step.answer, step.id).toBe(items.get(step.itemId)!.answer)
      expect(step.options[0], step.id).toBe(step.answer)
      expect(new Set(step.options).size, step.id).toBe(step.options.length)
      for (const option of step.options) expect(answers.has(option), step.id).toBe(true)
      // Explanations show only after a second miss and must say more than the key.
      expect(step.explain, step.id).not.toBe(step.answer)
    }
    // The full four-option introductions keep the shipped option set exactly.
    const introductions = steps.filter(step => step.kind === 'choose' && step.id.startsWith('flags-choose-'))
    expect(introductions).toHaveLength(12)
    for (const step of introductions) {
      if (step.kind === 'choose') expect([...step.options].sort(), step.id).toEqual([...items.get(step.itemId)!.choice!.options].sort())
    }
  })

  it('never asks a picture question without its picture', () => {
    // A contrast step labels its tiles with item prompts and shows no figure.
    expect(steps.filter(step => step.kind === 'contrast')).toEqual([])
    for (const step of steps) {
      if (step.kind === 'choose') expect(items.get(step.itemId)?.stimulus, step.id).toBeTruthy()
    }
  })

  it('shows each flag with its shipped geometry-only text, never naming the answer', () => {
    const shows = steps.filter(step => step.kind === 'show' && step.itemId)
    expect(shows).toHaveLength(12)
    for (const step of shows) {
      if (step.kind !== 'show') continue
      expect(step.altText, step.id).toBe(items.get(step.itemId!)!.stimulus!.alt)
      for (const answer of answers) expect(step.altText!.toLowerCase(), step.id).not.toContain(answer.toLowerCase())
    }
  })

  it('compares every designed confusion set with the pictured flag', () => {
    const compares = steps.filter(step => step.kind === 'choose' && step.id.includes('-compare-'))
    for (const set of FLAG_CONFUSION_SETS) {
      const covered = compares.some(step => step.kind === 'choose'
        && set.every(letter => step.options.some(option => option.startsWith(`${letter} (`))))
      expect(covered, set.join('')).toBe(true)
    }
  })

  it('serves the authored curriculum for the seeded topic', () => {
    expect(curriculumFor(topic)).toBe(curriculum)
  })
})
