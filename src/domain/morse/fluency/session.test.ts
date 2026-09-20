import { describe, expect, it } from 'vitest'
import { MORSE_LETTERS } from '../code'
import { allFluencyWords, fluencyWords } from './corpus'
import {
  FLUENCY_GROUP_RUN_LENGTH,
  FLUENCY_RUN_LENGTH,
  FLUENCY_WORD_RUN_LENGTH,
  answerFluency,
  currentPrompt,
  fluencyBest,
  fluencyComplete,
  fluencyOutcome,
  groupLengthForRung,
  startFluencyRun,
  wordTierForRung,
  type FluencyRun,
} from './session'
import { newFluencyProgress, recordFluencyAnswer } from './progress'
import type { FluencyRung } from './timing'

const FRESH = newFluencyProgress()

function answerAll(run: FluencyRun, correct: boolean, latencyMs: number | null = 500): FluencyRun {
  let current = run
  while (!fluencyComplete(current)) {
    const prompt = currentPrompt(current)!
    const response = correct
      ? prompt.patterns
      : prompt.patterns.map((pattern) => (pattern === '.' ? '-' : '.'))
    current = answerFluency(current, response, latencyMs, false)
  }
  return current
}

describe('fluency runs', () => {
  it('builds the documented run length for each mode', () => {
    expect(startFluencyRun('sprint', 6, FRESH, 1).prompts).toHaveLength(FLUENCY_RUN_LENGTH)
    expect(startFluencyRun('ladder', 6, FRESH, 1).prompts).toHaveLength(FLUENCY_RUN_LENGTH)
    expect(startFluencyRun('words', 6, FRESH, 1).prompts).toHaveLength(FLUENCY_WORD_RUN_LENGTH)
    expect(startFluencyRun('groups', 6, FRESH, 1).prompts).toHaveLength(FLUENCY_GROUP_RUN_LENGTH)
  })

  it('is reproducible for a seed, so a re-render cannot reshuffle a run in progress', () => {
    const a = startFluencyRun('sprint', 8, FRESH, 4242)
    const b = startFluencyRun('sprint', 8, FRESH, 4242)
    expect(a.prompts).toEqual(b.prompts)
  })

  it('varies across seeds', () => {
    const a = startFluencyRun('sprint', 8, FRESH, 1)
    const b = startFluencyRun('sprint', 8, FRESH, 999)
    expect(a.prompts).not.toEqual(b.prompts)
  })

  it('asks single characters in sprint and ladder', () => {
    for (const prompt of startFluencyRun('sprint', 6, FRESH, 7).prompts) {
      expect(prompt.text).toHaveLength(1)
      expect(prompt.patterns).toHaveLength(1)
    }
  })

  it('carries the correct pattern for every prompt character', () => {
    for (const prompt of startFluencyRun('words', 10, FRESH, 3).prompts) {
      expect(prompt.patterns).toEqual(
        Array.from(prompt.text).map((letter) => MORSE_LETTERS[letter as never]),
      )
    }
  })

  it('never repeats a word inside one run', () => {
    const words = startFluencyRun('words', 6, FRESH, 11).prompts.map((prompt) => prompt.text)
    expect(new Set(words).size).toBe(words.length)
  })

  it('draws every word from the authored corpus', () => {
    const corpus = new Set(allFluencyWords())
    for (const prompt of startFluencyRun('words', 13, FRESH, 5).prompts) {
      expect(corpus.has(prompt.text)).toBe(true)
    }
  })

  it('grows group length and word tier with the rung, not with a second control', () => {
    expect(groupLengthForRung(6)).toBe(2)
    expect(groupLengthForRung(13)).toBe(5)
    expect(wordTierForRung(6)).toBe('short')
    expect(wordTierForRung(13)).toBe('long')

    for (const rung of [6, 9, 13] as FluencyRung[]) {
      for (const prompt of startFluencyRun('groups', rung, FRESH, 2).prompts) {
        expect(prompt.text).toHaveLength(groupLengthForRung(rung))
      }
    }
  })

  it('favours the characters that need work without asking only those', () => {
    // Make E very well practised and fast, so it should rarely be chosen.
    let progress = newFluencyProgress()
    for (let at = 0; at < 20; at += 1) progress = recordFluencyAnswer(progress, 'E', true, 250)

    const chosen = Array.from({ length: 30 }, (_, seed) =>
      startFluencyRun('sprint', 6, progress, seed).prompts.map((prompt) => prompt.text),
    ).flat()

    const eShare = chosen.filter((letter) => letter === 'E').length / chosen.length
    expect(eShare).toBeLessThan(1 / 26)
    // Coverage is still broad: this is a weighted draw, not a top-N loop.
    expect(new Set(chosen).size).toBeGreaterThan(15)
  })
})

