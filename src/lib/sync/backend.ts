import type { RemoteRecord } from './plan'

export interface SyncUser {
  uid: string
  email: string | null
  displayName: string | null
}

export type Unsubscribe = () => void

/**
 * The sync boundary, stated as an interface so the store can be driven by a
 * fake in tests and the Firebase SDK stays behind one file.
 */
export interface SyncBackend {
  configured: boolean
  observeUser(listener: (user: SyncUser | null) => void): Unsubscribe
  signIn(): Promise<void>
  signOut(): Promise<void>
  /** Every synced topic, re-reported whenever any of them changes. */
  observeLibrary(
    uid: string,
    onRecords: (records: RemoteRecord[]) => void,
    onError: (error: string) => void,
  ): Unsubscribe
  /** `revision` is the next revision; the backend must compare-and-set it. */
  pushTopic(uid: string, topicId: string, json: string, revision: number): Promise<void>
  /** Delete only the exact revision the planner observed. */
  deleteTopic(uid: string, topicId: string, expectedRevision: number): Promise<void>
  /** Library-level state that belongs to no single topic. */
  observeMeta(
    uid: string,
    onMeta: (json: string | null) => void,
    onError: (error: string) => void,
  ): Unsubscribe
  pushMeta(uid: string, json: string, revision: number): Promise<void>
}

/** What the app uses when nothing is configured: sync is simply unavailable. */
export function unconfiguredSyncBackend(): SyncBackend {
  const noop = () => () => {}
  const refuse = async () => {
    throw new Error('Sync is not configured in this build.')
  }
  return {
    configured: false,
    observeUser: (listener) => {
      listener(null)
      return () => {}
    },
    signIn: refuse,
    signOut: refuse,
    observeLibrary: noop,
    pushTopic: refuse,
    deleteTopic: refuse,
    observeMeta: noop,
    pushMeta: refuse,
  }
}
