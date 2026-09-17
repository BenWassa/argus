import type { ReactNode } from 'react'
import { LibraryProvider } from '../lib/LibraryProvider'
import { SyncProvider } from '../lib/sync/SyncProvider'

/**
 * The provider stack, in the one order that works: the library is local and
 * always present, and sync observes it, so it must be able to read the library
 * it is syncing.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <LibraryProvider>
      <SyncProvider>{children}</SyncProvider>
    </LibraryProvider>
  )
}
