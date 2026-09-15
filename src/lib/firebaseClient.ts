import { firebaseConfig } from './firebaseConfig'

export type FirebaseModules = {
  app: typeof import('firebase/app')
  auth: typeof import('firebase/auth')
  firestore: typeof import('firebase/firestore')
}

export interface FirebaseServices {
  auth: ReturnType<FirebaseModules['auth']['getAuth']>
  db: ReturnType<FirebaseModules['firestore']['getFirestore']>
  authApi: FirebaseModules['auth']
  dbApi: FirebaseModules['firestore']
}

let modules: Promise<FirebaseModules> | null = null
let servicesPromise: Promise<FirebaseServices> | null = null

function loadFirebase(): Promise<FirebaseModules> {
  modules ??= Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore'),
  ]).then(([app, auth, firestore]) => ({ app, auth, firestore }))
  return modules
}

/**
 * One Firebase app/auth/firestore instance for the whole document.
 *
 * Auth persistence is made explicit because application entry now depends on
 * durable restoration. The content inbox consumes this same Auth instance; it
 * no longer owns a parallel session.
 */
export async function firebaseServices(): Promise<FirebaseServices> {
  if (servicesPromise) return servicesPromise

  servicesPromise = (async () => {
    const result = firebaseConfig()
    if (!result.configured) {
      throw new Error(`Firebase is not configured for this build (${result.missing.join(', ')}).`)
    }

    const { app, auth, firestore } = await loadFirebase()
    const existing = app.getApps()
    const instance = existing.length > 0 ? existing[0] : app.initializeApp(result.config)
    const authInstance = auth.getAuth(instance)
    await auth.setPersistence(authInstance, auth.browserLocalPersistence)

    return {
      auth: authInstance,
      db: firestore.getFirestore(instance),
      authApi: auth,
      dbApi: firestore,
    }
  })()

  return servicesPromise
}

/** Test-only seam used by the production-bundle Playwright suite. */
export function browserTestUid(): string | null {
  const raw = import.meta.env.VITE_ARGUS_TEST_AUTH_UID
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null
}
