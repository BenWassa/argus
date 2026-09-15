import { firebaseServices } from '../firebaseClient'
import { inboxCollectionPath, type InboxConfig } from './config'
import { parseContentRequest, pendingRequestFields, type CaptureDraft, type ContentRequest } from './model'
import type { InboxBackend, InboxUser, Unsubscribe } from './backend'

function toInboxUser(user: { uid: string; email: string | null; displayName: string | null } | null): InboxUser | null {
  if (!user) return null
  return { uid: user.uid, email: user.email, displayName: user.displayName }
}

/**
 * Firestore inbox adapter. Firebase Auth itself is application-level now: this
 * adapter observes and, for backwards-compatible tests, can act on the exact
 * same Auth instance used by the entry gate. Library UI no longer presents a
 * separate inbox sign-in surface.
 */
export function firebaseInboxBackend(config: InboxConfig): InboxBackend {
  const path = inboxCollectionPath(config.authorizedUid)

  /**
   * A dynamic Firebase boundary means every subscription starts
   * asynchronously, so it must survive teardown before the SDK has loaded.
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

  return {
    configured: true,
    authorizedUid: config.authorizedUid,

    observeUser(listener) {
      return lazySubscription(
        async (alive) => {
          const { auth, authApi } = await firebaseServices()
          if (!alive()) return
          return authApi.onAuthStateChanged(auth, (user) => listener(toInboxUser(user)))
        },
        () => listener(null),
      )
    },

    async signIn() {
      const { auth, authApi } = await firebaseServices()
      const provider = new authApi.GoogleAuthProvider()
      await authApi.signInWithPopup(auth, provider)
    },

    async signOut() {
      const { auth, authApi } = await firebaseServices()
      await authApi.signOut(auth)
    },

    observeRequests(onRequests, onError) {
      return lazySubscription(async (alive) => {
        const { db, dbApi } = await firebaseServices()
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
      }, onError)
    },

    async addRequest(draft: CaptureDraft) {
      const { db, dbApi } = await firebaseServices()
      await dbApi.addDoc(dbApi.collection(db, path), {
        ...pendingRequestFields(draft),
        createdAt: dbApi.serverTimestamp(),
      })
    },

    async deleteRequest(id: string) {
      const { db, dbApi } = await firebaseServices()
      await dbApi.deleteDoc(dbApi.doc(db, `${path}/${id}`))
    },
  }
}
