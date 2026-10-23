import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { generateServiceWorker } from './scripts/serviceWorker'

async function listFiles(directory: string, root = directory): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(directory, entry.name)
      return entry.isDirectory() ? listFiles(absolutePath, root) : [path.relative(root, absolutePath)]
    }),
  )

  return files.flat().sort()
}

function sourceBuildId(): string {
  const supplied = process.env.ARGUS_BUILD_SHA ?? process.env.GITHUB_SHA
  if (supplied) return supplied.slice(0, 7)

  try {
    return execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return 'unknown'
  }
}

function serviceWorkerPlugin() {
  return {
    name: 'argus-service-worker',
    apply: 'build' as const,
    async closeBundle() {
      const outputDirectory = path.resolve('dist')
      const files = (await listFiles(outputDirectory)).filter((file) => file !== 'sw.js')
      const revision = createHash('sha256')
      // Worker behavior is part of the cache generation, not just app assets.
      revision.update(generateServiceWorker({ buildId: 'template', files: [] }))

      for (const file of files) {
        revision.update(file)
        revision.update(await readFile(path.join(outputDirectory, file)))
      }

      const buildId = revision.digest('hex').slice(0, 16)
      const source = generateServiceWorker({ buildId, files })

      await writeFile(path.join(outputDirectory, 'sw.js'), source)
    },
  }
}

// `--mode demo` builds the embeddable local-only demo (see `src/demo/demoMode.ts`
// and `.env.demo`). It is served from a GitHub Pages sub-path rather than the
// root of Firebase Hosting, so it has its own base, and it writes to its own
// directory so that `dist/`, which `firebase deploy` uploads, can never end up
// holding a demo.
const DEMO_MODE = 'demo'
const DEMO_BASE = '/argus/'

export default defineConfig(({ mode }) => {
  const demo = mode === DEMO_MODE

  return {
    define: {
      __ARGUS_BUILD_ID__: JSON.stringify(sourceBuildId()),
    },
    // The demo registers no service worker, so it does not generate one: its
    // precache list is written against the site root, and a demo must not keep
    // anything across visits anyway.
    plugins: [react(), ...(demo ? [] : [serviceWorkerPlugin()])],
    // Production: Firebase Hosting serves the root of its own domain. Demo:
    // GitHub Pages serves the repository under /argus/. Override with
    // ARGUS_DEMO_BASE to host the demo anywhere else.
    base: demo ? (process.env.ARGUS_DEMO_BASE ?? DEMO_BASE) : '/',
    build: { outDir: demo ? 'dist-demo' : 'dist' },
    test: {
      // The Security Rules suite needs a live Firestore emulator, so it runs
      // under its own config rather than in the ordinary unit run.
      // Browser-level coverage runs under Playwright, against the built app.
      // `.claude/worktrees` holds other sessions' complete checkouts; their tests are
      // not this tree's tests, and without node_modules they fail wholesale.
      exclude: ['**/node_modules/**', '**/dist/**', '**/dist-demo/**', '**/.claude/**', 'firestore/**', 'e2e/**'],
    },
  }
})
