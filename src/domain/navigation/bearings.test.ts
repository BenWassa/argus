import { describe, expect, it } from 'vitest'
import {
  angularSeparation,
  convert,
  formatBearing,
  formatOffset,
  gridDeclination,
  normalize,
  reciprocal,
} from './bearings'

describe('normalize', () => {
  it('maps every whole degree into 000–359', () => {
    expect(normalize(0)).toBe(0)
    expect(normalize(360)).toBe(0)
    expect(normalize(-1)).toBe(359)
    expect(normalize(-360)).toBe(0)
    expect(normalize(725)).toBe(5)
    for (let d = -720; d <= 720; d += 1) {
      const n = normalize(d)
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(360)
      expect(Math.abs((n - d) % 360)).toBe(0)
    }
  })
})

describe('reciprocal (research note §4.2, independently recomputed)', () => {
  it.each([
    [37, 217],
    [225, 45],
    [350, 170],
    [0, 180],
    [180, 0],
  ])('reciprocal(%i) = %i', (forward, back) => {
    expect(reciprocal(forward)).toBe(back)
  })

  it('agrees with the add-below/subtract-above shortcut, and is an involution', () => {
    for (let b = 0; b < 360; b += 1) {
      expect(reciprocal(b)).toBe(b < 180 ? b + 180 : b - 180)
      expect(reciprocal(reciprocal(b))).toBe(b)
      expect(angularSeparation(b, reciprocal(b))).toBe(180)
    }
  })
})

describe('convert (research note §4.4 examples)', () => {
  it.each([
    ['T', 'M', 90, 10, 0, 80],
    ['M', 'T', 80, 10, 0, 90],
    ['T', 'M', 70, -12, 0, 82],
    ['M', 'T', 82, -12, 0, 70],
    ['G', 'M', 100, 10, 2, 92],
    ['M', 'G', 92, 10, 2, 100],
  ] as const)('%s → %s of %i° with D=%i, C=%i is %i°', (from, to, bearing, D, C, expected) => {
    expect(convert(bearing, from, to, { D, C })).toBe(expected)
  })

  it('matches the six named formulas for every bearing', () => {
    const offsets = { D: -13, C: 4 }
    for (let b = 0; b < 360; b += 1) {
      expect(convert(b, 'T', 'M', offsets)).toBe(normalize(b - offsets.D))
      expect(convert(b, 'M', 'T', offsets)).toBe(normalize(b + offsets.D))
      expect(convert(b, 'T', 'G', offsets)).toBe(normalize(b - offsets.C))
      expect(convert(b, 'G', 'T', offsets)).toBe(normalize(b + offsets.C))
      expect(convert(b, 'G', 'M', offsets)).toBe(normalize(b + offsets.C - offsets.D))
      expect(convert(b, 'M', 'G', offsets)).toBe(normalize(b + offsets.D - offsets.C))
    }
  })

  it('round-trips through any reference and is the identity on the same reference', () => {
    const offsets = { D: 17, C: -3 }
    for (let b = 0; b < 360; b += 7) {
      for (const from of ['T', 'M', 'G'] as const) {
        expect(convert(b, from, from, offsets)).toBe(b)
        for (const to of ['T', 'M', 'G'] as const) {
          expect(convert(convert(b, from, to, offsets), to, from, offsets)).toBe(b)
        }
      }
    }
  })

  it('commutes with taking the reciprocal, which is why it is a valid consistency check', () => {
    const offsets = { D: 9, C: -2 }
    for (let b = 0; b < 360; b += 11) {
      expect(reciprocal(convert(b, 'G', 'M', offsets))).toBe(convert(reciprocal(b), 'G', 'M', offsets))
    }
  })

  it('crosses 000 cleanly in both directions', () => {
    expect(convert(5, 'T', 'M', { D: 10, C: 0 })).toBe(355)
    expect(convert(355, 'T', 'M', { D: -10, C: 0 })).toBe(5)
    expect(convert(358, 'M', 'T', { D: 7, C: 0 })).toBe(5)
    expect(convert(3, 'M', 'T', { D: -8, C: 0 })).toBe(355)
  })
})

describe('grid declination', () => {
  it('is D − C, and equals D only when convergence is zero', () => {
    expect(gridDeclination({ D: 10, C: 2 })).toBe(8)
    expect(gridDeclination({ D: 10, C: 0 })).toBe(10)
    // Grid → magnetic is a subtraction of the grid declination.
    for (let g = 0; g < 360; g += 13) {
      expect(convert(g, 'G', 'M', { D: -9, C: 4 })).toBe(normalize(g - gridDeclination({ D: -9, C: 4 })))
    }
  })
})

describe('formatting', () => {
  it('prints three digits, the degree sign and the reference', () => {
    expect(formatBearing(5, 'T')).toBe('005°T')
    expect(formatBearing(360, 'M')).toBe('000°M')
    expect(formatBearing(-10, 'G')).toBe('350°G')
  })

  it('names the side of a signed offset', () => {
    expect(formatOffset(10)).toBe('10° E (+10°)')
    expect(formatOffset(-12)).toBe('12° W (−12°)')
    expect(formatOffset(0)).toBe('0°')
  })

  it('measures the smaller angle between bearings across north', () => {
    expect(angularSeparation(355, 5)).toBe(10)
    expect(angularSeparation(90, 270)).toBe(180)
    expect(angularSeparation(10, 10)).toBe(0)
  })
})
