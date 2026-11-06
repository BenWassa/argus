import { describe, expect, it } from 'vitest'
import { seedLibrary } from '../../library/catalogSeed'
import { curriculumFor } from '../generatedCurriculum'

/**
 * #326: Safety lesson scripts are docs-only until qualified review.
 * These assertions document the present limited scored boundary and deliberate
 * lack of registration; changing them requires an independently reviewed PR.
 */
describe('concept and safety mnemonic boundaries', () => {
  const topics = seedLibrary().topics
  const named = (id: string) => {
    const topic = topics.find(candidate => candidate.id === id)
    if (!topic) throw new Error(`Missing seeded topic: ${id}`)
    return topic
  }

  it('keeps OODA on exactly four ordered scored stage/function items', () => {
    const topic = named('ooda-loop')
    expect(topic.items.map(item => item.id)).toEqual([
      'ooda-loop-item-01', 'ooda-loop-item-02', 'ooda-loop-item-03', 'ooda-loop-item-04',
    ])
    expect(topic.items.map(item => item.answer.split(' — ')[0]))
      .toEqual(['Observe', 'Orient', 'Decide', 'Act'])
    expect(topic.scope).toContain('Nothing beyond')
  })

  it('keeps the ABCDE Test to five heading names and the medically limited scope', () => {
    const topic = named('primary-survey')
    expect(topic.items.map(item => item.id)).toEqual(
      Array.from({ length: 5 }, (_, i) => `primary-survey-item-0${i + 1}`),
    )
    expect(topic.items.map(item => item.answer)).toEqual([
      'Airway', 'Breathing', 'Circulation', 'Disability', 'Exposure',
    ])
    expect(topic.scope).toContain('not first-aid or clinical training')
    expect(curriculumFor(topic)?.stages[0].id).toBe('lesson-1')
  })

  it('keeps ACTS and PROVE as nine source-pinned printed rules, not handling training', () => {
    const topic = named('firearm-safety-acts-prove')
    expect(topic.items.map(item => item.id)).toEqual(
      Array.from({ length: 9 }, (_, i) => `firearm-safety-acts-prove-item-0${i + 1}`),
    )
    expect(topic.items.map(item => item.prompt)).toEqual([
      'ACTS 1 (A)', 'ACTS 2 (C)', 'ACTS 3 (T)', 'ACTS 4 (S)',
      'PROVE 1 (P)', 'PROVE 2 (R)', 'PROVE 3 (O)', 'PROVE 4 (V)', 'PROVE 5 (E)',
    ])
    expect(topic.items[3].answer).toContain('PROVE it safe')
    expect(topic.scope).toContain('2014')
    expect(topic.scope).toContain('not handling a firearm')
    expect(curriculumFor(topic)?.stages[0].id).toBe('lesson-1')
  })
})
