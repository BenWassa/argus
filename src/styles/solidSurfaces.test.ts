import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import postcss, { type AtRule, type Declaration, type Node } from 'postcss'
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
      // Opacity is motion, never a state (#259): a faded control or label lets
      // the chassis show through it. Inside @keyframes it may pass through any
      // value; everywhere else it is fully on (1) or fully off (0).
      if (/^opacity$/i.test(prop) && !insideKeyframes(declaration) && isPartial(value)) {
        violations.push(`${prop}: ${value}`)
      }
    })
    expect(violations, name).toEqual([])
  })
})

function insideKeyframes(declaration: Declaration): boolean {
  for (let parent: Node | undefined = declaration.parent as Node | undefined; parent; parent = parent.parent as Node | undefined) {
    if (parent.type === 'atrule' && /keyframes$/i.test((parent as AtRule).name)) return true
  }
  return false
}

function isPartial(value: string): boolean {
  const match = /^\s*(-?(?:\d+\.?\d*|\.\d+))(%?)\s*(?:!important)?\s*$/.exec(value)
  if (!match) return false
  const amount = Number(match[1]) / (match[2] ? 100 : 1)
  return amount > 0 && amount < 1
}

describe('the partial-opacity guard', () => {
  const partial = (css: string) => {
    const found: string[] = []
    postcss.parse(css).walkDecls('opacity', (declaration) => {
      if (!insideKeyframes(declaration) && isPartial(declaration.value)) found.push(declaration.value)
    })
    return found
  }

  it('refuses a faded state and allows fully on, fully off and motion', () => {
    expect(partial('button:disabled { opacity: 0.46; }')).toEqual(['0.46'])
    expect(partial('.a { opacity: .5 } .b { opacity: 55% }')).toEqual(['.5', '55%'])
    expect(partial('.a { opacity: 0 } .b { opacity: 1 } .c { opacity: 100% }')).toEqual([])
    expect(partial('@keyframes in { from { opacity: 0.6 } to { opacity: 1 } }')).toEqual([])
    expect(partial('@media (min-width: 1px) { .a { opacity: 0.3 } }')).toEqual(['0.3'])
  })
})
