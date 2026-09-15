import type { ContentRequest } from '../../lib/inbox/model'
import type { InboxStatus } from '../../lib/inbox/useInbox'

interface WantToLearnProps {
  status: InboxStatus
  requests: ContentRequest[]
  error: string | null
  /** Retained in the component contract while callers migrate; app auth owns sign-in. */
  onSignIn: () => void
  onRemove: (request: ContentRequest) => void
  removing: string | null
}

/** The pending capture queue, semantically separate from learner topics. */
export function WantToLearn({
  status,
  requests,
  error,
  onSignIn: _onSignIn,
  onRemove,
  removing,
}: WantToLearnProps) {
  if (status === 'unconfigured') return null

  return (
    <section className="want" aria-labelledby="want-heading">
      <h2 className="want-head" id="want-heading">
        Want to learn
        {status === 'ready' && requests.length > 0 && (
          <span className="want-count tabular">{requests.length}</span>
        )}
      </h2>

      {status === 'loading' && <p className="note">Checking the inbox…</p>}

      {status === 'signed-out' && (
        <p className="note">
          The inbox is waiting for the application account session. Sign-in is managed at Argus entry.
        </p>
      )}

      {status === 'unauthorized' && (
        <p className="note">
          This signed-in account does not own the configured content inbox. Learner progress remains isolated to this account.
        </p>
      )}

      {status === 'ready' && requests.length === 0 && (
        <p className="note">Nothing captured yet. Use “Want to learn” when something occurs to you.</p>
      )}

      {status === 'ready' && requests.length > 0 && (
        <ul className="want-list">
          {requests.map((request) => (
            <li className="want-entry" key={request.id}>
              <p className="want-text">{request.text}</p>
              <div className="want-meta">
                {request.trackHint && <span className="want-hint">{request.trackHint}</span>}
                {!request.createdAt && <span className="want-hint">saving…</span>}
              </div>
              <button
                className="ghost icon want-remove"
                type="button"
                disabled={removing === request.id}
                aria-label={`Remove request: ${request.text}`}
                onClick={() => onRemove(request)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="error" role="status">{error}</p>}
    </section>
  )
}
