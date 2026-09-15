import './AuthEntry.css'

interface AuthEntryProps {
  state: 'loading' | 'signed-out' | 'error' | 'conflict'
  message?: string | null
  conflictTopics?: string[]
  onSignIn?: () => void
  onRetry?: () => void
  onUseDevice?: () => void
  onUseCloud?: () => void
  onSignOut?: () => void
}

/** Authentication/progress bootstrap is the application entry boundary. */
export function AuthEntry({
  state,
  message,
  conflictTopics = [],
  onSignIn,
  onRetry,
  onUseDevice,
  onUseCloud,
  onSignOut,
}: AuthEntryProps) {
  return (
    <main className="auth-entry" id="main" tabIndex={-1}>
      <div className="auth-entry-mark" aria-hidden="true">A</div>
      <h1>Argus</h1>

      {state === 'loading' && (
        <p className="auth-entry-note" role="status" aria-live="polite">
          Restoring your account and learner library…
        </p>
      )}

      {state === 'signed-out' && (
        <>
          <p className="auth-entry-note">Sign in to restore and protect your learner progress.</p>
          <button type="button" onClick={onSignIn}>Continue with Google</button>
        </>
      )}

      {state === 'error' && (
        <>
          <p className="error auth-entry-note" role="alert">{message ?? 'Argus could not restore the learner library.'}</p>
          <div className="actions start auth-entry-actions">
            <button type="button" onClick={onRetry}>Retry</button>
            {onSignOut && <button className="quiet" type="button" onClick={onSignOut}>Sign out</button>}
          </div>
        </>
      )}

      {state === 'conflict' && (
        <>
          <p className="auth-entry-note" role="alert">
            This device and the cloud contain incompatible changes. Argus stopped before replacing either copy.
          </p>
          {conflictTopics.length > 0 && (
            <p className="note auth-entry-detail">
              Conflicting {conflictTopics.length === 1 ? 'topic' : 'topics'}: {conflictTopics.join(', ')}
            </p>
          )}
          <p className="note auth-entry-detail">
            Choosing a copy preserves the other one in this device’s recovery storage first.
          </p>
          <div className="actions start auth-entry-actions">
            <button type="button" onClick={onUseDevice}>Keep this device</button>
            {onUseCloud && <button className="ghost" type="button" onClick={onUseCloud}>Use cloud copy</button>}
            {onSignOut && <button className="quiet" type="button" onClick={onSignOut}>Sign out</button>}
          </div>
        </>
      )}
    </main>
  )
}
