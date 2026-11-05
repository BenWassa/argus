import { describe, expect, it } from 'vitest'
import { seedLibrary } from '../../library/catalogSeed'
import { curriculumFor } from '../generatedCurriculum'
import { checkCurriculum, askedItemIds } from '../stages'
import { greekAlphabetCurriculum, greekLessonLetters } from './greek-alphabet'

const topic = seedLibrary().topics.find(entry => entry.id === 'greek-alphabet')!
const byId = new Map(topic.items.map(item => [item.id!, item]))

describe('#325 Greek authored curriculum', () => {
  it('serves the authored curriculum for Greek', () => {
    expect(curriculumFor(topic)).toBe(greekAlphabetCurriculum)
  })

  it('uses readable ids and short title-case stage titles', () => {
    expect(greekAlphabetCurriculum.stages.map(stage => stage.title)).toEqual([
      'Familiar Shapes', 'Distinctive Outlines', 'Similar Capitals',
      'Deceptive Lookalikes', 'Easily Confused', 'Finish and Mix',
    ])
    for (const stage of greekAlphabetCurriculum.stages) {
      expect(stage.id).toMatch(/^[a-z]+(?:-[a-z]+)*$/)
      expect(stage.id).not.toMatch(/^lesson-/)
      expect(stage.title.length).toBeLessThanOrEqual(40)
    }
  })

  it('covers exactly the original 24 item identities with all six small packets', () => {
    expect(topic.items).toHaveLength(24)
    expect(greekLessonLetters).toHaveLength(24)
    expect(new Set(greekLessonLetters.map(letter => letter.ordinal)).size).toBe(24)
    expect(checkCurriculum(greekAlphabetCurriculum, new Set(byId.keys()))).toEqual([])
    expect(greekAlphabetCurriculum.stages).toHaveLength(6)
    expect(greekAlphabetCurriculum.stages.every(stage => stage.steps.length <= 16)).toBe(true)
    const covered = new Set(greekAlphabetCurriculum.stages.flatMap(stage => stage.steps.flatMap(askedItemIds)))
    expect(covered).toEqual(new Set(byId.keys()))
  })

  it('preserves Unicode symbols and the existing exact glyph -> name answer key', () => {
    for (const letter of greekLessonLetters) {
      const id = `greek-alphabet-item-${String(letter.ordinal).padStart(2, '0')}`
      expect(byId.get(id)).toMatchObject({ prompt: letter.forms, answer: letter.name, kind: 'forward' })
      const step = greekAlphabetCurriculum.stages.flatMap(stage => stage.steps)
        .find(entry => entry.kind === 'choose' && entry.id.endsWith(`choose-${letter.ordinal}`))
      expect(step).toMatchObject({ kind: 'choose', itemId: id, answer: letter.name })
    }
    expect(byId.get('greek-alphabet-item-18')!.prompt).toBe('Σ σ ς')
    expect([...byId.get('greek-alphabet-item-18')!.prompt].map(char => char.codePointAt(0)))
      .toContain(0x03C2)
    expect(byId.get('greek-alphabet-item-12')!.prompt).toBe('Μ μ')
    expect(byId.get('greek-alphabet-item-12')!.prompt).not.toContain('µ') // SI micro SIGN is different.
  })

  it('uses correct four-tile keys and explains wrong answers without new Test modes', () => {
    const asks = greekAlphabetCurriculum.stages.flatMap(stage => stage.steps)
      .filter(step => step.kind === 'choose')
    for (const ask of asks) {
      if (ask.kind !== 'choose') continue
      expect(ask.options).toHaveLength(4)
      expect(new Set(ask.options).size).toBe(4)
      expect(ask.options.filter(option => option === ask.answer)).toHaveLength(1)
      expect(ask.answer).toBe(byId.get(ask.itemId)!.answer)
      expect(ask.explain).toContain(ask.answer)
    }
    const contrasts = greekAlphabetCurriculum.stages.flatMap(stage => stage.steps)
      .filter(step => step.kind === 'contrast')
    expect(contrasts.length).toBeGreaterThanOrEqual(8)
    for (const step of contrasts) {
      if (step.kind !== 'contrast') continue
      expect(step.itemIds).toContain(step.answerItemId)
      expect(step.explain.length).toBeGreaterThan(20)
    }
  })

  it('finishes each stage with a checkpoint and reviews earlier letters', () => {
    for (const [index, stage] of greekAlphabetCurriculum.stages.entries()) {
      expect(stage.steps.at(-1)?.kind).toBe('checkpoint')
      expect(stage.steps.some(step => step.kind === 'show')).toBe(true)
      expect(stage.steps.some(step => step.kind === 'choose')).toBe(true)
      if (index > 0) expect(stage.steps.some(step => step.id.includes('-review-'))).toBe(true)
    }
  })
})
