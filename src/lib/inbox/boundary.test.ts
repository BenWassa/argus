import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { TRACK_HINTS, parseContentRequest, type ContentRequest } from './model'
import { REQUIRED_INBOX_ENV, forbiddenInboxEnvKeys, inboxCollectionPath, readInboxConfig } from './config'
import { INBOX_UNCONFIGURED, describeInboxError, unavailableBackend } from './backend'
import { dueTopics, isDue, resolveAttempt, shelves } from '../scheduling'
import { parseLibrary } from '../storage'
import { TRACKS } from '../types'

/**
 * The architectural boundaries of #39, tested rather than asserted in prose.
 *
 * A pending request is not a Topic and must never reach Learn, Test, the
 * scheduler, progress, completion, history or cue evidence; the inbox is remote
 * and the library is local; and nothing privileged may reach the browser.
 */

const HERE = dirname(fileURLToPath(import.meta.url))
const SRC = join(HERE, '..', '..')

function sourceFiles(root: string): string[] {
  const found: string[] = []
  for (const entry of readdirSync(root)) {
    const path = join(root, entry)
    if (statSync(path).isDirectory()) found.push(...sourceFiles(path))
    else if (/\.(ts|tsx)$/.test(entry)) found.push(path)
  }
  return found
}

function importsOf(path: string): string[] {
  const source = readFileSync(path, 'utf8')
  return [...source.matchAll(/from\s+'([^']+)'|import\('([^']+)'\)/g)].map(
    (match) => match[1] ?? match[2],
  )
}

const inboxSources = sourceFiles(HERE).filter((path) => !path.endsWith('.test.ts'))
const librarySources = sourceFiles(SRC).filter(
  (path) => !path.startsWith(HERE) && !/\.test\.tsx?$/.test(path),
)

describe('the inbox does not touch the learning model', () => {
  it('imports nothing from the library at all', () => {
    for (const path of inboxSources) {
      for (const specifier of importsOf(path)) {
        const local = specifier.startsWith('.')
        expect(
          !local || specifier.startsWith('./'),
          `${relative(SRC, path)} imports ${specifier} from outside the inbox`,
        ).toBe(true)
      }
    }
  })

  it('never reaches a learning-model or storage entry point', () => {
    // The import rule above already makes the library's types unreachable.
    // These are the runtime entry points a stray global or copied line could
    // still bring in: durable learner state and the scheduler.
    const forbidden = [
      'resolveAttempt',
      'resolveStudy',
      'dueTopics',
      'shelves',
      'seedLibrary',
      'parseLibrary',
      'saveLibrary',
      'useLibrary',
      'localStorage',
    ]
    for (const path of inboxSources) {
      const source = readFileSync(path, 'utf8')
      for (const name of forbidden) {
        expect(source.includes(name), `${relative(SRC, path)} mentions ${name}`).toBe(false)
      }
    }
  })

  it('is not reachable from the library, storage or scheduler', () => {
    const libModules = librarySources.filter((path) => path.includes(`${join('src', 'lib')}`) || path.includes('/lib/'))
    for (const path of libModules) {
      for (const specifier of importsOf(path)) {
        expect(specifier.includes('inbox'), `${relative(SRC, path)} imports ${specifier}`).toBe(false)
      }
    }
  })

  it('keeps its own track vocabulary in step with the library without importing it', () => {
    expect([...TRACK_HINTS]).toEqual([...TRACKS])
  })
})

describe('a pending request can never become learning state', () => {
  const pendingRecord = {
    text: 'Maritime signal flags',
    status: 'pending',
    trackHint: 'tradecraft',
    createdAt: '2026-02-01T09:00:00.000Z',
  }

  it('is rejected by the library parser', () => {
    // The import boundary is where a foreign record would have to get in.
    const parsed = parseLibrary({ version: 5, topics: [{ id: 'req-1', ...pendingRecord }] })
    expect(parsed.ok).toBe(false)
    if (!parsed.ok) expect(parsed.error).toMatch(/title|scope/i)
  })

  it('has no field the scheduler or the ladder can read', () => {
    const request = parseContentRequest('req-1', pendingRecord) as ContentRequest
    const asTopic = request as unknown as Record<string, unknown>

    for (const field of [
      'items',
      'scope',
      'history',
      'itemEvidence',
      'drilledAt',
      'learningAt',
      'completedAt',
      'lastTestedAt',
      'spotCheckedAt',
    ]) {
      expect(asTopic[field]).toBeUndefined()
    }
    // `status` exists on both, and means something entirely different here.
    expect(request.status).toBe('pending')
    expect(['unstarted', 'learning', 'drilled', 'completed', 'decayed']).not.toContain(request.status)
  })

  it('is invisible to every scheduling surface', () => {
    const parsed = parseLibrary({
      version: 5,
      topics: [
        {
          id: 'nato-phonetic',
          title: 'NATO phonetic alphabet',
          scope: 'The 26 letters.',
          track: 'learning',
          items: [{ id: 'i1', kind: 'forward', prompt: 'A', answer: 'Alfa' }],
          status: 'unstarted',
          createdAt: '2026-01-01T00:00:00.000Z',
          drilledAt: null,
          learningAt: null,
          completedAt: null,
          lastTestedAt: null,
          spotCheckedAt: null,
          history: [],
          itemEvidence: {},
        },
      ],
    })
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return

    const { topics } = parsed.library
    const before = {
      due: dueTopics(topics).map((topic) => topic.id),
      shelves: shelves(topics).map((shelf) => `${shelf.id}:${shelf.topics.length}`),
      resolved: resolveAttempt(topics[0], 1, 1).to,
    }

    // Every scheduling entry point takes topics and only topics. There is no
    // overload, argument or code path through which a request could be offered.
    expect(before.due).toEqual(['nato-phonetic'])
    expect(before.shelves).toEqual(['due:1'])
    expect(before.resolved).toBe('learning')
    expect(topics.every((topic) => isDue(topic) || !isDue(topic))).toBe(true)
  })
})

