import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss from 'postcss'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
function stylesheets(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? stylesheets(path) : entry.name.endsWith('.css') ? [path] : []
  })
}

describe('solid surfaces', () => {
  it.each(stylesheets(root).map((path) => [relative(root, path), path]))('%s uses solid fills and centralised alpha tokens', (name, path) => {
    const violations: string[] = []
    postcss.parse(readFileSync(path, 'utf8'), { from: path }).walkDecls((declaration) => {
      const { prop, value } = declaration
      if (/\b(?:repeating-)?(?:linear|radial|conic)-gradient\s*\(/i.test(value)) {
        violations.push(`${prop}: ${value}`)
      }
      if (/^(?:-webkit-)?backdrop-filter$/i.test(prop) && value.trim().toLowerCase() !== 'none') {
        violations.push(`${prop}: ${value}`)
      }
      if (name !== 'styles/tokens.css' && (
        /\b(?:rgba?|oklch|hsla?)\([^)]*\//i.test(value)
        || /#(?:[\da-f]{8}|[\da-f]{4})\b/i.test(value)
        // Mixing toward transparent is a translucent fill by another name.
        || /color-mix\(.*\btransparent\b/i.test(value)
      )) {
        violations.push(`${prop}: ${value}`)
      }
    })
    expect(violations, name).toEqual([])
  })
})
