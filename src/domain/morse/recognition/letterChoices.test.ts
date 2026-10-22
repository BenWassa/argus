import { describe, expect, it } from 'vitest'
import { letterChoices } from './letterChoices'
import type { MorseLetter } from '../code'

function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => { state = (1664525 * state + 1013904223) >>> 0; return state / 0x1_0000_0000 }
}

describe('taught-only letter choices', () => {
  const taught: MorseLetter[] = ['E', 'T', 'I', 'A', 'M', 'N', 'S', 'O', 'Y']

  it('always has the correct letter exactly once, with unique taught alternatives', () => {
    for (let seed = 0; seed < 100; seed += 1) {
      const result = letterChoices('Y', [...taught, 'A', 'Y'], seeded(seed))!
      expect(result.choices).toHaveLength(4)
      expect(new Set(result.choices).size).toBe(4)
      expect(result.choices[result.answerIndex]).toBe('Y')
      expect(result.choices.every((letter) => taught.includes(letter))).toBe(true)
      expect(result.speedEligible).toBe(true)
    }
  })

  it('excludes unlearned letters; small pools never produce misleading speed evidence', () => {
    expect(letterChoices('Y', ['E', 'I'])).toBeNull()
    expect(letterChoices('E', ['E'])).toMatchObject({ choices: ['E'], speedEligible: false, teachingOnly: true })
    expect(letterChoices('E', ['E', 'I', 'A'])).toMatchObject({ speedEligible: false, teachingOnly: false })
    expect(letterChoices('E', ['E', 'I', 'A', 'M'])).toMatchObject({ speedEligible: true })
    expect(letterChoices('E', ['E', 'I', 'X' as MorseLetter, 'A'] )?.choices).toHaveLength(4)
    expect(letterChoices('E', ['E', '???' as MorseLetter])?.choices).toEqual(['E'])
  })

  it('is deterministic with a supplied random seed and distributes the correct position fairly', () => {
    expect(letterChoices('A', taught, seeded(19))).toEqual(letterChoices('A', taught, seeded(19)))
    const counts = [0, 0, 0, 0]
    for (let seed = 0; seed < 400; seed += 1) counts[letterChoices('A', taught, seeded(seed))!.answerIndex] += 1
    expect(counts.every((count) => count > 55 && count < 145)).toBe(true)
  })

  it('prefers confusable Morse patterns over distant letters', () => {
    const result = letterChoices('E', ['E', 'I', 'S', 'H', 'T', 'M', 'O'], () => 0)!
    expect(result.choices).toContain('I')
    expect(result.choices.some((glyph) => glyph === 'S' || glyph === 'M')).toBe(true)
    expect(result.choices).toContain('T')
    expect(result.choices).not.toContain('O')
  })
})
