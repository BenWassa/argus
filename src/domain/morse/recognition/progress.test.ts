import { describe, expect, it } from 'vitest'
import type { MorseLetter } from '../code'
import { newMorsePractice } from '../practice'
import {
  newMorseRecognition, parseMorseRecognition, recognitionPriority,
  recognitionStreamFor, recordRecognitionOutcome, selectRecognitionLetter, validRecognitionStream,
  type MorseRecognition,
} from './progress'

function seeded(seed: number): () => number {
  let state = seed >>> 0
  return () => { state = (1664525 * state + 1013904223) >>> 0; return state / 0x1_0000_0000 }
}

function withHistories(): MorseRecognition {
  return {
    schemaVersion: 1,
    streams: {
      'read/speed': {
        sequence: 12,
        characters: {
          E: { shown: 6, lastShownSequence: 8, lastGradedSequence: 8, outcomes: [true, true, true, true, true], recentCorrectMs: [9000, 9000, 9000] },
          Y: { shown: 4, lastShownSequence: 12, lastGradedSequence: 12, outcomes: [false, false, false, false], recentCorrectMs: [] },
          M: { shown: 2, lastShownSequence: 5, lastGradedSequence: 5, outcomes: [true, true], recentCorrectMs: [10_000, 10_000] },
        },
      },
    },
  }
}

