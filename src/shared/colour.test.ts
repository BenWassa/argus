import { describe, expect, it } from 'vitest'
import { contrastRatio, hueDistance, linearToSrgb, oklchToLinearSrgb, relativeLuminance, toOklch, toSrgb } from './colour'

describe('display colour measurements', () => {
  it('measures the WCAG reference endpoints and mid-grey', () => {
    expect(relativeLuminance('#ffffff')).toBe(1)
    expect(relativeLuminance('#000000')).toBe(0)
    expect(contrastRatio('#ffffff', '#000000')).toBe(21)
    expect(contrastRatio('#000000', '#ffffff')).toBe(21)
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.4781, 4)
    expect(contrastRatio('#777777', '#777777')).toBe(1)
  })

  it.each([
    // CSS Color 4 / OKLab reference coordinates for the sRGB primaries.
    { lch: [0.62795536, 0.25768331, 29.233885] as const, rgb: [1, 0, 0] },
    { lch: [0.86643961, 0.29482724, 142.495339] as const, rgb: [0, 1, 0] },
    { lch: [0.45201372, 0.31321437, 264.052021] as const, rgb: [0, 0, 1] },
    { lch: [1, 0, 0] as const, rgb: [1, 1, 1] },
    { lch: [0, 0, 0] as const, rgb: [0, 0, 0] },
  ])('converts reference $lch to sRGB', ({ lch, rgb }) => {
    toSrgb(lch).forEach((channel, index) => expect(channel).toBeCloseTo(rgb[index], 5))
  })

  it('retains linear out-of-gamut values until encoding, then clips', () => {
    expect(oklchToLinearSrgb([0.7, 0.5, 30]).some(channel => channel < 0 || channel > 1)).toBe(true)
    expect(toSrgb([0.7, 0.5, 30]).every(channel => channel >= 0 && channel <= 1)).toBe(true)
    expect(linearToSrgb(-0.1)).toBe(0)
    expect(linearToSrgb(1.1)).toBeCloseTo(1)
    expect(linearToSrgb(0.003)).toBeCloseTo(0.03876)
  })

  it('round trips existing semantic colours for hue comparison', () => {
    for (const hex of ['#92b5ae', '#d98078', '#d68d5e']) {
      toSrgb(toOklch(hex)).forEach((channel, index) => expect(channel).toBeCloseTo(toSrgb(hex)[index], 6))
    }
  })

  it('measures circular hue distance, including wrapped angles', () => {
    expect(hueDistance(350, 10)).toBe(20)
    expect(hueDistance(10, 350)).toBe(20)
    expect(hueDistance(-10, 370)).toBe(20)
    expect(hueDistance(0, 180)).toBe(180)
    expect(hueDistance(30, 390)).toBe(0)
  })
})
