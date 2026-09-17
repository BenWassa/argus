import { describe, expect, it } from 'vitest'
import {
  REQUIRED_SYNC_ENV,
  forbiddenSyncEnvKeys,
  libraryCollectionPath,
  libraryMetaPath,
  readSyncConfig,
} from './syncConfig'
import { REQUIRED_INBOX_ENV, forbiddenInboxEnvKeys } from '../inbox/inboxConfig'

/**
 * Sync restates the inbox's Firebase configuration rules rather than importing
 * them, because `inbox/boundary.test.ts` forbids anything under `src/lib` from
 * importing the inbox at all. Restating is only safe while the two actually
 * agree, so this holds them in step — the same arrangement the inbox's track
 * vocabulary has with the library's.
 *
 * A test file may import both; the boundary rule covers source, not tests.
 */

const REAL = {
  VITE_FIREBASE_API_KEY: 'key',
  VITE_FIREBASE_AUTH_DOMAIN: 'argus.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'argus',
  VITE_FIREBASE_APP_ID: '1:2:web:3',
}

describe('sync configuration stays in step with the inbox', () => {
  it('requires the same Firebase variables, minus the inbox-only UID', () => {
    expect([...REQUIRED_SYNC_ENV]).toEqual(
      REQUIRED_INBOX_ENV.filter((key) => key !== 'VITE_ARGUS_INBOX_UID'),
    )
  })

  it('refuses exactly the same privileged variables', () => {
    const env = {
      VITE_FIREBASE_PRIVATE_KEY: 'x',
      VITE_SERVICE_ACCOUNT: 'x',
      VITE_GOOGLE_CLIENT_SECRET: 'x',
      VITE_GITHUB_TOKEN: 'x',
      VITE_ADMIN_KEY: 'x',
      VITE_FIREBASE_API_KEY: 'fine',
    }
    expect(forbiddenSyncEnvKeys(env)).toEqual(forbiddenInboxEnvKeys(env))
    expect(forbiddenSyncEnvKeys(env).length).toBe(5)
  })
})

describe('reading sync configuration', () => {
  it('configures from the four public values, without needing a UID', () => {
    // The whole point of the address-based rules: a device can sync before
    // anybody knows what UID the account will be given.
    const result = readSyncConfig(REAL)
    expect(result.configured).toBe(true)
    if (!result.configured) return
    expect(result.config.projectId).toBe('argus')
    expect(result.config.storageBucket).toBeUndefined()
  })

  it('reports what is missing rather than configuring half a client', () => {
    const result = readSyncConfig({ VITE_FIREBASE_API_KEY: 'key' })
    expect(result.configured).toBe(false)
    if (result.configured) return
    expect(result.missing).toEqual([
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_APP_ID',
    ])
  })

  it('treats blank and whitespace values as unset', () => {
    expect(readSyncConfig({ ...REAL, VITE_FIREBASE_APP_ID: '   ' }).configured).toBe(false)
  })

  it('throws rather than inlining a privileged value into the bundle', () => {
    expect(() => readSyncConfig({ ...REAL, VITE_SERVICE_ACCOUNT: 'secret' })).toThrow(
      /Refusing to configure sync/,
    )
  })

  it('keys every path by the signed-in uid', () => {
    expect(libraryCollectionPath('abc123')).toBe('users/abc123/library')
    expect(libraryMetaPath('abc123')).toBe('users/abc123/libraryMeta/library')
  })
})
