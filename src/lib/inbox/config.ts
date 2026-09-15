/**
 * Public Firebase web configuration shared by application auth, progress sync,
 * and the content inbox.
 *
 * Every value here ships to the browser. A Firebase web API key identifies the
 * project; it does not authorize access. Firestore Security Rules and Firebase
 * Auth are the trust boundary. No privileged credential may ever enter Vite.
 */

export interface FirebaseWebConfig {
  apiKey: string
  authDomain: string
  projectId: string
  appId: string
  storageBucket?: string
  messagingSenderId?: string
}

export interface InboxConfig {
  firebase: FirebaseWebConfig
  /** The sole Firebase UID the inbox and its Security Rules recognize. */
  authorizedUid: string
}

export const REQUIRED_FIREBASE_ENV = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const

export const REQUIRED_INBOX_ENV = [...REQUIRED_FIREBASE_ENV, 'VITE_ARGUS_INBOX_UID'] as const

/** Refused outright rather than trusted to be harmless. */
const FORBIDDEN_ENV_PATTERN = /(PRIVATE_KEY|SERVICE_ACCOUNT|CLIENT_SECRET|GITHUB_TOKEN|ADMIN_KEY)/i

type Env = Record<string, unknown>

function text(env: Env, key: string): string {
  const value = env[key]
  return typeof value === 'string' ? value.trim() : ''
}

export function forbiddenInboxEnvKeys(env: Env): string[] {
  return Object.keys(env)
    .filter((key) => key.startsWith('VITE_') && FORBIDDEN_ENV_PATTERN.test(key))
    .sort()
}

function assertPublicOnly(env: Env): void {
  const forbidden = forbiddenInboxEnvKeys(env)
  if (forbidden.length === 0) return
  throw new Error(
    `Refusing to configure Firebase: ${forbidden.join(', ')} would be inlined into the client bundle. Privileged credentials belong to server-side tooling, never to the app.`,
  )
}

export type FirebaseConfigResult =
  | { configured: true; config: FirebaseWebConfig }
  | { configured: false; missing: string[] }

export function readFirebaseConfig(env: Env): FirebaseConfigResult {
  assertPublicOnly(env)
  const missing = REQUIRED_FIREBASE_ENV.filter((key) => !text(env, key))
  if (missing.length > 0) return { configured: false, missing: [...missing] }

  return {
    configured: true,
    config: {
      apiKey: text(env, 'VITE_FIREBASE_API_KEY'),
      authDomain: text(env, 'VITE_FIREBASE_AUTH_DOMAIN'),
      projectId: text(env, 'VITE_FIREBASE_PROJECT_ID'),
      appId: text(env, 'VITE_FIREBASE_APP_ID'),
      ...(text(env, 'VITE_FIREBASE_STORAGE_BUCKET') ? { storageBucket: text(env, 'VITE_FIREBASE_STORAGE_BUCKET') } : {}),
      ...(text(env, 'VITE_FIREBASE_MESSAGING_SENDER_ID')
        ? { messagingSenderId: text(env, 'VITE_FIREBASE_MESSAGING_SENDER_ID') }
        : {}),
    },
  }
}

export function firebaseConfig(): FirebaseConfigResult {
  try {
    return readFirebaseConfig(import.meta.env as unknown as Env)
  } catch {
    return { configured: false, missing: [...REQUIRED_FIREBASE_ENV] }
  }
}

export type InboxConfigResult =
  | { configured: true; config: InboxConfig }
  | { configured: false; missing: string[] }

export function readInboxConfig(env: Env): InboxConfigResult {
  assertPublicOnly(env)
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
