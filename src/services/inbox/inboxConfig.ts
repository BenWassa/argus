/**
 * Inbox configuration.
 *
 * Every value here is public web configuration: a Firebase web API key, the
 * project it addresses, and the one Firebase UID allowed to use the inbox. None
 * of it is a credential. A Firebase web API key identifies a project, it does
 * not authorize anything — Firestore Security Rules are the trust boundary, and
 * the authorized UID is an identity, not a secret.
 *
 * Nothing privileged may ever be read here. No service-account key, no Firebase
 * Admin credential and no GitHub token belongs in a `VITE_` variable, because
 * everything Vite inlines ships to the browser. `inbox/boundary.test.ts` holds
 * the client source to that rule.
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

export const REQUIRED_INBOX_ENV = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
  'VITE_ARGUS_INBOX_UID',
] as const

/** Refused outright rather than trusted to be harmless. */
const FORBIDDEN_ENV_PATTERN = /(PRIVATE_KEY|SERVICE_ACCOUNT|CLIENT_SECRET|GITHUB_TOKEN|ADMIN_KEY)/i

export type InboxConfigResult =
  | { configured: true; config: InboxConfig }
  | { configured: false; missing: string[] }

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

export function readInboxConfig(env: Env): InboxConfigResult {
  const forbidden = forbiddenInboxEnvKeys(env)
  if (forbidden.length > 0) {
    // Fail loudly rather than silently shipping a build that may carry a
    // privileged value into the browser bundle.
    throw new Error(
      `Refusing to configure the content inbox: ${forbidden.join(', ')} would be inlined into the client bundle. Privileged credentials belong to the maintainer ingestion path, never to the app.`,
    )
  }

  const missing = REQUIRED_INBOX_ENV.filter((key) => !text(env, key))
  if (missing.length > 0) return { configured: false, missing: [...missing] }

  return {
    configured: true,
    config: {
      firebase: {
        apiKey: text(env, 'VITE_FIREBASE_API_KEY'),
        authDomain: text(env, 'VITE_FIREBASE_AUTH_DOMAIN'),
        projectId: text(env, 'VITE_FIREBASE_PROJECT_ID'),
        appId: text(env, 'VITE_FIREBASE_APP_ID'),
        ...(text(env, 'VITE_FIREBASE_STORAGE_BUCKET') ? { storageBucket: text(env, 'VITE_FIREBASE_STORAGE_BUCKET') } : {}),
        ...(text(env, 'VITE_FIREBASE_MESSAGING_SENDER_ID')
          ? { messagingSenderId: text(env, 'VITE_FIREBASE_MESSAGING_SENDER_ID') }
          : {}),
      },
      authorizedUid: text(env, 'VITE_ARGUS_INBOX_UID'),
    },
  }
}

export function inboxConfig(): InboxConfigResult {
  try {
    return readInboxConfig(import.meta.env as unknown as Env)
  } catch {
    // A misconfigured build must not take the whole app down with it. The
    // inbox reports itself unavailable and Argus stays entirely usable.
    return { configured: false, missing: [...REQUIRED_INBOX_ENV] }
  }
}

/** The inbox path. One user, one collection, Firestore-generated ids. */
export function inboxCollectionPath(authorizedUid: string): string {
  return `users/${authorizedUid}/inbox`
}
