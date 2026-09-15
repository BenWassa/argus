import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useLibrary } from './store'
import {
  preserveRecovery,
  reconcileLibraryCopies,
  recoveryEntryCount,
  resolveProgressConflict,
  sameLibrary,
  synchronizeProgress,
  writeUserCache,
  type LibraryConflict,
  type ProgressCloud,
  type SyncMetadata,
} from './progressSync'

export type ProgressSyncStatus = 'synced' | 'pending' | 'offline' | 'conflict' | 'error'

export interface ProgressSyncView {
  status: ProgressSyncStatus
  error: string | null
  conflict: LibraryConflict | null
  recoveryCount: number
  retry: () => void
  resolveConflict: (choice: 'local' | 'cloud') => Promise<void>
  preserveBeforeChange: (reason: string) => void
}

const SyncCtx = createContext<ProgressSyncView | null>(null)

function syncError(error: unknown): { status: 'offline' | 'error'; message: string } {
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code: unknown }).code)
    : ''
  if (!navigator.onLine || code.includes('unavailable') || code.includes('network') || code.includes('offline')) {
    return { status: 'offline', message: 'Cloud backup is offline. Changes are saved on this device and will retry on reconnect.' }
  }
  return {
    status: 'error',
    message: error instanceof Error ? error.message : 'Cloud backup could not be updated. The device copy is preserved.',
  }
}

interface ProgressSyncBridgeProps {
  uid: string
  initialMetadata: SyncMetadata
  initialConnectivity: 'online' | 'offline'
  cloud: ProgressCloud
  children: ReactNode
}

/**
 * Local-first write bridge. React state is the immediate live record; every
 * change is synchronously copied into the UID-scoped cache, then a coalesced
 * cloud pass reconciles/revisions it. A failed network write never rolls local
 * learning back.
 */
export function ProgressSyncBridge({
  uid,
  initialMetadata,
  initialConnectivity,
  cloud,
  children,
}: ProgressSyncBridgeProps) {
  const { library, replaceLibrary } = useLibrary()
  const libraryRef = useRef(library)
  const metadataRef = useRef(initialMetadata)
  const timer = useRef<number | null>(null)
  const inFlight = useRef(false)
  const rerun = useRef(false)
  const [status, setStatus] = useState<ProgressSyncStatus>(
    initialConnectivity === 'offline' ? 'offline' : 'synced',
  )
  const [error, setError] = useState<string | null>(
    initialConnectivity === 'offline'
      ? 'Cloud backup is offline. The validated account cache is available on this device.'
      : null,
  )
  const [activeConflict, setActiveConflict] = useState<LibraryConflict | null>(null)
  const [recoveryCount, setRecoveryCount] = useState(() => recoveryEntryCount(uid))

  libraryRef.current = library

  const runSync = useCallback(async () => {
    if (activeConflict) return
    if (inFlight.current) {
      rerun.current = true
      return
    }

    inFlight.current = true
    rerun.current = false
    const startedLibrary = libraryRef.current
    const startedMetadata = metadataRef.current
    setStatus('pending')
    setError(null)

    try {
      const result = await synchronizeProgress(uid, startedLibrary, startedMetadata, cloud)
      if (result.kind === 'conflict') {
        setActiveConflict({ ...result.conflict, local: libraryRef.current })
        setStatus('conflict')
        setError('This device and the cloud changed the same learner record. Neither copy was overwritten.')
        return
      }

      metadataRef.current = result.metadata
      let nextLibrary = result.library
      const current = libraryRef.current

      if (!sameLibrary(current, startedLibrary)) {
        // The learner answered while a cloud pass was running. Compose that
        // later local work over the just-reconciled cloud result using the exact
        // pre-flight library as the shared ancestor.
        const composed = reconcileLibraryCopies(current, result.library, startedLibrary)
        if (composed.kind === 'conflict') {
          const conflict: LibraryConflict = {
            reason: 'divergent-topics',
            topicIds: composed.topicIds,
            local: current,
            cloud: result.library,
            cloudRevision: result.metadata.revision,
            metadata: result.metadata,
          }
          setActiveConflict(conflict)
          setStatus('conflict')
          setError('A learner record changed locally while a conflicting cloud change arrived. Neither copy was overwritten.')
          return
        }
        nextLibrary = composed.library
      }

      writeUserCache(uid, nextLibrary, result.metadata)
      if (!sameLibrary(nextLibrary, current)) replaceLibrary(nextLibrary)

      if (sameLibrary(nextLibrary, result.metadata.base ?? nextLibrary)) {
        setStatus('synced')
        setError(null)
      } else {
        // A local change happened during the pass. It is already cached; run
        // one more coalesced pass against the new cloud base.
        setStatus('pending')
        rerun.current = true
      }
    } catch (failure) {
      const described = syncError(failure)
      setStatus(described.status)
      setError(described.message)
    } finally {
      inFlight.current = false
      if (rerun.current && !activeConflict) {
        rerun.current = false
        window.setTimeout(() => void runSync(), 0)
      }
    }
  }, [activeConflict, cloud, replaceLibrary, uid])

  useEffect(() => {
    // Device durability is immediate and independent of cloud availability.
    writeUserCache(uid, library, metadataRef.current)
    if (activeConflict) return

    if (sameLibrary(library, metadataRef.current.base ?? library)) {
      if (initialConnectivity === 'online') {
        setStatus((current) => (current === 'error' || current === 'offline' ? current : 'synced'))
      }
      return
    }

    setStatus('pending')
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void runSync(), 650)
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    }
  }, [activeConflict, initialConnectivity, library, runSync, uid])

  useEffect(() => {
    const reconnect = () => void runSync()
    window.addEventListener('online', reconnect)
    return () => window.removeEventListener('online', reconnect)
  }, [runSync])

  const retry = useCallback(() => {
    if (activeConflict) return
    void runSync()
  }, [activeConflict, runSync])

  const preserveBeforeChange = useCallback((reason: string) => {
    preserveRecovery(uid, reason, JSON.stringify(libraryRef.current))
    setRecoveryCount(recoveryEntryCount(uid))
  }, [uid])

  const resolveConflict = useCallback(async (choice: 'local' | 'cloud') => {
    if (!activeConflict) return
    setStatus('pending')
    setError(null)
    try {
      const currentConflict = { ...activeConflict, local: libraryRef.current }
      const resolved = await resolveProgressConflict(uid, choice, currentConflict, cloud)
      metadataRef.current = resolved.metadata
      writeUserCache(uid, resolved.library, resolved.metadata)
      setActiveConflict(null)
      setRecoveryCount(recoveryEntryCount(uid))
      if (!sameLibrary(resolved.library, libraryRef.current)) replaceLibrary(resolved.library)
      setStatus('synced')
    } catch (failure) {
      const described = syncError(failure)
      setStatus(described.status)
      setError(described.message)
    }
  }, [activeConflict, cloud, replaceLibrary, uid])

  const value = useMemo<ProgressSyncView>(
    () => ({
      status,
      error,
      conflict: activeConflict,
      recoveryCount,
      retry,
      resolveConflict,
      preserveBeforeChange,
    }),
    [activeConflict, error, preserveBeforeChange, recoveryCount, resolveConflict, retry, status],
  )

  return <SyncCtx.Provider value={value}>{children}</SyncCtx.Provider>
}

export function useProgressSync(): ProgressSyncView | null {
  return useContext(SyncCtx)
}