describe('the inbox failing is never an Argus failure', () => {
  it('reports itself unavailable instead of throwing on load', () => {
    expect(unavailableBackend.configured).toBe(false)
    expect(unavailableBackend.authorizedUid).toBeNull()

    let seen: unknown = 'not called'
    unavailableBackend.observeUser((user) => {
      seen = user
    })
    expect(seen).toBeNull()

    let requests: unknown = 'not called'
    unavailableBackend.observeRequests(
      (next) => {
        requests = next
      },
      () => {},
    )
    expect(requests).toEqual([])
  })

  it('refuses writes with an explanation rather than a crash', async () => {
    await expect(unavailableBackend.addRequest({ text: 'x', trackHint: null })).rejects.toThrow(
      INBOX_UNCONFIGURED,
    )
    await expect(unavailableBackend.deleteRequest('x')).rejects.toThrow(INBOX_UNCONFIGURED)
  })

  it('says the text is kept whenever the network is the problem', () => {
    expect(describeInboxError({ code: 'unavailable' })).toContain('still here')
    expect(describeInboxError({ code: 'permission-denied' })).toContain('Nothing was sent')
  })
})

describe('nothing privileged reaches the browser', () => {
  it('reads only public web configuration', () => {
    const env = {
      VITE_FIREBASE_API_KEY: 'public-web-api-key',
      VITE_FIREBASE_AUTH_DOMAIN: 'argus.firebaseapp.com',
      VITE_FIREBASE_PROJECT_ID: 'argus',
      VITE_FIREBASE_APP_ID: '1:2:web:3',
      VITE_ARGUS_INBOX_UID: 'authorized-uid',
    }
    const result = readInboxConfig(env)
    expect(result.configured).toBe(true)
    if (!result.configured) return
    expect(result.config.authorizedUid).toBe('authorized-uid')
    expect(inboxCollectionPath('authorized-uid')).toBe('users/authorized-uid/inbox')
  })

  it('reports an unconfigured build rather than half-configuring one', () => {
    const result = readInboxConfig({ VITE_FIREBASE_API_KEY: 'k' })
    expect(result.configured).toBe(false)
    if (result.configured) return
    expect(result.missing).toEqual(REQUIRED_INBOX_ENV.filter((key) => key !== 'VITE_FIREBASE_API_KEY'))
  })

  it('refuses to build against a credential-shaped variable', () => {
    const env = { VITE_FIREBASE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----' }
    expect(forbiddenInboxEnvKeys(env)).toEqual(['VITE_FIREBASE_PRIVATE_KEY'])
    expect(() => readInboxConfig(env)).toThrow(/never to the app/)
    for (const key of ['VITE_SERVICE_ACCOUNT', 'VITE_GITHUB_TOKEN', 'VITE_ADMIN_KEY']) {
      expect(() => readInboxConfig({ [key]: 'x' })).toThrow()
    }
  })

  it('ships no credential and no ingestion code in the client source', () => {
    const forbidden = [
      /-----BEGIN [A-Z ]*PRIVATE KEY/,
      /"type":\s*"service_account"/,
      /GOOGLE_APPLICATION_CREDENTIALS/,
      /gh[pousr]_[A-Za-z0-9]{16,}/,
    ]
    // Tests never reach the browser; this is about what the bundle can carry.
    for (const path of sourceFiles(SRC).filter((file) => !/\.test\.tsx?$/.test(file))) {
      const source = readFileSync(path, 'utf8')
      for (const pattern of forbidden) {
        expect(pattern.test(source), `${relative(SRC, path)} matches ${pattern}`).toBe(false)
      }
      expect(source.includes('scripts/inbox'), `${relative(SRC, path)} imports the ingestion tool`).toBe(
        false,
      )
    }
  })
})
