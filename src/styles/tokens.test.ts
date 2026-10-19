import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { contrastRatio, hueDistance, toOklch, type Colour } from '../shared/colour'

/**
 * The Signal-on-Slate rules (#226), measured on the token values themselves:
 * readable text, visible UI, opaque colour, and copper kept for decay alone.
 */
const source = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8')
const declared = new Map(
  [...source.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]),
)

function colour(name: string, seen: string[] = []): Colour {
  const value = declared.get(name)
  if (value === undefined) throw new Error(`--${name} is not declared`)
  if (seen.includes(name)) throw new Error(`--${name} aliases itself`)
  const alias = /^var\(--([a-z0-9-]+)\)$/.exec(value)
  if (alias) return colour(alias[1], [...seen, name])
  const oklch = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/.exec(value)
  if (oklch) return [Number(oklch[1]), Number(oklch[2]), Number(oklch[3])]
  if (/^#[\da-f]{6}$/i.test(value)) return value
  throw new Error(`--${name} is not a solid colour: ${value}`)
}

const ratio = (foreground: string, background: string) => contrastRatio(colour(foreground), colour(background))
const MODES = ['key', 'listen', 'read', 'free'] as const
const TRACKS = ['learning', 'survival', 'tradecraft'] as const

describe('Signal on Slate', () => {
  it.each([
    ['ink', ['bg', 'surface', 'surface-2', 'surface-3', 'surface-4', 'accent-wash']],
    ['muted', ['bg', 'surface', 'surface-2', 'surface-3']],
    ['subtle', ['bg', 'surface', 'surface-2']],
    ['placeholder', ['field']],
    ['action', ['bg', 'surface', 'surface-2']],
    ['warning', ['bg', 'surface', 'surface-2']],
    ['danger', ['bg', 'surface', 'surface-2']],
    ['ok', ['bg', 'surface', 'surface-2']],
    ...TRACKS.map((track) => [track, ['bg', 'surface', 'surface-2']] as const),
  ] as const)('%s reads at 4.5:1 or better wherever it is set as text', (foreground, backgrounds) => {
    for (const background of backgrounds) {
      expect(ratio(foreground, background), `--${foreground} on --${background}`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('gives every solid fill an ink that reads on it', () => {
    expect(ratio('action-ink', 'action')).toBeGreaterThanOrEqual(4.5)
    expect(ratio('accent-ink', 'accent')).toBeGreaterThanOrEqual(4.5)
    expect(ratio('danger-ink', 'danger')).toBeGreaterThanOrEqual(4.5)
    for (const mode of MODES) {
      expect(ratio(`mode-${mode}-ink`, `mode-${mode}`), mode).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('keeps fills, rings and the spine ahead visible against the page', () => {
    for (const name of ['action', 'spine-ahead', 'complete', ...MODES.map((mode) => `mode-${mode}`)]) {
      expect(ratio(name, 'bg'), `--${name}`).toBeGreaterThanOrEqual(3)
    }
  })

  it('keeps the four modes apart from one another', () => {
    for (const [index, a] of MODES.entries()) {
      for (const b of MODES.slice(index + 1)) {
        expect(hueDistance(toOklch(colour(`mode-${a}`))[2], toOklch(colour(`mode-${b}`))[2]), `${a}/${b}`).toBeGreaterThanOrEqual(30)
      }
    }
  })

  it('keeps copper for decay alone', () => {
    const [copperL, , copperH] = toOklch(colour('warning'))
    for (const name of ['action', 'danger', 'ok', ...MODES.map((mode) => `mode-${mode}`), ...TRACKS]) {
      const [l, , h] = toOklch(colour(name))
      const apart = hueDistance(h, copperH) >= 30 || Math.abs(l - copperL) >= 0.08
      expect(apart, `--${name} sits too close to copper`).toBe(true)
    }
  })

  it('never declares or references retired material tokens anywhere in src', () => {
    const retired = [
      'gradient-primary', 'gradient-ghost', 'gradient-ghost-hover',
      'grain', 'machining', 'convex', 'sheen', 'edge', 'edge-under',
    ].join('|')
    const declaration = new RegExp(`--(?:${retired})\\s*:`)
    const reference = new RegExp(`var\\(\\s*--(?:${retired})\\s*[,)]`)
    const root = fileURLToPath(new URL('..', import.meta.url))
    const violations: string[] = []
    function scan(dir: string) {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name)
        if (entry.isDirectory()) scan(path)
        else {
          const content = readFileSync(path, 'utf8')
          if (declaration.test(content) || reference.test(content)) violations.push(relative(root, path))
        }
      }
    }
    scan(root)
    expect(violations).toEqual([])
  })

  it('declares no translucent colour outside the neutral shadow scale', () => {
    const shadows = new Set(['press', 'press-lit', 'shadow-sm', 'shadow-key', 'shadow', 'shadow-lift', 'shadow-rail', 'scrim'])
    for (const [name, value] of declared) {
      if (/(?:oklch|rgb)\([^)]*\//.test(value)) expect(shadows.has(name), `--${name}: ${value}`).toBe(true)
    }
  })
})
