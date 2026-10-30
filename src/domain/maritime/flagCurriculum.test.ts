import { describe, expect, it } from 'vitest'
import { checkCurriculum, isAsking } from '../learning/stages'
import { flagCurriculum } from './flagCurriculum'
import { flagTopic } from './flagTopic'
import { FLAG_CONFUSION_SETS } from './flags'

const items = flagTopic().items
const steps = flagCurriculum.stages.flatMap((stage) => stage.steps)
const idFor = (letter: string) => items.find((item) => {
  const source = item.stimulus?.source
  return source?.kind === 'figure' && source.figure.kind === 'signal-flag' && source.figure.letter === letter
})!.id!

describe('draft signal flag curriculum', () => {
  it('validates full coverage and figure text equivalents against the real topic', () => {
    expect(checkCurriculum(flagCurriculum, new Set(items.map((item) => item.id!)), {
      requireFullCoverage: true,
      figureItemIds: new Set(items.filter((item) => item.stimulus?.source.kind === 'figure').map((item) => item.id!)),
    })).toEqual([])
  })

  it('preserves the scored answers, options, prompts and published visual text', () => {
    for (const step of steps) {
      if (step.kind === 'choose' || step.kind === 'complete') {
        const item = items.find((candidate) => candidate.id === step.itemId)!
        expect(step.answer).toBe(item.answer)
        expect(step.options).toEqual(item.choice!.options)
        if (step.kind === 'choose') expect(step.prompt).toBe(item.prompt)
      }
      // This topic has no published sequences; an order step would expand its boundary.
      if (step.kind === 'order') throw new Error('Signal flags has no published order')
      if (step.kind === 'show') {
        expect(step.altText).toBe(items.find((item) => item.id === step.itemId)!.stimulus!.alt)
      }
    }
    expect(steps.filter((step) => step.kind === 'show')).toHaveLength(12)
    expect(steps.filter((step) => step.kind === 'choose')).toHaveLength(12)
  })

  it('keeps the five stages within the requested lesson sizes', () => {
    expect(flagCurriculum.stages.map((stage) => stage.title)).toEqual([
      'Serious Signals', 'Look-Alikes I', 'Look-Alikes II', 'The Rest', 'All Twelve',
    ])
    const groups = [['A', 'B', 'O'], ['U', 'V', 'W'], ['D', 'F', 'M'], ['J', 'L', 'Y']]
    for (const [index, stage] of flagCurriculum.stages.entries()) {
      expect(stage.steps.length).toBeGreaterThanOrEqual(3)
      expect(stage.steps.filter(isAsking).length).toBeLessThanOrEqual(6)
      if (index < groups.length) {
        expect(stage.steps.filter((step) => step.kind === 'show').map((step) => step.itemId))
          .toEqual(groups[index].map(idFor))
      }
    }
    const final = flagCurriculum.stages[4].steps
    expect(final[0]).toEqual({ kind: 'checkpoint', id: 'checkpoint-all-twelve', itemIds: items.map((item) => item.id) })
    expect(final.slice(1).map((step) => step.kind === 'contrast' ? step.itemIds : []))
      .toEqual(FLAG_CONFUSION_SETS.map((set) => set.map(idFor)))
  })
})
