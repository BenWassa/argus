import { describe, expect, it } from 'vitest'
import { checkCurriculum, isAsking } from '../learning/stages'
import { radioProcedureTopic } from './radioTopics'
import { radioProcedureCurriculum } from './radioProcedureCurriculum'

const items = radioProcedureTopic().items
const byId = new Map(items.map((item) => [item.id!, item]))
const steps = radioProcedureCurriculum.stages.flatMap((stage) => stage.steps)
const publishedOrders = new Map([
  ['radio-procedure-item-13', ['Called station', 'THIS IS', 'Calling station', 'Invitation to reply']],
  ['radio-procedure-item-14', ['ALL STATIONS', 'THIS IS', 'Calling station', 'Invitation to reply']],
  ['radio-procedure-item-15', ['Call', 'Addressee reply', 'Message', 'Acknowledgement or ending']],
])

describe('draft Radio Procedure curriculum', () => {
  it('passes the real topic boundary with full coverage', () => {
    expect(items).toHaveLength(15)
    expect(checkCurriculum(radioProcedureCurriculum, new Set(byId.keys()), {
      requireFullCoverage: true,
    })).toEqual([])
  })

  it('preserves every scored answer and published order', () => {
    for (const step of steps) {
      if (step.kind === 'choose' || step.kind === 'complete') {
        const item = byId.get(step.itemId)!
        expect(step.answer, step.id).toBe(item.answer)
        const allowed = item.choice?.options ?? items.slice(0, 12).map((word) => word.answer)
        // Complete steps distinguish the three real structures rather than inventing dialogue.
        const allowedOptions = step.kind === 'complete'
          ? items.slice(12).map((sequence) => sequence.answer)
          : allowed
        for (const option of step.options) expect(allowedOptions, step.id).toContain(option)
      }
      if (step.kind === 'order') {
        expect(step.blocks, step.id).toEqual(publishedOrders.get(step.itemId))
        expect(step.blocks.join(' → '), step.id).toBe(byId.get(step.itemId)!.answer)
      }
    }
    expect(steps.filter((step) => step.kind === 'order')).toHaveLength(3)
    // The source gives call structure only as placeholders, with no dialogue, so a `complete`
    // step could only repeat the call-order question. None is used.
    expect(steps.filter((step) => step.kind === 'complete')).toHaveLength(0)
    expect(steps.filter((step) => step.kind === 'choose')).toHaveLength(15)
  })

  it('keeps the five requested stages within the step budget', () => {
    expect(radioProcedureCurriculum.stages.map((stage) => stage.title)).toEqual([
      'Words That Agree', 'Ending and Turns', 'Fixing Mistakes', 'Call Order', 'Putting It Together',
    ])
    for (const stage of radioProcedureCurriculum.stages) {
      expect(stage.steps.length, stage.id).toBeGreaterThanOrEqual(3)
      expect(stage.steps.filter(isAsking).length, stage.id).toBeLessThanOrEqual(6)
      expect(stage.steps[0].kind).toBe('show')
      expect(stage.steps.at(-1)?.kind).toBe('summary')
    }
    const checkpoint = steps.find((step) => step.kind === 'checkpoint')!
    expect(checkpoint.kind === 'checkpoint' && [...checkpoint.itemIds].sort()).toEqual([...byId.keys()].sort())
  })
})
