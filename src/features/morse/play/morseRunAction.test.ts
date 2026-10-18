import { describe, expect, it } from 'vitest'
import { seedLibrary } from '../../../domain/library/catalogSeed'
import { levelsFor, modeEntry, type MorseModeEntry } from '../../../domain/morse/modes'
import { morseRunAction } from './morseRunAction'

describe('Morse run mapping', () => {
  it('maps every path action without changing formal eligibility', () => {
    expect(morseRunAction({ kind: 'start-lesson', packetIndex: 5 })).toEqual({ mode: 'learn', target: { kind: 'lesson' } })
    expect(morseRunAction({ kind: 'replay-lesson', packetIndex: 5 })).toEqual({ mode: 'learn', target: { kind: 'replay', index: 5 } })
    expect(morseRunAction({ kind: 'after-course' })).toEqual({ mode: 'learn', target: { kind: 'after-course' } })
    for (const after of [4, 7, 10, 13] as const) {
      expect(morseRunAction({ kind: 'checkpoint', checkpointId: `after-${after}` })).toEqual({ mode: 'learn', target: { kind: 'checkpoint', afterLesson: after } })
    }
    for (const early of [true, false]) expect(morseRunAction({ kind: 'test', early })).toEqual({ mode: 'test' })
  })

  it('maps all mode levels and keeps historical runner ids', () => {
    const source = seedLibrary().topics.find(topic => topic.id === 'international-morse-letters-printed')!
    const topic = { ...source, acquisitionReadyAt: '2026-01-01T00:00:00Z' }
    for (const mode of ['key', 'listen', 'read'] as const) {
      for (const level of levelsFor(mode)) {
        const entry = modeEntry(topic, mode, level.id)!
        expect(entry).toBeTruthy()
        const run = morseRunAction(entry)
        expect(morseRunAction({ kind: 'mode', entry })).toEqual(run)
        expect(run.mode).toBe('learn')
        if (level.kind === 'practice') expect(run.target).toEqual({ kind: 'letter-practice' })
        if (level.kind === 'send') expect(run.target).toEqual({ kind: 'fluency', send: level.stage })
        if (level.kind === 'copy') expect(run.target).toEqual({ kind: 'fluency', copy: level.level })
        if (level.kind === 'fluency') expect(run.target).toEqual({ kind: 'fluency', mode: level.challenge })
      }
    }
    const free: MorseModeEntry = { mode: 'free', levelId: null, kind: 'free' }
    expect(morseRunAction(free)).toEqual({ mode: 'learn', target: { kind: 'fluency', free: true } })
  })
})
