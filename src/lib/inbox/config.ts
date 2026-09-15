import {
  assertPublicFirebaseEnv,
  forbiddenFirebaseEnvKeys,
  readFirebaseConfig,
  REQUIRED_FIREBASE_ENV,
  type FirebaseWebConfig,
} from '../firebaseConfig'

export type { FirebaseWebConfig } from '../firebaseConfig'
export { REQUIRED_FIREBASE_ENV } from '../firebaseConfig'

export interface InboxConfig {
  firebase: FirebaseWebConfig
  /** The sole Firebase UID the inbox and its Security Rules recognize. */
  authorizedUid: string
}

export const REQUIRED_INBOX_ENV = [...REQUIRED_FIREBASE_ENV, 'VITE_ARGUS_INBOX_UID'] as const

type Env = Record<string, unknown>

function text(env: Env, key: string): string {
  const value = env[key]
  return typeof value === 'string' ? value.trim() : ''
}

/** Backwards-compatible inbox name for the shared public-client guard. */
export function forbiddenInboxEnvKeys(env: Env): string[] {
  return forbiddenFirebaseEnvKeys(env)
}

export type InboxConfigResult =
  | { configured: true; config: InboxConfig }
  | { configured: false; missing: string[] }

export function readInboxConfig(env: Env): InboxConfigResult {
  assertPublicFirebaseEnv(env)
  const firebase = readFirebaseConfig(env)
  const inboxUid = text(env, 'VITE_ARGUS_INBOX_UID')
  const missing = [
    ...(!firebase.configured ? firebase.missing : []),
    ...(!inboxUid ? ['VITE_ARGUS_INBOX_UID'] : []),
  ]
  if (!firebase.configured || !inboxUid) return { configured: false, missing }

  return {
    configured: true,
    config: {
      firebase: firebase.config,
      authorizedUid: inboxUid,
    },
  }
}

export function inboxConfig(): InboxConfigResult {
  try {
    return readInboxConfig(import.meta.env as unknown as Env)
  } catch {
    // A misconfigured inbox must not take the whole authenticated app down. The
    // inbox reports itself unavailable while progress/auth use their own result.
    return { configured: false, missing: [...REQUIRED_INBOX_ENV] }
  }
}

/** The inbox path. One user, one collection, Firestore-generated ids. */
export function inboxCollectionPath(authorizedUid: string): string {
  return `users/${authorizedUid}/inbox`
}
