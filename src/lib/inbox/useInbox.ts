import { useCallback, useEffect, useMemo, useState } from 'react'
import { inboxConfig } from './config'
import { describeInboxError, unavailableBackend, type InboxBackend, type InboxUser } from './backend'
import { pendingQueue, type CaptureDraft, type ContentRequest } from './model'
import { firebaseInboxBackend } from './firebaseBackend'

export type InboxStatus =
  /** No Firebase configuration in this build. Argus is unaffected. */
  | 'unconfigured'
  /** Configured, nobody signed in yet. First-use sign-in is offered. */
  | 'signed-out'
  /** Signed in as somebody the inbox does not recognize. */
  | 'unauthorized'
  | 'loading'
  | 'ready'

let shared: InboxBackend | null = null

/** One backend per document, so signing in once is enough. */
export function defaultInboxBackend(): InboxBackend {
  if (shared) return shared
  const result = inboxConfig()
  shared = result.configured ? firebaseInboxBackend(result.config) : unavailableBackend
  return shared
}

export interface InboxView {
  status: InboxStatus
  /** Pending requests only, newest first. Never topics. */
  requests: ContentRequest[]
  user: InboxUser | null
  /** A queue-level failure, such as losing the connection while listening. */
  error: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  addRequest: (draft: CaptureDraft) => Promise<void>
  deleteRequest: (id: string) => Promise<void>
}

export function useInbox(backend: InboxBackend = defaultInboxBackend()): InboxView {
  const [user, setUser] = useState<InboxUser | null>(null)
  const [known, setKnown] = useState(!backend.configured)
  const [requests, setRequests] = useState<ContentRequest[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return backend.observeUser((next) => {
      setUser(next)
      setKnown(true)
    })
  }, [backend])

  const authorized = user !== null && backend.authorizedUid !== null && user.uid === backend.authorizedUid

  useEffect(() => {
    if (!authorized) {
      setRequests(null)
      return
    }
    setError(null)
    return backend.observeRequests(
      (next) => {
        setRequests(next)
        setError(null)
      },
      (failure) => {
        setError(describeInboxError(typeof failure === 'string' ? { code: failure } : failure))
        // Stop reporting the queue as still loading. An empty list under a
        // visible error is honest; a spinner that never resolves is not.
        setRequests((current) => current ?? [])
      },
    )
  }, [backend, authorized])

  const status: InboxStatus = !backend.configured
    ? 'unconfigured'
    : !known
      ? 'loading'
      : user === null
        ? 'signed-out'
        : !authorized
          ? 'unauthorized'
          : requests === null
            ? 'loading'
            : 'ready'

  const signIn = useCallback(async () => {
    await backend.signIn()
  }, [backend])

  const signOut = useCallback(async () => {
    await backend.signOut()
  }, [backend])

  const addRequest = useCallback(
    async (draft: CaptureDraft) => {
      // Deliberately rethrows. The capture sheet owns the only copy of the
      // typed text and has to know the write did not land.
      await backend.addRequest(draft)
    },
    [backend],
  )

  const deleteRequest = useCallback(
    async (id: string) => {
      await backend.deleteRequest(id)
    },
    [backend],
  )

  const pending = useMemo(() => pendingQueue(requests ?? []), [requests])

  return { status, requests: pending, user, error, signIn, signOut, addRequest, deleteRequest }
}
