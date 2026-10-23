import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'

/**
 * One unclosed rule swallows every stylesheet bundled after it, and the app
 * renders unstyled with no build error. Every stylesheet must parse on its own.
 */
const root = fileURLToPath(new URL('..', import.meta.url))
function stylesheets(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? stylesheets(path) : entry.name.endsWith('.css') ? [path] : []
  })
}

describe('stylesheets', () => {
  it.each(stylesheets(root).map((path) => [relative(root, path), path]))('%s parses with every rule closed', (_name, path) => {
    expect(() => postcss.parse(readFileSync(path, 'utf8'), { from: path })).not.toThrow()
  })
})
