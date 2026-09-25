import { describe, expect, it } from 'vitest'
import { buildMorseSchedule, isMorseCharacter } from '../code'
import {
  COPY_LEVELS,
  COPY_LEVEL_INFO,
  copyBestKey,
  copyLevelCleared,
  copyPrompts,
  copyRunScore,
  judgeCopy,
  nextCopyLevel,
  normalizeCopy,
} from './copy'
import { newFluencyProgress, recordFluencyBest } from './progress'

describe('copy material', () => {
  it.each(COPY_LEVELS)('builds a full, playable %s run across many seeds', (level) => {
    for (let seed = 1; seed <= 200; seed += 1) {
      const prompts = copyPrompts(level, newFluencyProgress(), seed)
      expect(prompts).toHaveLength(COPY_LEVEL_INFO[level].length)
      for (const prompt of prompts) {
        expect(prompt).toBe(prompt.trim())
        expect(prompt).not.toMatch(/ {2}/)
        for (const character of prompt) {
          if (character !== ' ') expect(isMorseCharacter(character)).toBe(true)
        }
        expect(() => buildMorseSchedule(prompt)).not.toThrow()
      }
    }
  })

  it('never asks the same prompt twice in one run of generated material', () => {
    for (const level of ['phrases', 'sentences', 'mixed', 'common', 'words'] as const) {
      for (let seed = 1; seed <= 100; seed += 1) {
        const prompts = copyPrompts(level, newFluencyProgress(), seed)
        expect(new Set(prompts).size).toBe(prompts.length)
      }
    }
  })

  it('is reproducible from its seed and varies between seeds', () => {
    const a = copyPrompts('sentences', newFluencyProgress(), 42)
    expect(copyPrompts('sentences', newFluencyProgress(), 42)).toEqual(a)
    expect(copyPrompts('sentences', newFluencyProgress(), 43)).not.toEqual(a)
  })

  it('keeps sentences sentence-length and generated lists free of repeats', () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      for (const sentence of copyPrompts('sentences', newFluencyProgress(), seed)) {
        const words = sentence.split(' ').length
        expect(words).toBeGreaterThanOrEqual(3)
        expect(words).toBeLessThanOrEqual(10)
        expect(sentence).not.toMatch(/THE (\w+) IS IN THE \1$/)
      }
      for (const mixed of copyPrompts('mixed', newFluencyProgress(), seed)) {
        const listed = mixed.match(/^BRING THE (\w+), THE (\w+) AND THE (\w+)\.$/)
        if (listed) expect(new Set(listed.slice(1)).size).toBe(3)
        expect(mixed).not.toMatch(/LEAVES AT (\d+), NOT \1\./)
      }
    }
  })

  it('introduces figures at the numbers level and punctuation at the last one', () => {
    const numbers = Array.from({ length: 30 }, (_, seed) => copyPrompts('numbers', newFluencyProgress(), seed + 1)).flat()
    expect(numbers.some((prompt) => /\d/.test(prompt))).toBe(true)
    expect(numbers.every((prompt) => !/[.,?/]/.test(prompt))).toBe(true)

    const mixed = Array.from({ length: 30 }, (_, seed) => copyPrompts('mixed', newFluencyProgress(), seed + 1)).flat()
    for (const mark of ['.', ',', '?', '/']) {
      expect(mixed.some((prompt) => prompt.includes(mark))).toBe(true)
    }

    for (const level of ['letters', 'common', 'words', 'phrases', 'sentences'] as const) {
      const prompts = Array.from({ length: 30 }, (_, seed) => copyPrompts(level, newFluencyProgress(), seed + 1)).flat()
      expect(prompts.every((prompt) => /^[A-Z ]+$/.test(prompt))).toBe(true)
    }
  })
})

describe('judging a copy', () => {
  it('ignores case, spacing and space around punctuation', () => {
    expect(normalizeCopy('  is it   5 ? ')).toBe('IS IT 5?')
    expect(normalizeCopy('bring the map,the key and the lamp .')).toBe('BRING THE MAP, THE KEY AND THE LAMP.')
    expect(normalizeCopy('wind 270 / 7.')).toBe('WIND 270/7.')
    expect(judgeCopy('IS IT 5?', 'is it 5 ?').correct).toBe(true)
  })

  it('scores by character, so one wrong letter costs one character', () => {
    const judgement = judgeCopy('MEET ME AT THE BRIDGE', 'MEET ME AT THE BRIDCE')
    expect(judgement.correct).toBe(false)
    expect(judgement.accuracy).toBeCloseTo(1 - 1 / 21)
    expect(judgement.words.map((word) => word.ok)).toEqual([true, true, true, true, false])
  })

  it('marks only the dropped word when a word goes missing', () => {
    const judgement = judgeCopy('THE WIND IS STRONG TODAY', 'THE WIND STRONG TODAY')
    expect(judgement.words).toEqual([
      { text: 'THE', ok: true },
      { text: 'WIND', ok: true },
      { text: 'IS', ok: false },
      { text: 'STRONG', ok: true },
      { text: 'TODAY', ok: true },
    ])
  })

  it('gives nothing for an empty answer and never goes below zero', () => {
    expect(judgeCopy('HELLO', '').accuracy).toBe(0)
    expect(judgeCopy('HI', 'SOMETHING ELSE ENTIRELY').accuracy).toBe(0)
    expect(judgeCopy('HELLO', '').words.every((word) => !word.ok)).toBe(true)
  })

  it('weights a run by length, so a missed sentence outweighs a missed letter', () => {
    const run = [judgeCopy('A', 'B'), judgeCopy('THE SEA IS CALM TODAY', 'THE SEA IS CALM TODAY')]
    expect(copyRunScore(run)).toBe(Math.round((21 / 22) * 100))
  })
})

describe('the level ladder', () => {
  it('suggests the first level not yet cleared at 90%', () => {
    let progress = newFluencyProgress()
    expect(nextCopyLevel(progress)).toBe('letters')

    progress = recordFluencyBest(progress, copyBestKey('letters'), 89).progress
    expect(copyLevelCleared(progress, 'letters')).toBe(false)
    expect(nextCopyLevel(progress)).toBe('letters')

    progress = recordFluencyBest(progress, copyBestKey('letters'), 90).progress
    expect(nextCopyLevel(progress)).toBe('common')

    for (const level of COPY_LEVELS) progress = recordFluencyBest(progress, copyBestKey(level), 100).progress
    expect(nextCopyLevel(progress)).toBeNull()
  })

  it('stores bests under keys that cannot collide with the speed modes', () => {
    for (const level of COPY_LEVELS) {
      expect(copyBestKey(level)).toMatch(/^copy:/)
    }
  })
})
