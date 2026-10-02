import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readDemoMode, isDemoBuild } from './demoMode'
import { demoLibrary } from './demoLibrary'
import {
  clearLibrary,
  libraryOwner,
  loadLibraryWithReport,
  recoveryEntries,
  saveLibrary,
  switchLibraryOwner,
} from '../infrastructure/persistence/localLibraryRepository'
import { emptyLibrary, freshSeedLibrary } from '../infrastructure/persistence/libraryMigrations'
import { syncConfig } from '../services/sync/syncConfig'
import { inboxConfig } from '../services/inbox/inboxConfig'
import { journeysFor } from '../domain/study/journey'
import { hasStarted } from '../domain/study/libraryGroups'
import { SHIPPED_CATALOG_TOPIC_IDS } from '../domain/library/catalog'

/**
 * The embeddable demo (`npm run build:demo`) is only safe to host on a shared
 * origin if it is local, populated and forgetful. These pin each of those.
 */

const KEY = 'argus.library.v5'
const CANARY = JSON.stringify({ version: 5, topics: [], canary: true })

const FIREBASE = {
  VITE_FIREBASE_API_KEY: 'key',
  VITE_FIREBASE_AUTH_DOMAIN: 'argus.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'argus',
  VITE_FIREBASE_APP_ID: '1:2:web:3',
  VITE_ARGUS_INBOX_UID: 'uid',
}

function fakeStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
    clear: () => values.clear(),
    key: (index: number) => [...values.keys()][index] ?? null,
    get length() {
      return values.size
    },
  }
}

let storage: ReturnType<typeof fakeStorage>

beforeEach(() => {
  storage = fakeStorage()
  vi.stubGlobal('localStorage', storage)
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

function enterDemo() {
  vi.stubEnv('VITE_ARGUS_DEMO', 'true')
}

describe('the demo switch', () => {
  it('is read from the build, and is forgiving about spelling', () => {
    for (const on of ['true', 'TRUE', ' True ', '1']) expect(readDemoMode({ VITE_ARGUS_DEMO: on })).toBe(true)
    for (const off of ['', 'false', '0', 'yes', undefined, true, 1]) {
      expect(readDemoMode({ VITE_ARGUS_DEMO: off })).toBe(false)
    }
    expect(readDemoMode({})).toBe(false)
  })

  it('is off unless the build turned it on, and cannot be turned on from the URL', () => {
    expect(isDemoBuild()).toBe(false)
    vi.stubGlobal('location', { search: '?mode=demo&demo=1' })
    expect(isDemoBuild()).toBe(false)
  })
})

describe('a demo visitor lands in a populated app', () => {
  it('opens with the whole shipped catalog and progress on more than one topic', () => {
    const library = demoLibrary()
    expect(library.topics.map((topic) => topic.id).sort()).toEqual([...SHIPPED_CATALOG_TOPIC_IDS].sort())

    const started = journeysFor(library.topics).filter(hasStarted)
    expect(started.length).toBeGreaterThanOrEqual(2)
    // Today shows what is in motion, so at least one started topic must be.
    expect(library.topics.some((topic) => topic.status === 'learning' || topic.status === 'drilled')).toBe(true)
    expect(library.topics.some((topic) => topic.history.length > 0)).toBe(true)
  })

  it('is the same demo every time it loads', () => {
    const shape = (library: ReturnType<typeof demoLibrary>) =>
      library.topics.map((topic) => ({
        id: topic.id,
        status: topic.status,
        items: topic.items.map((item) => item.id ?? item.prompt),
        attempts: topic.history.map((attempt) => [attempt.correct, attempt.total, attempt.resolvedTo]),
      }))
    expect(shape(demoLibrary(new Date('2026-01-01T00:00:00Z')))).toEqual(
      shape(demoLibrary(new Date('2027-06-30T12:00:00Z'))),
    )
  })

  it('is what the repository loads in a demo build, and an ordinary first run is still empty of progress', () => {
    const ordinary = loadLibraryWithReport().library
    expect(journeysFor(ordinary.topics).filter(hasStarted)).toHaveLength(0)

    enterDemo()
    const demo = loadLibraryWithReport().library
    expect(journeysFor(demo.topics).filter(hasStarted).length).toBeGreaterThanOrEqual(2)
  })
})

describe('a demo forgets, and leaves what is already on the origin alone', () => {
  beforeEach(() => {
    storage.setItem(KEY, CANARY)
    storage.setItem('argus.library.owner.v1', 'someone')
    enterDemo()
  })

  it('never reads a stored library', () => {
    const { library } = loadLibraryWithReport()
    expect(library.topics.length).toBeGreaterThan(0)
    expect(storage.getItem(KEY)).toBe(CANARY)
  })

  it('writes nothing, and clears nothing', () => {
    saveLibrary(freshSeedLibrary())
    clearLibrary()
    expect(storage.getItem(KEY)).toBe(CANARY)
    expect([...Array(storage.length).keys()].map((i) => storage.key(i)).sort()).toEqual(
      [KEY, 'argus.library.owner.v1'].sort(),
    )
  })

  it('has no account: nothing is owned, parked or switched, and no recovery copy is offered', () => {
    expect(libraryOwner()).toBeNull()
    expect(switchLibraryOwner('uid-2', emptyLibrary())).toBeNull()
    expect(recoveryEntries()).toEqual([])
    expect(storage.getItem('argus.library.owner.v1')).toBe('someone')
    expect(storage.getItem('argus.library.parked.v1.someone')).toBeNull()
  })
})

describe('a demo never reaches a backend, even if its build was given Firebase configuration', () => {
  it('leaves sync and the inbox unconfigured', () => {
    for (const [key, value] of Object.entries(FIREBASE)) vi.stubEnv(key, value)
    expect(syncConfig().configured).toBe(true)
    expect(inboxConfig().configured).toBe(true)

    enterDemo()
    expect(syncConfig().configured).toBe(false)
    expect(inboxConfig().configured).toBe(false)
  })

  it('reads the flag the same way in both places', () => {
    for (const key of Object.keys(FIREBASE)) vi.stubEnv(key, FIREBASE[key as keyof typeof FIREBASE])
    for (const value of ['true', 'TRUE', ' True ', '1', 'false', '0', '', 'yes']) {
      vi.stubEnv('VITE_ARGUS_DEMO', value)
      expect(inboxConfig().configured).toBe(!readDemoMode({ VITE_ARGUS_DEMO: value }))
      expect(syncConfig().configured).toBe(!readDemoMode({ VITE_ARGUS_DEMO: value }))
    }
  })
})
