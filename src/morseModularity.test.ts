import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Morse is large enough to be an app of its own, so its shape is held by a
 * test the way the layers are in `architecture.test.ts`.
 *
 * - No shipped Morse source file grows past the ceiling. When one needs to,
 *   split it by responsibility (a hook, a pure module, a sub-component) rather
 *   than raising the number.
 * - Every Morse feature folder, and the domain root, explains itself in a
 *   README that a newcomer can find without reading the code.
 */

const SRC = dirname(fileURLToPath(import.meta.url))
const MORSE_ROOTS = [join(SRC, 'domain', 'morse'), join(SRC, 'features', 'morse')]

/** Lines, not bytes: the point is what a reader has to hold in their head. */
const MAX_SOURCE_LINES = 450

const asPath = (absolute: string) => `src/${relative(SRC, absolute).split(sep).join('/')}`

function walk(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry)
    return statSync(path).isDirectory() ? walk(path) : [path]
  })
}

function folders(root: string): string[] {
  return readdirSync(root)
    .map((entry) => join(root, entry))
    .filter((path) => statSync(path).isDirectory())
}

describe('Morse stays modular', () => {
  const shipped = MORSE_ROOTS.flatMap(walk).filter(
    (path) => /\.(tsx?|css)$/.test(path) && !/\.test\.tsx?$/.test(path),
  )

  it('has found the Morse source it is checking', () => {
    expect(shipped.length).toBeGreaterThan(50)
  })

  it(`keeps every shipped source file within ${MAX_SOURCE_LINES} lines`, () => {
    for (const path of shipped) {
      const lines = readFileSync(path, 'utf8').split('\n').length
      expect(lines, `${asPath(path)} has ${lines} lines`).toBeLessThanOrEqual(MAX_SOURCE_LINES)
    }
  })

  it('documents the domain root and every feature folder', () => {
    const [domainRoot, featureRoot] = MORSE_ROOTS
    const documented = [domainRoot, featureRoot, ...folders(featureRoot)]
    for (const folder of documented) {
      expect(existsSync(join(folder, 'README.md')), `${asPath(folder)} has no README.md`).toBe(true)
    }
  })
})
