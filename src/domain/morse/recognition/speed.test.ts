import { describe, expect, it } from 'vitest'
import {
  RECOGNITION_SPEED, RESPONSE_BANDS, IDLE_RECOGNITION_CLOCK,
  armRecognitionClock, cappedLatencyMs, invalidateRecognitionClock,
  recognitionUtility, responseBand, stopRecognitionClock,
  summarizeRecognitionRound,
} from './speed'

describe('bounded recognition response time', () => {
  it('uses seven exhaustive half-open bins, including exact boundaries', () => {
    expect(RESPONSE_BANDS).toHaveLength(7)
    expect(RESPONSE_BANDS[0].minMs).toBe(0)
    for (let i = 1; i < RESPONSE_BANDS.length; i += 1) {
      expect(RESPONSE_BANDS[i - 1].maxMs).toBe(RESPONSE_BANDS[i].minMs)
    }
    for (const [ms, label] of [
      [0, 'under 1s'], [999, 'under 1s'], [1000, '1–<2s'],
      [1999, '1–<2s'], [2000, '2–<3s'], [3000, '3–<5s'],
      [5000, '5–<7s'], [7000, '7–<10s'], [9999, '7–<10s'],
      [10_000, '10s+'], [30_000, '10s+'], [300_000, '10s+'],
    ] as const) expect(responseBand(ms)).toBe(label)
  })

  it('saturates all visible durations of ten seconds or more without timing out', () => {
    expect(RECOGNITION_SPEED.capMs).toBe(10_000)
    for (const ms of [10_000, 30_000, 300_000]) {
      expect(cappedLatencyMs(ms)).toBe(10_000)
      expect(recognitionUtility(ms)).toBe(recognitionUtility(10_000))
    }
    for (const value of [-1, NaN, Infinity, -Infinity, null]) {
      expect(cappedLatencyMs(value)).toBeNull()
      expect(responseBand(value)).toBeNull()
    }
  })

  it('arms only after usable Read tiles or completed Listen audio, and uses monotonic deltas', () => {
    const read = { direction: 'read' as const, choices: 4, tilesReady: true, visible: true }
    const listen = { ...read, direction: 'listen' as const }
    expect(armRecognitionClock(1000, { ...read, tilesReady: false })).toEqual(IDLE_RECOGNITION_CLOCK)
    expect(armRecognitionClock(1000, { ...read, choices: 3 })).toEqual(IDLE_RECOGNITION_CLOCK)
    expect(armRecognitionClock(1000, { ...read, visible: false })).toEqual(IDLE_RECOGNITION_CLOCK)
    expect(armRecognitionClock(1000, listen)).toEqual(IDLE_RECOGNITION_CLOCK)
    const running = armRecognitionClock(1000, { ...listen, playbackFinished: true })
    expect(stopRecognitionClock(running, 1800, { visible: true, independent: true }).elapsedMs).toBe(800)
    expect(stopRecognitionClock(running, 31_000, { visible: true, independent: true }).elapsedMs).toBe(10_000)
    expect(stopRecognitionClock(running, 999, { visible: true, independent: true }).elapsedMs).toBeNull()
    expect(stopRecognitionClock(running, 1800, { visible: true, independent: false }).elapsedMs).toBeNull()
    expect(stopRecognitionClock(running, 1800, { visible: false, independent: true }).elapsedMs).toBeNull()
    expect(stopRecognitionClock(running, 1800, { visible: true, independent: true, interrupted: true }).elapsedMs).toBeNull()
    const stopped = stopRecognitionClock(running, 1800, { visible: true, independent: true })
    expect(stopRecognitionClock(stopped.clock, 1900, { visible: true, independent: true }).elapsedMs).toBeNull()
    expect(stopRecognitionClock(invalidateRecognitionClock(running), 1800, { visible: true, independent: true }).elapsedMs).toBeNull()
  })

  it('counts mistakes for accuracy, never as speed successes, and excludes invalid timing', () => {
    const attempts = [
      { correct: true, independent: true, choices: 4, elapsedMs: 1000 },
      { correct: false, independent: true, choices: 4, elapsedMs: 100 },
      { correct: true, independent: true, choices: 4, elapsedMs: 30_000 },
      { correct: true, independent: false, choices: 4, elapsedMs: 100 },
      { correct: false, independent: true, choices: 4, elapsedMs: null },
      { correct: true, independent: true, choices: 3, elapsedMs: 100 },
      { correct: true, independent: true, choices: 4, elapsedMs: 100, interrupted: true },
    ]
    const result = summarizeRecognitionRound(attempts)
    expect(result.graded).toBe(6)
    expect(result.correct).toBe(4)
    expect(result.validSpeedSamples).toBe(3)
    expect(result.typicalCorrectMs).toBe(5_500)
    expect(result.roundScore).toBe(Math.round(100 * (recognitionUtility(1000)! + recognitionUtility(10_000)!) / 3))
    expect(summarizeRecognitionRound([{ correct: true, independent: false, choices: 4, elapsedMs: null }]).roundScore).toBeNull()
    expect(summarizeRecognitionRound([]).roundScore).toBeNull()
  })
})
