// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { MORSE_LETTERS } from '../../domain/morse/code'

const assetRoot = '../../../public/media/roles/'
const badgeSvg = readFileSync(fileURLToPath(new URL(assetRoot + 'communicator.svg', import.meta.url)), 'utf8')
const manifest = JSON.parse(readFileSync(fileURLToPath(new URL(assetRoot + 'manifest.json', import.meta.url)), 'utf8')) as {
  role: string
  runtime: string
  family: string
  format: string
}

describe('Communicator nautical badge asset', () => {
  const svg = new DOMParser().parseFromString(badgeSvg, 'image/svg+xml')

  it('draws A and Z in the correct order with one-unit dots, three-unit dashes and one-unit gaps', () => {
    for (const [id, letter] of [['morse-left', 'A'], ['morse-right', 'Z']] as const) {
      const group = svg.getElementById(id)!
      const elements = Array.from(group.querySelectorAll('circle, rect'))
      const drawnPattern = elements.map((element) => element.tagName === 'circle' ? '.' : '-').join('')
      expect(drawnPattern).toBe(MORSE_LETTERS[letter])
      const unit = 10
      const bounds = elements.map((element) => {
        if (element.tagName === 'circle') {
          const radius = Number(element.getAttribute('r'))
          expect(radius * 2).toBe(unit)
          return [Number(element.getAttribute('cx')) - radius, unit]
        }
        expect(Number(element.getAttribute('width'))).toBe(unit * 3)
        expect(Number(element.getAttribute('height'))).toBe(unit)
        return [Number(element.getAttribute('x')), unit * 3]
      })
      for (let i = 1; i < bounds.length; i += 1) {
        expect(bounds[i][0] - (bounds[i - 1][0] + bounds[i - 1][1])).toBe(unit)
      }
    }
  })

  it('keeps the verified flag patterns rather than approximate nautical motifs', () => {
    // NGA Pub. 102 inside-cover plate: N is 4 × 4, not four quarters.
    const november = svg.getElementById('flag-november')!
    const blueSquares = Array.from(november.querySelectorAll('rect[fill="url(#blue)"]'))
    expect(blueSquares).toHaveLength(8)
    expect(blueSquares.map((square) => [Number(square.getAttribute('x')) / 12, Number(square.getAttribute('y')) / 12.25]))
      .toEqual([[0, 0], [2, 0], [1, 1], [3, 1], [0, 2], [2, 2], [1, 3], [3, 3]])
    const zulu = svg.getElementById('flag-zulu')!
    for (const [colour, path] of [
      ['yellow', 'M0 0H35L17.5 19Z'], ['blue', 'M35 0V38L17.5 19Z'],
      ['red', 'M35 38H0L17.5 19Z'], ['black', 'M0 38V0L17.5 19Z'],
    ]) {
      const triangle = zulu.querySelector(`[data-colour="${colour}"]`)
      expect(triangle?.getAttribute('d')).toBe(path)
      expect(triangle?.getAttribute('fill')).toBe(`url(#${colour === 'yellow' || colour === 'black' ? 'flag-' : ''}${colour})`)
    }
    expect(svg.getElementById('flag-victor')?.querySelector('path[stroke="url(#red)"]')?.getAttribute('d'))
      .toBe('M0 0L35 38M35 0L0 38')
    // Alfa's right edge must actually be notched, not a rectangular white/blue split.
    expect(svg.getElementById('flag-alfa')?.querySelector('path[fill="url(#blue)"]')?.getAttribute('d'))
      .toBe('M24 0H48L34 24.5L48 49H24Z')
  })

  it('is a real independently editable vector, not a raster wrapper', () => {
    expect(badgeSvg).toMatch(/<svg[^>]+viewBox="0 0 512 512"/)
    expect(badgeSvg).not.toMatch(/<image\b|<foreignObject\b|data:image\/|<script\b/i)
    for (const id of [
      'rope-border', 'enamel-field', 'mast-assembly', 'signal-arcs',
      'signal-left', 'signal-right', 'signal-flags', 'morse-code',
      'sea-waves', 'wave-back', 'wave-mid', 'wave-front', 'compass-rose',
    ]) {
      expect(badgeSvg).toContain(`id="${id}"`)
    }
    expect(badgeSvg).toContain('prefers-reduced-motion')
  })

  it('uses the sole visible role, with an original self-contained Nautical asset', () => {
    expect(manifest.role).toBe('communicator')
    expect(manifest.runtime).toBe('/media/roles/communicator.svg')
    expect(manifest.family).toBe('Nautical (current)')
    expect(manifest.format).toContain('pure-vector')
    expect(badgeSvg).not.toMatch(/\b(?:href|xlink:href)\s*=\s*['\"](?:https?:\/\/|data:)/i)
  })
})
