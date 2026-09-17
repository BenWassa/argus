import { libraryCollectionPath, libraryMetaPath, type FirebaseWebConfig } from './syncConfig'
import type { RemoteRecord } from './syncPlanner'
import type { SyncBackend, SyncUser, Unsubscribe } from './syncBackend'

/**
 * The Firebase boundary for sync. Everything the SDK touches lives in this one
 * file, and it is loaded dynamically so a build without sync configuration
 * never pays for it and never runs it — the same arrangement the inbox uses.
 */

type FirebaseModules = {
  app: typeof import('firebase/app')
  auth: typeof import('firebase/auth')
  firestore: typeof import('firebase/firestore')
}

let modules: Promise<FirebaseModules> | null = null

function loadFirebase(): Promise<FirebaseModules> {
  modules ??= Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
    import('firebase/firestore'),
  ]).then(([app, auth, firestore]) => ({ app, auth, firestore }))
  return modules
}

function toSyncUser(
  user: { uid: string; email: string | null; displayName: string | null } | null,
): SyncUser | null {
  if (!user) return null
  return { uid: user.uid, email: user.email, displayName: user.displayName }
}

export function firebaseSyncBackend(config: FirebaseWebConfig): SyncBackend {
  async function services() {
    const { app, auth, firestore } = await loadFirebase()
    // The inbox may already have initialized the one app this project needs.
    const existing = app.getApps()
    const instance = existing.length > 0 ? existing[0] : app.initializeApp(config)
    return {
      auth: auth.getAuth(instance),
      db: firestore.getFirestore(instance),
      authApi: auth,
      dbApi: firestore,
    }
  }

  /**
   * A dynamic import means every subscription is set up asynchronously, so each
   * one has to survive being torn down before it exists — and has to report a
   * failure to load rather than leaving the caller waiting forever.
   */
  function lazySubscription(
    start: (alive: () => boolean) => Promise<Unsubscribe | void>,
    onFailure: (error: unknown) => void,
  ): Unsubscribe {
    let cancelled = false
    let inner: Unsubscribe | void
    void start(() => !cancelled)
      .then((stop) => {
        inner = stop
        if (cancelled && typeof inner === 'function') inner()
      })
      .catch((error: unknown) => {
        if (!cancelled) onFailure(error)
      })
    return () => {
      cancelled = true
      if (typeof inner === 'function') inner()
    }
  }

  function message(error: unknown): string {
    if (typeof error === 'string') return error
    if (error && typeof error === 'object' && 'code' in error) return String(error.code)
    return error instanceof Error ? error.message : 'Sync failed.'
  }

  return {
    configured: true,

    observeUser(listener) {
      return lazySubscription(
        async (alive) => {
          const { auth, authApi } = await services()
          if (!alive()) return
          return authApi.onAuthStateChanged(auth, (user) => listener(toSyncUser(user)))
        },
        () => listener(null),
      )
    },

    async signIn() {
      const { auth, authApi } = await services()
      const provider = new authApi.GoogleAuthProvider()
      await authApi.signInWithPopup(auth, provider)
    },

    async signOut() {
      const { auth, authApi } = await services()
      await authApi.signOut(auth)
    },

    observeLibrary(uid, onRecords, onError) {
      return lazySubscription(async (alive) => {
        const { db, dbApi } = await services()
        if (!alive()) return
        return dbApi.onSnapshot(
          dbApi.collection(db, libraryCollectionPath(uid)),
          (snapshot) => {
            const records: RemoteRecord[] = []
            for (const document of snapshot.docs) {
              const data = document.data()
              if (typeof data.json !== 'string') continue
              const revision = typeof data.revision === 'number' ? data.revision : 0
              // `toMillis` is absent exactly while this device's own write is
              // still pending, which `planSync` treats as "not newer".
              const stamp = data.updatedAt as { toMillis?: () => number } | null | undefined
              records.push({
                topicId: document.id,
                json: data.json,
                revision,
                updatedAtMs: typeof stamp?.toMillis === 'function' ? stamp.toMillis() : null,
              })
            }
            onRecords(records)
          },
          (error) => onError(message(error)),
        )
      }, (error) => onError(message(error)))
    },

    async pushTopic(uid, topicId, json, revision) {
      const { db, dbApi } = await services()
      await dbApi.setDoc(dbApi.doc(db, `${libraryCollectionPath(uid)}/${topicId}`), {
        topicId,
        json,
        revision,
        // Server-controlled, and required to be exactly this by the rules, so a
        // device clock can never decide which of two writes was later.
        updatedAt: dbApi.serverTimestamp(),
      })
    },

    async deleteTopic(uid, topicId) {
      const { db, dbApi } = await services()
      await dbApi.deleteDoc(dbApi.doc(db, `${libraryCollectionPath(uid)}/${topicId}`))
    },

    observeMeta(uid, onMeta, onError) {
      return lazySubscription(async (alive) => {
        const { db, dbApi } = await services()
        if (!alive()) return
        return dbApi.onSnapshot(
          dbApi.doc(db, libraryMetaPath(uid)),
          (snapshot) => {
            const data = snapshot.data()
            onMeta(data && typeof data.json === 'string' ? data.json : null)
          },
          (error) => onError(message(error)),
        )
      }, (error) => onError(message(error)))
    },

    async pushMeta(uid, json, revision) {
      const { db, dbApi } = await services()
      await dbApi.setDoc(dbApi.doc(db, libraryMetaPath(uid)), {
        json,
        revision,
        updatedAt: dbApi.serverTimestamp(),
      })
    },
  }
}
