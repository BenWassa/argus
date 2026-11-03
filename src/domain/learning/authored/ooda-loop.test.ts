import { describe, expect, it } from 'vitest'
import { seedLibrary } from '../../library/catalogSeed'
import { checkCurriculum } from '../stages'
import { oodaLoopCurriculum } from './ooda-loop'

describe('OODA Loop authored lessons', () => {
  const topic = seedLibrary().topics.find(candidate => candidate.id === 'ooda-loop')!
  const ids = new Set(topic.items.map(item => item.id!))

  it('passes the curriculum check with every scored item asked', () => {
    expect(checkCurriculum(oodaLoopCurriculum, ids)).toEqual([])
  })

  it('never reuses the generated lesson id shape and ends each stage in a checkpoint', () => {
    for (const stage of oodaLoopCurriculum.stages) {
      expect(stage.id).not.toMatch(/^lesson-\d+$/)
      expect(stage.steps.at(-1)?.kind).toBe('checkpoint')
    }
  })

  it('orders the stages the way the topic scores them', () => {
    const order = oodaLoopCurriculum.stages.flatMap(stage => stage.steps).find(step => step.kind === 'order')
    expect(order && 'blocks' in order && order.blocks).toEqual(topic.items.map(item => item.answer.split(' — ')[0]))
  })

  it('retains the two existing stage IDs and adds small contrast and feedback lessons', () => {
    expect(oodaLoopCurriculum.stages.map(stage => stage.id)).toEqual([
      'the-four-stages', 'how-they-connect', 'seeing-vs-interpreting', 'hypothesis-test-feedback',
    ])
    const contrasts = oodaLoopCurriculum.stages[2].steps.filter(step => step.kind === 'choose')
    expect(contrasts).toHaveLength(3)
    expect(contrasts.find(step => step.id === 'seeing-choose-inference')).toMatchObject({
      itemId: 'ooda-loop-item-02',
      answer: 'A dependency change may be causing the errors.',
    })
    expect(oodaLoopCurriculum.stages[3].steps.find(step => step.id === 'feedback-choose-return'))
      .toMatchObject({ itemId: 'ooda-loop-item-01', answer: 'It feeds new observation and orientation.' })
  })

  it('has uniquely keyed, corrective formative questions without expanding the four scored items', () => {
    const steps = oodaLoopCurriculum.stages.flatMap(stage => stage.steps)
    expect(new Set(steps.map(step => step.id)).size).toBe(steps.length)
    expect(steps.filter(step => step.kind === 'choose').every(step =>
      step.options.includes(step.answer) && step.explain.length > 20)).toBe(true)
    const four = topic.items.map(item => item.id)
    expect(four).toEqual(['ooda-loop-item-01', 'ooda-loop-item-02', 'ooda-loop-item-03', 'ooda-loop-item-04'])
    expect(steps.filter(step => step.kind === 'order').map(step => step.blocks))
      .toEqual([['Observe', 'Orient', 'Decide', 'Act'], ['Observe', 'Orient', 'Decide', 'Act']])
    expect(steps.some(step => ('prompt' in step && /firearm|patient|diagnos|medical/i.test(step.prompt)))).toBe(false)
  })
})
