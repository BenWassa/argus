import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contrastRatio, hueDistance, linearToSrgb, oklchToLinearSrgb, relativeLuminance, toOklch, toSrgb } from './colour'
import { candidateIds, contrastReport, palettes, pairReport, roleIds, screenRoles, surfaces } from './palettes'

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

describe('the declared palette report', () => {
  it('uses the exact production chassis and control colours', () => {
    const tokens = readFileSync(new URL('../../styles/tokens.css', import.meta.url), 'utf8')
    for (const [surface, hex] of Object.entries(surfaces)) expect(tokens).toContain(`--${surface}: ${hex};`)
    expect(tokens).toContain(`--accent: ${palettes.current.action};`)
    expect(tokens).toContain(`--accent-ink: ${palettes.current.actionInk};`)
  })

  it.each(candidateIds)('%s measures every declared role/surface and passes the required base contrasts', candidate => {
    const palette = palettes[candidate]
    const report = contrastReport(palette)
    const available = roleIds.filter(role => palette[role] !== null)
    expect(report).toHaveLength(available.length * Object.keys(surfaces).length)
    for (const role of available) {
      for (const [surface, background] of Object.entries(surfaces)) {
        const row = report.find(row => row.role === role && row.surface === surface)!
        const ratio = contrastRatio(palette[role]!, background)
        expect(row.ratio).toBe(ratio)
        expect(row.textPass).toBe(ratio >= 4.5)
        expect(row.iconPass).toBe(ratio >= 3)
        expect(row.iconPass, `${candidate}/${role} on ${surface}`).toBe(true)
        if (surface === 'surface-2' || surface === 'bg') expect(row.textPass, `${candidate}/${role} on ${surface}`).toBe(true)
      }
    }
    expect(contrastRatio(palette.actionInk, palette.action!)).toBeGreaterThanOrEqual(4.5)
  })

  it('checks every co-occurring pair without importing Correct into Morse', () => {
    expect(screenRoles.Morse).not.toContain('correct')
    for (const candidate of candidateIds) {
      for (const roles of Object.values(screenRoles)) {
        const pairs = pairReport(palettes[candidate], roles)
        expect(pairs).toHaveLength(roles.length * (roles.length - 1) / 2)
        for (const pair of pairs) expect(pair.conflict).toBe(pair.hue !== null && pair.hue < 30 && pair.lightness! < 0.08)
      }
    }
    expect(pairReport(palettes.signal, screenRoles.Morse).find(pair => pair.a === 'key' && pair.b === 'free')?.conflict).toBe(false)
    expect(pairReport(palettes.families, screenRoles.App).find(pair => pair.a === 'correct' && pair.b === 'decay')?.conflict).toBe(false)
  })

  it('flags near hues only when their lightness is also close', () => {
    expect(pairReport({ ...palettes.signal, key: [0.8, 0.1, 359], listen: [0.8, 0.1, 1] }, ['key', 'listen'])[0].conflict).toBe(true)
    expect(pairReport({ ...palettes.signal, key: [0.6, 0.1, 359], listen: [0.8, 0.1, 1] }, ['key', 'listen'])[0].conflict).toBe(false)
    expect(pairReport(palettes.current, ['key', 'listen'])[0].hue).toBeNull()
  })
})
