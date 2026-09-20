import { describe, expect, it } from 'vitest'
import { buildMorseSchedule } from '../code'
import {
  FLUENCY_CHARACTER_WPM,
  FLUENCY_RUNGS,
  fluencyTiming,
  isFluencyRung,
  nearestRung,
  nextRung,
  previousRung,
  rungDescription,
} from './timing'

describe('fluency timing', () => {
  /**
   * The load-bearing invariant of the whole workstream. If a future edit makes
   * the early rungs "easier" by slowing the character down, it reintroduces
   * counting — the exact habit the surface exists to remove — and this fails.
   */
  it('pins character speed on every rung', () => {
    for (const rung of FLUENCY_RUNGS) {
      expect(fluencyTiming(rung).characterWpm).toBe(FLUENCY_CHARACTER_WPM)
    }
  })

  it('is fast enough that elements cannot comfortably be counted', () => {
    // A dit at 20 WPM is 60ms. Anything at or above ~15 WPM clears the
    // commonly cited counting threshold; the acquisition rate (12) does not.
    expect(FLUENCY_CHARACTER_WPM).toBeGreaterThanOrEqual(15)
    expect(1200 / FLUENCY_CHARACTER_WPM).toBeLessThanOrEqual(80)
  })

  it('varies only the spacing, and the spacing always shrinks as the rung rises', () => {
    const scales = FLUENCY_RUNGS.map(
      (rung) => buildMorseSchedule('AB', fluencyTiming(rung)).farnsworthScale,
    )
    for (let at = 1; at < scales.length; at += 1) {
      expect(scales[at]).toBeLessThan(scales[at - 1])
    }
  })

  it('never changes how long a character itself sounds', () => {
    const signals = (rung: (typeof FLUENCY_RUNGS)[number]) =>
      buildMorseSchedule('Q', fluencyTiming(rung))
        .events.filter((event) => event.kind === 'signal')
        .map((event) => event.durationMs)

    expect(signals(6)).toEqual(signals(13))
  })

  it('walks the ladder and clamps at both ends', () => {
    expect(nextRung(6)).toBe(7)
    expect(previousRung(7)).toBe(6)
    expect(previousRung(6)).toBe(6)
    expect(nextRung(13)).toBe(13)
  })

  it('snaps stored or supplied values onto a legal rung', () => {
    expect(nearestRung(8.4)).toBe(8)
    expect(nearestRung(-5)).toBe(6)
    expect(nearestRung(99)).toBe(13)
    expect(nearestRung(Number.NaN)).toBe(6)
  })

  it('recognises only defined rungs', () => {
    expect(isFluencyRung(6)).toBe(true)
    expect(isFluencyRung(5)).toBe(false)
    expect(isFluencyRung('8')).toBe(false)
  })

  it('describes every rung in words rather than leaving a bare number', () => {
    for (const rung of FLUENCY_RUNGS) {
      expect(rungDescription(rung).length).toBeGreaterThan(0)
    }
  })
})
