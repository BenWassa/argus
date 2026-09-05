import type { CaptureDraft, ContentRequest } from './model'

export interface InboxUser {
  uid: string
  email: string | null
  displayName: string | null
}

export type Unsubscribe = () => void

/**
 * Everything the app is allowed to do to the content inbox.
 *
 * Narrow on purpose: read the queue, add one request, delete one pending
 * request, and sign in to do any of it. There is no update path in the client
 * at all — marking a request `added` is an ingestion act performed after a
 * topic has actually shipped, with credentials that never enter the browser.
 */
export interface InboxBackend {
  readonly configured: boolean
  /** The UID Security Rules recognize, when the build is configured for one. */
  readonly authorizedUid: string | null
  observeUser(listener: (user: InboxUser | null) => void): Unsubscribe
  signIn(): Promise<void>
  signOut(): Promise<void>
  observeRequests(
    onRequests: (requests: ContentRequest[]) => void,
    onError: (error: string) => void,
  ): Unsubscribe
  addRequest(draft: CaptureDraft): Promise<void>
  deleteRequest(id: string): Promise<void>
}

export const INBOX_UNCONFIGURED =
  'The content inbox is not configured for this build. Argus works normally without it.'

/**
 * The backend a build without Firebase configuration gets. Capture is offered
 * as unavailable rather than broken, and every learning surface is untouched:
 * the inbox failing is never allowed to be an Argus failure.
 */
export const unavailableBackend: InboxBackend = {
  configured: false,
  authorizedUid: null,
  observeUser(listener) {
    listener(null)
    return () => {}
  },
  async signIn() {
    throw new Error(INBOX_UNCONFIGURED)
  },
  async signOut() {},
  observeRequests(onRequests) {
    onRequests([])
    return () => {}
  },
  async addRequest() {
    throw new Error(INBOX_UNCONFIGURED)
  },
  async deleteRequest() {
    throw new Error(INBOX_UNCONFIGURED)
  },
}

/**
 * Human wording for the failures capture can actually hit. The point of every
 * one of them is the same: say what happened, and keep the typed text.
 */
export function describeInboxError(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : ''

  if (code.includes('permission-denied') || code.includes('unauthorized')) {
    return 'This account is not the one the inbox allows. Nothing was sent.'
  }
  if (code.includes('unavailable') || code.includes('network')) {
    return 'The inbox could not be reached. Your text is still here — try again.'
  }
  if (code.includes('popup-blocked')) {
    return 'The sign-in window was blocked by the browser. Allow pop-ups for Argus and try again.'
  }
  if (code.includes('popup-closed') || code.includes('cancelled-popup')) {
    return 'Sign-in was closed before it finished.'
  }
  if (error instanceof Error && error.message) return error.message
  return 'Something went wrong reaching the inbox. Your text is still here — try again.'
}
