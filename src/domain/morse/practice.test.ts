import { describe, expect, it } from 'vitest'
import { MORSE_LETTERS, type MorseLetter } from './code'
import {
  newMorsePractice,
  parseMorsePractice,
  practiceWeight,
  recordPracticeOutcome,
  sanitizeMorsePractice,
  selectPracticeLetter,
  schedulePracticeLetters,
} from './practice'

function repeated(value: number): () => number {
  return () => value
}

function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (1664525 * state + 1013904223) >>> 0
    return state / 0x1_0000_0000
  }
}

describe('Morse adaptive letter practice', () => {
  it('clamps repeated success and miss histories to the specified extremes', () => {
    let progress = newMorsePractice()
    for (let i = 0; i < 5; i += 1) progress = recordPracticeOutcome(progress, 'key', 'E', true)
    for (let i = 0; i < 4; i += 1) progress = recordPracticeOutcome(progress, 'key', 'Y', false)
    expect(practiceWeight(progress, 'key', 'E')).toBe(0.35)
    expect(practiceWeight(progress, 'key', 'Y')).toBe(10)
    expect(practiceWeight(progress, 'read', 'Y')).toBe(1)
    const weak = practiceWeight(progress, 'key', 'Y')
    for (let i = 0; i < 3; i += 1) progress = recordPracticeOutcome(progress, 'key', 'Y', true)
    const recovered = practiceWeight(progress, 'key', 'Y')
    expect(recovered).toBeLessThan(weak)
    expect(practiceWeight(recordPracticeOutcome(progress, 'key', 'Y', false), 'key', 'Y')).toBeGreaterThan(recovered)
  })

  it('does not turn assisted attempts into evidence or streaks', () => {
    const initial = newMorsePractice()
    expect(recordPracticeOutcome(initial, 'listen', 'Q', true, false)).toBe(initial)
    expect(practiceWeight(initial, 'listen', 'Q')).toBe(1)
  })

  it('sanitizes unknown, malformed, oversized and legacy state safely', () => {
    const parsed = sanitizeMorsePractice({
      schemaVersion: 1,
      sequence: { key: 1.9e20, listen: -4, extra: 99 },
      characters: {
        key: {
          A: { outcomes: [true, 'x', false, true, false, true, false, true, false, true], shown: 9.8, lastShownSequence: 3 },
          AA: { outcomes: [false], shown: 1, lastShownSequence: 1 },
          B: { outcomes: ['bad'], shown: Infinity, lastShownSequence: -1 },
        },
        surprise: { C: { outcomes: [false], shown: 1, lastShownSequence: 1 } },
      },
    })
    expect(parsed.sequence).toEqual({ key: 1_000_000_000, read: 0, listen: 0 })
    expect(parsed.characters.key.A).toEqual({
      outcomes: [false, true, false, true, false, true, false, true], shown: 9, lastShownSequence: 3,
    })
    expect(parsed.characters.key.B).toBeUndefined()
    expect(parsed.characters.listen).toEqual({})
    expect(sanitizeMorsePractice({ schemaVersion: 99 })).toEqual(newMorsePractice())
    expect(sanitizeMorsePractice(null)).toEqual(newMorsePractice())
  })

  it('rejects unknown schemas and corrupted persistent records without erasing them', () => {
    const valid = newMorsePractice()
    expect(parseMorsePractice(valid)).toEqual({ ok: true, value: valid })
    expect(parseMorsePractice({ ...valid, schemaVersion: 2 }).ok).toBe(false)
    for (const [shown, lastShownSequence] of [[0, 1], [1, 0]]) {
      expect(parseMorsePractice({ ...valid, sequence: { ...valid.sequence, key: 1 }, characters: { ...valid.characters, key: { E: { outcomes: [], shown, lastShownSequence } } } }).ok).toBe(false)
    }
    expect(parseMorsePractice({ ...valid, characters: { ...valid.characters, key: { AA: { outcomes: [], shown: 0, lastShownSequence: 0 } } } }).ok).toBe(false)
  })

  it('uses the injected RNG reproducibly and never selects outside the roster', () => {
    const roster = ['E', 'Y', 'Q', 'A'] as MorseLetter[]
    const first = schedulePracticeLetters(newMorsePractice(), 'read', roster, { count: 24, rng: seeded(17) })
    const second = schedulePracticeLetters(newMorsePractice(), 'read', roster, { count: 24, rng: seeded(17) })
    expect(first.letters).toEqual(second.letters)
    expect(first.letters.every((glyph) => roster.includes(glyph))).toBe(true)
    expect(first.letters.every((glyph, index) => index === 0 || glyph !== first.letters[index - 1])).toBe(true)
  })

  it('weights repeated misses above successes while keeping every eligible letter reachable', () => {
    let progress = newMorsePractice()
    for (let i = 0; i < 5; i += 1) progress = recordPracticeOutcome(progress, 'key', 'E', true)
    for (let i = 0; i < 4; i += 1) progress = recordPracticeOutcome(progress, 'key', 'Y', false)
    const roster = Object.keys(MORSE_LETTERS) as MorseLetter[]
    let y = 0
    let e = 0
    for (let run = 1; run <= 100; run += 1) {
      const result = schedulePracticeLetters(progress, 'key', roster, { count: 10, rng: seeded(run) })
      y += result.letters.filter((glyph) => glyph === 'Y').length
      e += result.letters.filter((glyph) => glyph === 'E').length
    }
    expect(y).toBeGreaterThan(e * 3)
    expect(e).toBeGreaterThan(0)
  })

  it('keeps letter history separate by direction and applies the preferred two-letter gap', () => {
    let progress = newMorsePractice()
    for (let i = 0; i < 4; i += 1) progress = recordPracticeOutcome(progress, 'listen', 'Y', false)
    expect(practiceWeight(progress, 'listen', 'Y')).toBe(10)
    expect(practiceWeight(progress, 'key', 'Y')).toBe(1)
    const queue = schedulePracticeLetters(progress, 'listen', ['Y', 'E', 'Q', 'A'], {
      count: 20,
      rng: seeded(42),
    }).letters
    for (let i = 0; i < queue.length; i += 1) {
      const previous = queue.slice(0, i).lastIndexOf(queue[i])
      if (previous >= 0) expect(i - previous).toBeGreaterThan(2)
    }
  })

  it('repeats only when the eligible roster has one letter', () => {
    const queue = schedulePracticeLetters(newMorsePractice(), 'key', ['E'], { count: 4, rng: repeated(0) }).letters
    expect(queue).toEqual(['E', 'E', 'E', 'E'])
  })

  it('avoids immediate repeats for rosters of two to four and uses a two-letter gap when possible', () => {
    for (const roster of [['E'], ['E', 'Y'], ['E', 'Y', 'Q'], ['E', 'Y', 'Q', 'A']] as MorseLetter[][]) {
      let progress = newMorsePractice()
      const queue: MorseLetter[] = []
      for (let i = 0; i < 40; i += 1) {
        const selected = selectPracticeLetter(progress, 'key', roster, { rng: seeded(i + 1) })
        expect(selected.letter).not.toBeNull()
        queue.push(selected.letter!)
        progress = selected.progress
      }
      if (roster.length > 1) {
        expect(queue.every((glyph, index) => index === 0 || glyph !== queue[index - 1])).toBe(true)
      }
      if (roster.length >= 3) {
        for (let i = 0; i < queue.length; i += 1) {
          const previous = queue.slice(0, i).lastIndexOf(queue[i])
          if (previous >= 0) expect(i - previous).toBeGreaterThan(2)
        }
      }
    }
  })

  it('renormalizes a capped event sequence without freezing later presentations', () => {
    const progress = {
      ...newMorsePractice(),
      sequence: { key: 1_000_000_000, read: 0, listen: 0 },
      characters: {
        ...newMorsePractice().characters,
        key: {
          A: { outcomes: [], shown: 50, lastShownSequence: 999_999_999 },
          B: { outcomes: [], shown: 30, lastShownSequence: 1_000_000_000 },
        },
      },
    }
    const selected = selectPracticeLetter(progress, 'key', ['A', 'B', 'C'], { rng: seeded(5) })
    expect(selected.progress.sequence.key).toBeLessThan(1_000_000_000)
    expect(selected.progress.sequence.key).toBeGreaterThan(2)
    expect(Object.values(selected.progress.characters.key).some((item) => item?.lastShownSequence === selected.progress.sequence.key)).toBe(true)
  })
})
