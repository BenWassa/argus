import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, normalize, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Which layer may see which, tested rather than asserted in prose.
 *
 * The folders only communicate ownership if the dependencies actually run one
 * way. Without this, `domain/` acquires a React import, `services/` reaches
 * into a feature, and the structure quietly becomes decoration — which is the
 * state this arrangement was pulled out of.
 *
 * Tests are exempt throughout: a domain test legitimately builds its fixtures
 * through the parse boundary, and that says nothing about what ships.
 */

const SRC = dirname(fileURLToPath(import.meta.url))

/**
 * What each layer may import from. An entry containing a slash allows only that
 * path, so `app/routing` does not admit the rest of `app`.
 *
 * `app` composes everything and so sees everything. The one allowance worth
 * naming is `app/routing`: a surface has to be able to say which run it starts
 * and to register a Back policy, and that vocabulary is the router's. It buys
 * no access to the gate or to `App.tsx`.
 */
const MAY_IMPORT: Record<string, string[]> = {
  domain: ['domain'],
  infrastructure: ['domain', 'infrastructure'],
  services: ['domain', 'infrastructure', 'services'],
  shared: ['domain', 'shared', 'app/routing'],
  features: ['domain', 'infrastructure', 'services', 'shared', 'features', 'app/routing'],
  app: ['domain', 'infrastructure', 'services', 'shared', 'features', 'app'],
}

/**
 * Cross-feature imports that reach past a feature's root, and are known debt.
 *
 * Both are real: the Test ladder keys Morse, and the topic page shows the
 * curriculum path. Either they become part of `features/morse`'s root surface
 * or the consumer stops needing them — this list may shrink, never grow.
 */
const DEEP_FEATURE_IMPORTS = new Set([
  'src/features/library/TopicPage.tsx -> src/features/morse/lesson/MorsePath',
  'src/features/test/ProgressiveCard.tsx -> src/features/morse/input/MorseKeyInput',
])

function sourceFiles(root: string): string[] {
  const found: string[] = []
  for (const entry of readdirSync(root)) {
    const path = join(root, entry)
    if (statSync(path).isDirectory()) found.push(...sourceFiles(path))
    else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) found.push(path)
  }
  return found
}

function importsOf(path: string): string[] {
  const source = readFileSync(path, 'utf8')
  return [...source.matchAll(/from\s+'([^']+)'|import\('([^']+)'\)/g)]
    .map((match) => match[1] ?? match[2])
    .filter((specifier) => specifier.startsWith('.'))
}

/** Repo-relative, POSIX-separated, for readable failures. */
const asPath = (absolute: string) => `src/${relative(SRC, absolute).split(sep).join('/')}`
const layerOf = (path: string) => path.split('/')[1]

const sources = sourceFiles(SRC)

describe('the layers point one way', () => {
  it('has found the source tree it is checking', () => {
    expect(sources.length).toBeGreaterThan(50)
  })

  it('lets no layer import one it does not own', () => {
    for (const absolute of sources) {
      const file = asPath(absolute)
      const layer = layerOf(file)
      const allowed = MAY_IMPORT[layer]
      if (!allowed) continue

      for (const specifier of importsOf(absolute)) {
        const target = `src/${relative(SRC, normalize(join(dirname(absolute), specifier))).split(sep).join('/')}`
        if (!target.startsWith('src/')) continue
        const targetLayer = layerOf(target)
        if (targetLayer === undefined || targetLayer === layer) continue
        if (!MAY_IMPORT[targetLayer]) continue

        const inside = target.slice('src/'.length)
        const permitted =
          allowed.includes(targetLayer) ||
          allowed.some((entry) => entry.includes('/') && inside.startsWith(`${entry}/`))
        expect(permitted, `${file} imports ${target}`).toBe(true)
      }
    }
  })

  it('keeps React out of the domain', () => {
    // The learning model is the part that has to be reasoned about, simulated
    // and tested without a browser. A hook here would end that.
    for (const absolute of sources.filter((path) => asPath(path).startsWith('src/domain/'))) {
      const source = readFileSync(absolute, 'utf8')
      expect(source, `${asPath(absolute)} imports React`).not.toMatch(/from 'react(-dom)?'/)
      expect(asPath(absolute).endsWith('.tsx'), `${asPath(absolute)} is a component`).toBe(false)
    }
  })
})

describe('a feature owns its internals', () => {
  it('lets a sibling feature import only what it puts at its root', () => {
    for (const absolute of sources.filter((path) => asPath(path).startsWith('src/features/'))) {
      const file = asPath(absolute)
      const own = file.split('/')[2]

      for (const specifier of importsOf(absolute)) {
        const target = `src/${relative(SRC, normalize(join(dirname(absolute), specifier))).split(sep).join('/')}`
        if (!target.startsWith('src/features/')) continue
        const other = target.split('/')[2]
        if (other === own) continue

        const reachesInside = target.split('/').length > 4
        if (reachesInside && DEEP_FEATURE_IMPORTS.has(`${file} -> ${target}`)) continue
        expect(reachesInside, `${file} reaches inside ${other}: ${target}`).toBe(false)
      }
    }
  })

  it('records only exceptions that still exist', () => {
    // An exception left behind after its import is gone would quietly license
    // a future one.
    const live = new Set<string>()
    for (const absolute of sources.filter((path) => asPath(path).startsWith('src/features/'))) {
      const file = asPath(absolute)
      const own = file.split('/')[2]
      for (const specifier of importsOf(absolute)) {
        const target = `src/${relative(SRC, normalize(join(dirname(absolute), specifier))).split(sep).join('/')}`
        if (!target.startsWith('src/features/')) continue
        if (target.split('/')[2] === own) continue
        if (target.split('/').length > 4) live.add(`${file} -> ${target}`)
      }
    }
    expect([...DEEP_FEATURE_IMPORTS].sort()).toEqual([...live].sort())
  })
})
