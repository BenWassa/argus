import { describe, expect, it } from 'vitest'
import { isChoiceItem, isCorrectChoice, shuffledOptions } from './choice'
import type { Item } from '../library/topic'

const item: Item = {
  id: 'i',
  kind: 'forward',
  prompt: 'Reciprocal of 045°?',
  answer: '225°',
  choice: { options: ['045°', '135°', '225°', '315°'] },
}

describe('choice grading', () => {
  it('grades by exact match with the answer key', () => {
    expect(isCorrectChoice(item, '225°')).toBe(true)
    expect(isCorrectChoice(item, '135°')).toBe(false)
    expect(isCorrectChoice(item, '225')).toBe(false)
  })

  it('recognises only items that carry a choice', () => {
    expect(isChoiceItem(item)).toBe(true)
    expect(isChoiceItem({ prompt: 'p', answer: 'a' })).toBe(false)
  })

  it('shuffles display order without touching the options or the key', () => {
    for (const seed of [0, 0.3, 0.6, 0.99]) {
      const shuffled = shuffledOptions(item, () => seed)
      expect([...shuffled].sort()).toEqual([...item.choice!.options].sort())
      expect(shuffled.filter((option) => isCorrectChoice(item, option))).toEqual(['225°'])
    }
    expect(item.choice!.options).toEqual(['045°', '135°', '225°', '315°'])
  })

  it('actually reorders, and is deterministic for a given random source', () => {
    const orders = new Set(
      [0, 0.25, 0.5, 0.75, 0.99].map((seed) => shuffledOptions(item, () => seed).join('|')),
    )
    expect(orders.size).toBeGreaterThan(1)
    expect(shuffledOptions(item, () => 0.4)).toEqual(shuffledOptions(item, () => 0.4))
  })
})