describe('independent formative MC4 recognition history', () => {
  it('keeps Read, Listen, ordinary play, Speed and playback rates distinct', () => {
    expect(validRecognitionStream('read/speed')).toBe(true)
    expect(validRecognitionStream('listen/speed@20')).toBe(true)
    expect(validRecognitionStream('listen/practice@12')).toBe(true)
    expect(validRecognitionStream('listen/speed@0')).toBe(false)
    expect(validRecognitionStream('listen/speed@999')).toBe(false)
    expect(validRecognitionStream('__proto__')).toBe(false)
    const source = newMorseRecognition()
    const freeResponse = newMorsePractice()
    const presented = selectRecognitionLetter(source, 'read/speed', ['A', 'E', 'M', 'Y'], { rng: () => 0 })
    const graded = recordRecognitionOutcome(presented.progress, 'read/speed', presented.letter!, true,
      { independent: true, choices: 4, presentedSequence: presented.progress.streams['read/speed']!.sequence, elapsedMs: 300_000 })
    expect(graded.streams['read/speed']?.characters[presented.letter!]?.recentCorrectMs).toEqual([10_000])
    expect(graded.streams['read/practice']).toBeUndefined()
    expect(graded.streams['listen/speed@20']).toBeUndefined()
    expect(graded.streams['listen/speed@12']).toBeUndefined()
    expect(freeResponse).toEqual(newMorsePractice())
  })

  it('rejects grading an unpresented or non-four-choice item, and ignores assisted evidence', () => {
    const initial = newMorseRecognition()
    expect(recordRecognitionOutcome(initial, 'read/speed', 'E', true, { independent: true, choices: 4, presentedSequence: 1, elapsedMs: 100 })).toBe(initial)
    const selected = selectRecognitionLetter(initial, 'read/speed', ['E', 'A', 'I'], { rng: () => 0 })
    const presentedSequence = selected.progress.streams['read/speed']!.sequence
    expect(recordRecognitionOutcome(selected.progress, 'read/speed', selected.letter!, true,
      { independent: true, choices: 3, presentedSequence, elapsedMs: 100 })).toBe(selected.progress)
    expect(recordRecognitionOutcome(selected.progress, 'read/speed', selected.letter!, true,
      { choices: 4, independent: false, presentedSequence, elapsedMs: 100 })).toBe(selected.progress)
    const ordinary = recordRecognitionOutcome(selected.progress, 'read/speed', selected.letter!, false,
      { choices: 4, independent: true, presentedSequence, elapsedMs: 100 })
    expect(ordinary.streams['read/speed']?.characters[selected.letter!]?.outcomes).toEqual([false])
    expect(ordinary.streams['read/speed']?.characters[selected.letter!]?.recentCorrectMs).toEqual([])
    expect(recordRecognitionOutcome(ordinary, 'read/speed', selected.letter!, true,
      { choices: 4, independent: true, presentedSequence, elapsedMs: 1 })).toBe(ordinary)
    expect(recordRecognitionOutcome(selected.progress, 'read/speed', selected.letter!, true,
      { choices: 4, independent: true, presentedSequence: presentedSequence - 1, elapsedMs: 1 })).toBe(selected.progress)
  })

  it('ignores a late answer after a different letter becomes the current question', () => {
    const stream = 'read/speed'
    const roster: MorseLetter[] = ['E', 'A', 'I', 'M']
    const first = selectRecognitionLetter(newMorseRecognition(), stream, roster, { rng: () => 0 })
    const second = selectRecognitionLetter(first.progress, stream, roster, { rng: () => 0 })
    expect(second.letter).not.toBe(first.letter)
    const stale = recordRecognitionOutcome(second.progress, stream, first.letter!, true, {
      independent: true, choices: 4,
      presentedSequence: first.progress.streams[stream]!.sequence, elapsedMs: 10,
    })
    expect(stale).toBe(second.progress)
    expect(stale.streams[stream]!.characters[first.letter!]!.outcomes).toEqual([])
    expect(stale.streams[stream]!.characters[first.letter!]!.recentCorrectMs).toEqual([])
    const current = recordRecognitionOutcome(second.progress, stream, second.letter!, true, {
      independent: true, choices: 4,
      presentedSequence: second.progress.streams[stream]!.sequence, elapsedMs: 900,
    })
    expect(current.streams[stream]!.characters[second.letter!]!.outcomes).toEqual([true])
    expect(current.streams[stream]!.characters[second.letter!]!.recentCorrectMs).toEqual([900])
  })

  it('uses the existing accuracy scheduler with bounded secondary speed pressure', () => {
    const state = withHistories()
    const e = recognitionPriority(state, 'read/speed', 'E')
    const y = recognitionPriority(state, 'read/speed', 'Y')
    expect(e).toBeGreaterThanOrEqual(0.35)
    expect(e).toBeLessThan(0.55)
    expect(y).toBe(10)
    expect(recognitionPriority(state, 'read/speed', 'M')).toBe(0.5)
    expect(recognitionPriority(state, 'read/practice', 'Y')).toBe(1)

    const roster: MorseLetter[] = ['E', 'Y', 'M', 'K', 'A', 'S']
    let progress = state
    const answers: MorseLetter[] = []
    for (let index = 0; index < 40; index += 1) {
      const selected = selectRecognitionLetter(progress, 'read/speed', roster, { rng: seeded(index), recent: answers.slice(-2) })
      answers.push(selected.letter!)
      progress = selected.progress
    }
    expect(answers.every((glyph, index) => !index || glyph !== answers[index - 1])).toBe(true)
    expect(new Set(answers).size).toBeGreaterThanOrEqual(4)
    expect(progress.streams['read/speed']?.sequence).toBe(52)
  })

  it('strictly rejects corrupt, malicious and future records; valid states roundtrip', () => {
    const valid = withHistories()
    expect(parseMorseRecognition(JSON.parse(JSON.stringify(valid)))).toEqual({ ok: true, value: valid })
    expect(parseMorseRecognition(newMorseRecognition()).ok).toBe(true)
    expect(parseMorseRecognition({ ...valid, schemaVersion: 2 }).ok).toBe(false)
    expect(parseMorseRecognition({ ...valid, streams: { '__proto__/speed': {} } }).ok).toBe(false)
    expect(parseMorseRecognition({ ...valid, injectedTestEvidence: true }).ok).toBe(false)
    const badTrack = (item: unknown) => ({
      schemaVersion: 1, streams: { 'read/speed': { sequence: 1, characters: { E: item } } },
    })
    const base = { shown: 1, lastShownSequence: 1, lastGradedSequence: 1, outcomes: [true], recentCorrectMs: [999] }
    for (const invalid of [
      { ...base, outcomes: [true, 'yes'] },
      { ...base, recentCorrectMs: [NaN] },
      { ...base, recentCorrectMs: [10_001] },
      { ...base, recentCorrectMs: [-1] },
      { ...base, shown: -1 },
      { ...base, lastShownSequence: 4 },
      { ...base, lastGradedSequence: 2 },
      { ...base, lastGradedSequence: -1 },
      { ...base, shown: 0 },
      { ...base, recentCorrectMs: Array(9).fill(100) },
    ]) expect(parseMorseRecognition(badTrack(invalid)).ok).toBe(false)
    expect(parseMorseRecognition({
      schemaVersion: 1, streams: {
        'read/practice': { sequence: 1, characters: { E: { ...base } } },
      },
    }).ok).toBe(false)
  })
})

describe('which stream a presentation belongs to', () => {
  it('separates Read from Listen, ordinary play from Speed, and keys Listen by its playback rate', () => {
    expect(recognitionStreamFor('read', false)).toBe('read/practice')
    expect(recognitionStreamFor('read', true)).toBe('read/speed')
    expect(recognitionStreamFor('listen', false)).toBe('listen/practice@12')
    expect(recognitionStreamFor('listen', true)).toBe('listen/speed@12')
    for (const stream of [recognitionStreamFor('read', true), recognitionStreamFor('listen', true), recognitionStreamFor('listen', false)]) {
      expect(validRecognitionStream(stream)).toBe(true)
    }
  })
})
