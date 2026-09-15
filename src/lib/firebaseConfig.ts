/** Public Firebase web configuration shared by auth, progress and inbox. */
export interface FirebaseWebConfig {
  apiKey: string
  authDomain: string
  projectId: string
  appId: string
  storageBucket?: string
  messagingSenderId?: string
}

export const REQUIRED_FIREBASE_ENV = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const

const FORBIDDEN_ENV_PATTERN = /(PRIVATE_KEY|SERVICE_ACCOUNT|CLIENT_SECRET|GITHUB_TOKEN|ADMIN_KEY)/i

type Env = Record<string, unknown>

function text(env: Env, key: string): string {
  const value = env[key]
  return typeof value === 'string' ? value.trim() : ''
}

export function forbiddenFirebaseEnvKeys(env: Env): string[] {
  return Object.keys(env)
    .filter((key) => key.startsWith('VITE_') && FORBIDDEN_ENV_PATTERN.test(key))
    .sort()
}

export function assertPublicFirebaseEnv(env: Env): void {
  const forbidden = forbiddenFirebaseEnvKeys(env)
  if (forbidden.length === 0) return
  throw new Error(
    `Refusing to configure Firebase: ${forbidden.join(', ')} would be inlined into the client bundle. Privileged credentials belong to server-side tooling, never to the app.`,
  )
}

export type FirebaseConfigResult =
  | { configured: true; config: FirebaseWebConfig }
  | { configured: false; missing: string[] }

export function readFirebaseConfig(env: Env): FirebaseConfigResult {
  assertPublicFirebaseEnv(env)
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
