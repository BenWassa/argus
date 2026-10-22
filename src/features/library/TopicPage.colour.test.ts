import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { contrastRatio, type Colour } from '../../shared/colour'

/**
 * Learn and Practice tiles fill in the topic's track colour with a track ink.
 * Both are aliases of tokens; the ink must read on the fill at 4.5:1.
 */
const tokens = readFileSync(new URL('../../styles/tokens.css', import.meta.url), 'utf8')
const page = readFileSync(new URL('./TopicPage.css', import.meta.url), 'utf8')
const declared = new Map([...tokens.matchAll(/--([a-z0-9-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]))

function colour(value: string): Colour {
  const alias = /^var\(--([a-z0-9-]+)\)$/.exec(value)
  if (alias) {
    const next = declared.get(alias[1])
    if (!next) throw new Error(`--${alias[1]} is not declared`)
    return colour(next)
  }
  const oklch = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/.exec(value)
  if (oklch) return [Number(oklch[1]), Number(oklch[2]), Number(oklch[3])]
  if (/^#[\da-f]{6}$/i.test(value)) return value
  throw new Error(`not a solid colour: ${value}`)
}

describe('topic track tiles', () => {
  it.each(['learning', 'survival', 'tradecraft'])('%s ink reads on its track fill', (track) => {
    const rule = new RegExp(`\\.topic-track-${track}\\s*\\{([^}]*)\\}`).exec(page)?.[1] ?? ''
    const fill = /--topic-track:\s*([^;]+);/.exec(rule)?.[1].trim()
    const ink = /--topic-track-ink:\s*([^;]+);/.exec(rule)?.[1].trim()
    expect(fill, `--topic-track for ${track}`).toBe(`var(--${track})`)
    expect(ink, `--topic-track-ink for ${track}`).toBeDefined()
    expect(contrastRatio(colour(ink!), colour(fill!))).toBeGreaterThanOrEqual(4.5)
  })
})
