import { describe, expect, it } from 'vitest'
import {
  DEFAULT_MORSE_TIMING,
  MORSE_LETTERS,
  buildMorseSchedule,
  farnsworthSpacingScale,
  morsePattern,
} from './morse'

const CANONICAL_A_TO_Z = [
  ['A', '.-'], ['B', '-...'], ['C', '-.-.'], ['D', '-..'], ['E', '.'],
  ['F', '..-.'], ['G', '--.'], ['H', '....'], ['I', '..'], ['J', '.---'],
  ['K', '-.-'], ['L', '.-..'], ['M', '--'], ['N', '-.'], ['O', '---'],
  ['P', '.--.'], ['Q', '--.-'], ['R', '.-.'], ['S', '...'], ['T', '-'],
  ['U', '..-'], ['V', '...-'], ['W', '.--'], ['X', '-..-'], ['Y', '-.--'],
  ['Z', '--..'],
] as const

describe('International Morse data', () => {
  it('matches the ITU-R M.1677-1 A–Z table character by character', () => {
    expect(Object.entries(MORSE_LETTERS)).toEqual(CANONICAL_A_TO_Z)
    for (const [letter, pattern] of CANONICAL_A_TO_Z) {
      expect(morsePattern(letter)).toBe(pattern)
      expect(morsePattern(letter.toLowerCase())).toBe(pattern)
    }
  })

  it('rejects unsupported characters instead of inventing a mapping', () => {
    expect(() => morsePattern('1')).toThrow(/Unsupported Morse letter/)
    expect(() => buildMorseSchedule('A?')).toThrow(/Unsupported Morse character/)
  })
})

describe('deterministic Morse timing', () => {
  it.each([10, 20, 25])('preserves the ITU 1:3 signal and gap ratios at %i WPM', (wpm) => {
    const ditMs = 1200 / wpm
    const a = buildMorseSchedule('A', { characterWpm: wpm, effectiveWpm: wpm })
    expect(a.events).toEqual([
      { kind: 'signal', mark: '.', units: 1, durationMs: ditMs },
      { kind: 'gap', gap: 'intra-character', units: 1, spacingScale: 1, durationMs: ditMs },
      { kind: 'signal', mark: '-', units: 3, durationMs: ditMs * 3 },
    ])

    const letters = buildMorseSchedule('EE', { characterWpm: wpm, effectiveWpm: wpm })
    expect(letters.events[1]).toEqual({
      kind: 'gap', gap: 'inter-character', units: 3, spacingScale: 1, durationMs: ditMs * 3,
    })

    const words = buildMorseSchedule('E E', { characterWpm: wpm, effectiveWpm: wpm })
    expect(words.events[1]).toEqual({
      kind: 'gap', gap: 'inter-word', units: 7, spacingScale: 1, durationMs: ditMs * 7,
    })
  })

  it('ships the programme default as 20 WPM characters with ~9 WPM effective spacing', () => {
    expect(DEFAULT_MORSE_TIMING).toEqual({ characterWpm: 20, effectiveWpm: 9 })
    const schedule = buildMorseSchedule('EE')
    expect(schedule.characterWpm).toBe(20)
    expect(schedule.effectiveWpm).toBe(9)
    expect(schedule.ditMs).toBe(60)
    expect(schedule.farnsworthScale).toBeGreaterThan(4)
  })

  it('Farnsworth changes spacing only, never the character rhythm', () => {
    const normal = buildMorseSchedule('AE E', { characterWpm: 20, effectiveWpm: 20 })
    const farnsworth = buildMorseSchedule('AE E', { characterWpm: 20, effectiveWpm: 9 })

    const normalSignals = normal.events.filter((event) => event.kind === 'signal')
    const farnsworthSignals = farnsworth.events.filter((event) => event.kind === 'signal')
    expect(farnsworthSignals).toEqual(normalSignals)

    const normalIntra = normal.events.filter((event) => event.kind === 'gap' && event.gap === 'intra-character')
    const farnsworthIntra = farnsworth.events.filter((event) => event.kind === 'gap' && event.gap === 'intra-character')
    expect(farnsworthIntra).toEqual(normalIntra)

    const normalOuter = normal.events.filter((event) => event.kind === 'gap' && event.gap !== 'intra-character')
    const farnsworthOuter = farnsworth.events.filter((event) => event.kind === 'gap' && event.gap !== 'intra-character')
    expect(farnsworthOuter.every((event, index) => event.durationMs > normalOuter[index].durationMs)).toBe(true)
  })

  it('derives Farnsworth scaling from the 31 character + 19 spacing PARIS units', () => {
    expect(farnsworthSpacingScale(20, 20)).toBe(1)
    expect(farnsworthSpacingScale(20, 10)).toBeCloseTo((100 - 31) / 19, 10)
    expect(farnsworthSpacingScale(20, 9)).toBeCloseTo((1000 / 9 - 31) / 19, 10)
  })

  it('normalizes whitespace deterministically and reports total duration from the event schedule', () => {
    const schedule = buildMorseSchedule('  s   o s  ', { characterWpm: 20, effectiveWpm: 20 })
    expect(schedule.text).toBe('S O S')
    expect(schedule.durationMs).toBe(schedule.events.reduce((sum, event) => sum + event.durationMs, 0))
  })

  it('rejects invalid speed combinations rather than silently changing character shape', () => {
    expect(() => buildMorseSchedule('A', { characterWpm: 0 })).toThrow(/characterWpm/)
    expect(() => buildMorseSchedule('A', { characterWpm: 20, effectiveWpm: 25 })).toThrow(/cannot exceed/)
  })
})
