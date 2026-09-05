import { inboxCollectionPath, type InboxConfig } from './config'
import { parseContentRequest, pendingRequestFields, type CaptureDraft, type ContentRequest } from './model'
import type { InboxBackend, InboxUser, Unsubscribe } from './backend'

/**
 * The Firebase boundary. Everything the SDK touches lives in this one file, and
 * it is loaded dynamically so a build without inbox configuration never pays
 * for it and never runs it.
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

function toInboxUser(user: { uid: string; email: string | null; displayName: string | null } | null): InboxUser | null {
  if (!user) return null
  return { uid: user.uid, email: user.email, displayName: user.displayName }
}

export function firebaseInboxBackend(config: InboxConfig): InboxBackend {
  const path = inboxCollectionPath(config.authorizedUid)

  async function services() {
    const { app, auth, firestore } = await loadFirebase()
    const existing = app.getApps()
    const instance = existing.length > 0 ? existing[0] : app.initializeApp(config.firebase)
    return {
      auth: auth.getAuth(instance),
      db: firestore.getFirestore(instance),
      authApi: auth,
      dbApi: firestore,
    }
  }

  /**
   * A dynamic import means every subscription is set up asynchronously, so each
   * one has to survive being torn down before it exists.
   */
  function lazySubscription(start: (alive: () => boolean) => Promise<Unsubscribe | void>): Unsubscribe {
    let cancelled = false
    let inner: Unsubscribe | void
    void start(() => !cancelled).then((stop) => {
      inner = stop
      if (cancelled && typeof inner === 'function') inner()
    })
    return () => {
      cancelled = true
      if (typeof inner === 'function') inner()
    }
  }

  return {
    configured: true,
    authorizedUid: config.authorizedUid,

    observeUser(listener) {
      return lazySubscription(async (alive) => {
        const { auth, authApi } = await services()
        if (!alive()) return
        return authApi.onAuthStateChanged(auth, (user) => listener(toInboxUser(user)))
      })
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

    observeRequests(onRequests, onError) {
      return lazySubscription(async (alive) => {
        const { db, dbApi } = await services()
        if (!alive()) return
        const collection = dbApi.collection(db, path)
        return dbApi.onSnapshot(
          collection,
          (snapshot) => {
            const requests: ContentRequest[] = []
            for (const document of snapshot.docs) {
              const parsed = parseContentRequest(document.id, document.data())
              if (parsed) requests.push(parsed)
            }
            onRequests(requests)
          },
          (error) => onError(error.code ?? error.message),
        )
      })
    },

    async addRequest(draft: CaptureDraft) {
      const { db, dbApi } = await services()
      await dbApi.addDoc(dbApi.collection(db, path), {
        ...pendingRequestFields(draft),
        // Server-controlled, and required to be exactly this by the rules, so a
        // client clock can never decide when a request was captured.
        createdAt: dbApi.serverTimestamp(),
      })
    },

    async deleteRequest(id: string) {
      const { db, dbApi } = await services()
      await dbApi.deleteDoc(dbApi.doc(db, `${path}/${id}`))
    },
  }
}
