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
})
