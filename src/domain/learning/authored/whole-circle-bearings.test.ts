import { describe, expect, it } from 'vitest'
import { A1_FIND_BEARINGS, A1_READ_BEARINGS, findBearingItems, readBearingItems } from '../../navigation/bearingBanks'
import { angularSeparation, formatBearing, normalize } from '../../navigation/bearings'
import { bearingTopics } from '../../navigation/bearingTopics'
import { askedItemIds, checkCurriculum, isAsking } from '../stages'
import { wholeCircleBearingsCurriculum as curriculum } from './whole-circle-bearings'

const topic = bearingTopics().find(topic => topic.id === 'whole-circle-bearings')!
const steps = curriculum.stages.flatMap(stage => stage.steps)
const itemIds = new Set(topic.items.map(item => item.id!))
const figureItemIds = new Set(topic.items.filter(item => item.stimulus?.source.kind === 'figure').map(item => item.id!))

describe('authored whole-circle bearings', () => {
  it('passes the full-coverage contract with every figure identified', () => {
    expect(itemIds.size).toBe(12)
    expect(figureItemIds.size).toBe(12)
    expect(checkCurriculum(curriculum, itemIds, { requireFullCoverage: true, figureItemIds })).toEqual([])
    const directlyAsked = steps.filter(step => step.kind !== 'checkpoint').flatMap(askedItemIds)
    expect(new Set(directlyAsked)).toEqual(itemIds)
  })

  it('uses distinct authored ids and short stages that end by checking their own items', () => {
    expect(new Set(curriculum.stages.map(stage => stage.id)).size).toBe(curriculum.stages.length)
    expect(new Set(steps.map(step => step.id)).size).toBe(steps.length)
    for (const stage of curriculum.stages) {
      expect(stage.id).not.toMatch(/^lesson-\d+$/)
      expect(stage.steps.length).toBeGreaterThanOrEqual(6)
      expect(stage.steps.length).toBeLessThanOrEqual(12)
      const checkpoint = stage.steps.at(-1)!
      expect(checkpoint.kind).toBe('checkpoint')
      if (checkpoint.kind !== 'checkpoint') throw new Error('Missing final checkpoint')
      expect(new Set(checkpoint.itemIds)).toEqual(new Set(stage.steps.slice(0, -1).flatMap(askedItemIds)))
      for (const [index, step] of stage.steps.entries()) {
        if (step.kind !== 'show') continue
        const adjacent = [stage.steps[index - 1], stage.steps[index + 1]].filter(Boolean)
        expect(adjacent.some(adjacentStep => isAsking(adjacentStep) && askedItemIds(adjacentStep).includes(step.itemId!))).toBe(true)
      }
    }
  })

  it('checks every choose and complete answer against the real banks and dial bearings', () => {
    const bank = [...readBearingItems(), ...findBearingItems()]
    for (const step of steps) {
      if (step.kind !== 'choose' && step.kind !== 'complete') continue
      const index = topic.items.findIndex(item => item.id === step.itemId)
      expect(index, step.id).toBeGreaterThanOrEqual(0)
      expect(step.answer, step.id).toBe(bank[index].answer)
      expect(step.answer, step.id).toBe(topic.items[index].answer)
      // All four options reuse the bank's counterclockwise, wrong-end and wrong-origin rays.
      expect([...step.options].sort(), step.id).toEqual([...bank[index].choice!.options].sort())
      const source = topic.items[index].stimulus!.source
      if (source.kind !== 'figure' || source.figure.kind !== 'angle-dial') throw new Error('Expected an angle dial')
      expect(source.figure.reference).toBe('T')
      if (index < A1_READ_BEARINGS.length) {
        expect(step.answer).toBe(formatBearing(A1_READ_BEARINGS[index], 'T'))
        expect(source.figure.pointers[0].bearing).toBe(normalize(A1_READ_BEARINGS[index]))
      } else {
        const bearing = A1_FIND_BEARINGS[index - A1_READ_BEARINGS.length]
        const pointer = source.figure.pointers.find(pointer => `Ray ${pointer.label}` === step.answer)!
        expect(pointer.bearing).toBe(normalize(bearing))
        // `complete` preserves the requested bearing beside the pictured item in StageRunner.
        expect(step.kind).toBe('complete')
        if (step.kind === 'complete') expect(step.before).toContain(formatBearing(bearing, 'T'))
      }
    }
  })

  it('gives every shown dial a text equivalent matching all its rays', () => {
    for (const step of steps) {
      if (step.kind !== 'show' || !step.itemId) continue
      const source = topic.items.find(item => item.id === step.itemId)!.stimulus!.source
      if (source.kind !== 'figure' || source.figure.kind !== 'angle-dial') throw new Error('Expected an angle dial')
      for (const pointer of source.figure.pointers) {
        expect(step.altText, step.id).toContain(formatBearing(pointer.bearing, 'T').slice(0, -1))
        if (pointer.label) expect(step.altText).toContain(`${pointer.label} at `)
      }
    }
  })

  it('verifies the north-edge and notation examples with the real arithmetic', () => {
    expect(formatBearing(5, 'T')).toBe('005°T')
    expect(formatBearing(360, 'T')).toBe('000°T')
    expect(normalize(360)).toBe(0)
    expect(angularSeparation(5, 355)).toBe(10)
    const nearNorth = steps.find(step => step.id === 'north-west-side')!
    expect(nearNorth.kind === 'show' && nearNorth.body).toContain(`${angularSeparation(5, 355)}° apart`)
  })
})
