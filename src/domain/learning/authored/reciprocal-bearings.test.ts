import { describe, expect, it } from 'vitest'
import { A2_CASES, reciprocalItems } from '../../navigation/bearingBanks'
import { angularSeparation, formatBearing, normalize, reciprocal } from '../../navigation/bearings'
import { bearingTopics } from '../../navigation/bearingTopics'
import { askedItemIds, checkCurriculum, isAsking } from '../stages'
import { reciprocalBearingsCurriculum as curriculum } from './reciprocal-bearings'

const topic = bearingTopics().find(topic => topic.id === 'reciprocal-bearings')!
const steps = curriculum.stages.flatMap(stage => stage.steps)
const itemIds = new Set(topic.items.map(item => item.id!))
const figureItemIds = new Set(topic.items.filter(item => item.stimulus?.source.kind === 'figure').map(item => item.id!))

describe('authored reciprocal bearings', () => {
  it('passes the full-coverage contract with both figure items identified', () => {
    expect(itemIds.size).toBe(12)
    expect(figureItemIds.size).toBe(2)
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

  it('verifies every choose and complete answer with reciprocal(), formatBearing() and the bank', () => {
    const bank = reciprocalItems()
    for (const step of steps) {
      if (step.kind !== 'choose' && step.kind !== 'complete') continue
      const index = topic.items.findIndex(item => item.id === step.itemId)
      expect(index, step.id).toBeGreaterThanOrEqual(0)
      const { bearing, ref } = A2_CASES[index]
      const back = reciprocal(bearing)
      expect(step.answer, step.id).toBe(formatBearing(back, ref))
      expect(step.answer, step.id).toBe(bank[index].answer)
      expect(step.answer, step.id).toBe(topic.items[index].answer)
      expect(angularSeparation(bearing, back)).toBe(180)
      expect(reciprocal(back)).toBe(normalize(bearing))
      const prompt = step.kind === 'choose' ? step.prompt : step.before
      expect(prompt, step.id).toContain(formatBearing(bearing, ref))
      expect(step.options.every(option => option.endsWith(`°${ref}`)), step.id).toBe(true)
    }
  })

  it('keeps both diagram tasks explicit and supplies their existing text equivalents', () => {
    for (const item of topic.items.filter(item => figureItemIds.has(item.id!))) {
      const show = steps.find(step => step.kind === 'show' && step.itemId === item.id)!
      expect(show.kind === 'show' && show.altText).toBe(item.stimulus!.alt)
      const ask = steps.find(step => step.kind === 'complete' && step.itemId === item.id)!
      expect(ask.kind === 'complete' && ask.before).toContain('from B back to A')
    }
  })

  it.each([
    ['wrap-rule', 203, 'T'],
    ['wrap-264', 264, 'M'],
    ['wrap-trace-350', 350, 'T'],
    ['return-trace-183', 183, 'G'],
  ] as const)('verifies the worked addition and wrap in %s', (id, bearing, ref) => {
    const step = steps.find(step => step.id === id)!
    const text = step.kind === 'show' ? step.body : step.kind === 'complete' ? step.before : ''
    expect(text).toContain(`${bearing}°${step.kind === 'complete' ? ref : ''} + 180°`)
    expect(text).toContain(`${bearing + 180}°`)
    const answer = formatBearing(normalize(bearing + 180), ref)
    expect(answer).toBe(formatBearing(reciprocal(bearing), ref))
    expect(step.kind === 'complete' ? step.answer : text).toContain(answer)
  })

  it('verifies the shortcut and exact north boundary examples', () => {
    const shortcut = steps.find(step => step.id === 'reverse-shortcut')!
    expect(shortcut.kind === 'show' && shortcut.body).toContain(`225° − 180° = ${formatBearing(reciprocal(225), 'M')}`)
    const dial = steps.find(step => step.id === 'reverse-dial-295')!
    expect(dial.kind === 'show' && dial.body).toContain(`295° − 180° = ${formatBearing(reciprocal(295), 'G')}`)
    expect(reciprocal(0)).toBe(180)
    expect(reciprocal(180)).toBe(0)
    const check = steps.find(step => step.id === 'return-check-rule')!
    expect(check.kind === 'show' && check.body).toContain(`${formatBearing(0, 'T')} becomes ${formatBearing(reciprocal(0), 'T')}`)
    expect(check.kind === 'show' && check.body).toContain(`${formatBearing(180, 'T')} becomes ${formatBearing(reciprocal(180), 'T')}`)
    const first = steps.find(step => step.id === 'half-turn-rule')!
    expect(first.kind === 'show' && first.body).toContain(`${formatBearing(37, 'T')} becomes ${formatBearing(reciprocal(37), 'T')}`)
  })
})
