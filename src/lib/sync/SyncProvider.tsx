import { createContext, useContext, type ReactNode } from 'react'
import { useLibrary } from '../store'
import { useSync, type SyncState } from './useSync'
import type { SyncBackend } from './backend'

/**
 * Sync runs for as long as the app does, not for as long as its settings screen
 * is open.
 *
 * The screen that offers signing in and out is a Library utility reached a
 * handful of times a year, so driving sync from that component would mean a
 * device only caught up with its siblings while somebody happened to be looking
 * at the Data page. The work belongs at the root; the page only reports it.
 */

interface SyncContext {
  state: SyncState
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const Ctx = createContext<SyncContext | null>(null)

/**
 * `backend` is an injection point for tests. In the app it is omitted and the
 * real one is built from configuration; nothing in production passes it.
 */
export function SyncProvider({
  children,
  backend,
}: {
  children: ReactNode
  backend?: SyncBackend
}) {
  const store = useLibrary()
  const sync = useSync(store, backend)
  return <Ctx.Provider value={sync}>{children}</Ctx.Provider>
}

export function useSyncState(): SyncContext {
  const sync = useContext(Ctx)
  if (!sync) throw new Error('useSyncState must be used inside SyncProvider')
  return sync
}
