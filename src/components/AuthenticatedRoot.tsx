import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { ArgusUser } from '../lib/auth'
import { defaultProgressCloud } from '../lib/progressCloud'
import {
  bootstrapProgress,
  resolveProgressConflict,
  type BootstrapResult,
} from '../lib/progressSync'
import { ProgressSyncBridge } from '../lib/progressSyncReact'
import { LibraryProvider } from '../lib/store'
import { AuthEntry } from './AuthEntry'

interface AuthenticatedRootProps {
  user: ArgusUser
  onSignOut: () => void
  children: ReactNode
}

export function AuthenticatedRoot({ user, onSignOut, children }: AuthenticatedRootProps) {
  const cloud = useMemo(defaultProgressCloud, [])
  const [generation, setGeneration] = useState(0)
  const [state, setState] = useState<BootstrapResult | { kind: 'loading' }>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    setState({ kind: 'loading' })
    void bootstrapProgress(user.uid, cloud).then((result) => {
      if (!cancelled) setState(result)
    })
    return () => {
      cancelled = true
    }
  }, [cloud, generation, user.uid])

  if (state.kind === 'loading') return <AuthEntry state="loading" />

  if (state.kind === 'error') {
    return (
      <AuthEntry
        state="error"
        message={state.error}
        onRetry={() => setGeneration((value) => value + 1)}
        onSignOut={onSignOut}
      />
    )
  }

  if (state.kind === 'conflict') {
    const choose = (choice: 'local' | 'cloud') => {
      setState({ kind: 'loading' })
      void resolveProgressConflict(user.uid, choice, state.conflict, cloud)
        .then((resolved) => setState(resolved))
        .catch((error: unknown) => {
          setState({
            kind: 'error',
            error: error instanceof Error ? error.message : 'The learner-library conflict could not be resolved.',
          })
        })
    }

    return (
      <AuthEntry
        state="conflict"
        conflictTopics={state.conflict.topicIds}
        onUseDevice={() => choose('local')}
        onUseCloud={state.conflict.cloud ? () => choose('cloud') : undefined}
        onSignOut={onSignOut}
      />
    )
  }

  return (
    <LibraryProvider
      key={`${user.uid}-${state.metadata.revision}`}
      initial={{ library: state.library, report: state.report }}
      persistLegacy={false}
    >
      <ProgressSyncBridge
        uid={user.uid}
        initialMetadata={state.metadata}
        initialConnectivity={state.connectivity}
        cloud={cloud}
      >
        {children}
      </ProgressSyncBridge>
    </LibraryProvider>
  )
}