describe('answering', () => {
  it('marks a whole prompt correct only when every character matches', () => {
    const run = startFluencyRun('groups', 6, FRESH, 1)
    const prompt = currentPrompt(run)!
    const wrong = [...prompt.patterns]
    wrong[0] = wrong[0] === '.' ? '-' : '.'

    const answered = answerFluency(run, wrong, 500, false)
    const result = answered.answers[0]
    expect(result.correct).toBe(false)
    // The per-character marks are what lets a word miss show where it broke.
    expect(result.marks[0]).toBe(false)
    expect(result.marks.slice(1).every(Boolean)).toBe(true)
  })

  it('discards the latency of a replayed prompt', () => {
    const run = startFluencyRun('sprint', 6, FRESH, 1)
    const answered = answerFluency(run, currentPrompt(run)!.patterns, 500, true)
    expect(answered.answers[0].latencyMs).toBeNull()
    expect(answered.answers[0].replayed).toBe(true)
  })

  it('never re-queues a miss', () => {
    const run = startFluencyRun('sprint', 6, FRESH, 1)
    const finished = answerAll(run, false)
    expect(finished.answers).toHaveLength(FLUENCY_RUN_LENGTH)
    expect(fluencyComplete(finished)).toBe(true)
  })

  it('ignores an answer once the run is complete', () => {
    const finished = answerAll(startFluencyRun('sprint', 6, FRESH, 1), true)
    expect(answerFluency(finished, ['.'], 100, false)).toBe(finished)
  })
})

describe('outcome', () => {
  it('reports a clean run as eligible to advance', () => {
    const outcome = fluencyOutcome(answerAll(startFluencyRun('ladder', 8, FRESH, 1), true))
    expect(outcome.correct).toBe(FLUENCY_RUN_LENGTH)
    expect(outcome.cleanForAdvance).toBe(true)
    expect(outcome.longestStreak).toBe(FLUENCY_RUN_LENGTH)
  })

  it('reports a failed run as not eligible', () => {
    const outcome = fluencyOutcome(answerAll(startFluencyRun('ladder', 8, FRESH, 1), false))
    expect(outcome.correct).toBe(0)
    expect(outcome.cleanForAdvance).toBe(false)
    expect(outcome.longestStreak).toBe(0)
  })

  it('takes the median of usable latencies only', () => {
    let run = startFluencyRun('sprint', 6, FRESH, 1)
    run = answerFluency(run, currentPrompt(run)!.patterns, 400, false)
    run = answerFluency(run, currentPrompt(run)!.patterns, 600, false)
    // Replayed: excluded from the median entirely.
    run = answerFluency(run, currentPrompt(run)!.patterns, 50, true)
    expect(fluencyOutcome(run).medianLatencyMs).toBe(500)
  })

  it('counts the longest streak rather than the total', () => {
    let run = startFluencyRun('sprint', 6, FRESH, 1)
    const pattern = () => currentPrompt(run)!.patterns
    run = answerFluency(run, pattern(), 400, false)
    run = answerFluency(run, ['@'], 400, false)
    run = answerFluency(run, pattern(), 400, false)
    run = answerFluency(run, pattern(), 400, false)
    expect(fluencyOutcome(run).longestStreak).toBe(2)
  })
})

describe('personal bests', () => {
  it('measures sprint in characters a minute', () => {
    const run = answerAll(startFluencyRun('sprint', 6, FRESH, 1), true, 1000)
    expect(fluencyBest(run, fluencyOutcome(run))).toBe(60)
  })

  it('measures ladder as the rung, and only when it was cleared', () => {
    const clean = answerAll(startFluencyRun('ladder', 11, FRESH, 1), true)
    expect(fluencyBest(clean, fluencyOutcome(clean))).toBe(11)

    const failed = answerAll(startFluencyRun('ladder', 11, FRESH, 1), false)
    expect(fluencyBest(failed, fluencyOutcome(failed))).toBeNull()
  })

  it('measures words and groups as the longest unbroken run', () => {
    const run = answerAll(startFluencyRun('words', 6, FRESH, 1), true)
    expect(fluencyBest(run, fluencyOutcome(run))).toBe(FLUENCY_WORD_RUN_LENGTH)
  })

  it('records nothing for a run that produced nothing usable', () => {
    const empty = startFluencyRun('sprint', 6, FRESH, 1)
    expect(fluencyBest(empty, fluencyOutcome(empty))).toBeNull()

    const noLatency = answerAll(startFluencyRun('sprint', 6, FRESH, 1), true, null)
    expect(fluencyBest(noLatency, fluencyOutcome(noLatency))).toBeNull()
  })
})

describe('corpus', () => {
  it('contains only A-Z in every tier', () => {
    for (const word of allFluencyWords()) {
      expect(word).toMatch(/^[A-Z]+$/)
      for (const letter of word) expect(letter in MORSE_LETTERS).toBe(true)
    }
  })

  it('holds no duplicates', () => {
    const words = allFluencyWords()
    expect(new Set(words).size).toBe(words.length)
  })

  it('keeps each tier big enough to fill a run without repeating', () => {
    for (const tier of ['short', 'medium', 'long'] as const) {
      expect(fluencyWords(tier).length).toBeGreaterThan(FLUENCY_WORD_RUN_LENGTH * 4)
    }
  })
})
