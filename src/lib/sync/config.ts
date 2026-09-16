/**
 * Sync configuration.
 *
 * The same public Firebase web configuration the inbox reads, minus the one
 * thing the inbox additionally needs. The inbox pins a single authorized UID
 * because its Security Rules used to name one; sync does not, because the rules
 * now identify the owner by their verified address and key every path by
 * `request.auth.uid`. Whoever is signed in owns the subtree they write to, and
 * the rules decide whether that is anybody at all.
 *
 * Nothing privileged may ever be read here. No service-account key, no Firebase
 * Admin credential and no GitHub token belongs in a `VITE_` variable, because
 * everything Vite inlines ships to the browser.
 *
 * The inbox reads the same four variables and refuses the same privileged ones,
 * and this module deliberately restates both rather than importing them. The
 * inbox is a sealed boundary — `inbox/boundary.test.ts` asserts that nothing
 * under `src/lib` imports it, so that a remote capture path can never become
 * reachable from the learning model. Sharing a type through it would be exactly
 * the edge that test exists to forbid. `config.test.ts` holds the two
 * definitions in step instead, the same way the inbox's track vocabulary is
 * held in step with the library's without importing it.
 */

export interface FirebaseWebConfig {
  apiKey: string
  authDomain: string
  projectId: string
  appId: string
  storageBucket?: string
  messagingSenderId?: string
}

/** Refused outright rather than trusted to be harmless. */
const FORBIDDEN_ENV_PATTERN = /(PRIVATE_KEY|SERVICE_ACCOUNT|CLIENT_SECRET|GITHUB_TOKEN|ADMIN_KEY)/i

export function forbiddenSyncEnvKeys(env: Record<string, unknown>): string[] {
  return Object.keys(env)
    .filter((key) => key.startsWith('VITE_') && FORBIDDEN_ENV_PATTERN.test(key))
    .sort()
}

export const REQUIRED_SYNC_ENV = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const

export type SyncConfigResult =
  | { configured: true; config: FirebaseWebConfig }
  | { configured: false; missing: string[] }

type Env = Record<string, unknown>

function text(env: Env, key: string): string {
  const value = env[key]
  return typeof value === 'string' ? value.trim() : ''
}

export function readSyncConfig(env: Env): SyncConfigResult {
  const forbidden = forbiddenSyncEnvKeys(env)
  if (forbidden.length > 0) {
    throw new Error(
      `Refusing to configure sync: ${forbidden.join(', ')} would be inlined into the client bundle. Privileged credentials never belong to the app.`,
    )
  }

  const missing = REQUIRED_SYNC_ENV.filter((key) => !text(env, key))
  if (missing.length > 0) return { configured: false, missing: [...missing] }

  return {
    configured: true,
    config: {
      apiKey: text(env, 'VITE_FIREBASE_API_KEY'),
      authDomain: text(env, 'VITE_FIREBASE_AUTH_DOMAIN'),
      projectId: text(env, 'VITE_FIREBASE_PROJECT_ID'),
      appId: text(env, 'VITE_FIREBASE_APP_ID'),
      ...(text(env, 'VITE_FIREBASE_STORAGE_BUCKET')
        ? { storageBucket: text(env, 'VITE_FIREBASE_STORAGE_BUCKET') }
        : {}),
      ...(text(env, 'VITE_FIREBASE_MESSAGING_SENDER_ID')
        ? { messagingSenderId: text(env, 'VITE_FIREBASE_MESSAGING_SENDER_ID') }
        : {}),
    },
  }
}

export function syncConfig(): SyncConfigResult {
  try {
    return readSyncConfig(import.meta.env as unknown as Env)
  } catch {
    // A misconfigured build must not take the whole app down with it. Sync
    // reports itself unavailable and Argus stays entirely usable offline.
    return { configured: false, missing: [...REQUIRED_SYNC_ENV] }
  }
}

/** One document per topic, so two devices editing different topics do not collide. */
export function libraryCollectionPath(uid: string): string {
  return `users/${uid}/library`
}

/** Library-level state that belongs to no single topic. */
export function libraryMetaPath(uid: string): string {
  return `users/${uid}/libraryMeta/library`
}
