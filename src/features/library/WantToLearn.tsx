import type { ContentRequest } from '../../lib/inbox/model'
import type { InboxStatus } from '../../lib/inbox/useInbox'

interface WantToLearnProps {
  status: InboxStatus
  requests: ContentRequest[]
  error: string | null
  onSignIn: () => void
  onRemove: (request: ContentRequest) => void
  /** Set while a specific request is being deleted. */
  removing: string | null
}

/**
 * The pending capture queue.
 *
 * Everything about this section is deliberately unlike a topic row: no track
 * chip, no item count, no schedule line, no shelf, no action to run it. It
 * cannot be started, tested, completed or counted, because a request has no
 * boundary to finish. It is a list of things to research later, and it is
 * rendered outside the shelves so it can never be mistaken for the library.
 */
export function WantToLearn({
  status,
  requests,
  error,
  onSignIn,
  onRemove,
  removing,
}: WantToLearnProps) {
  // A build without inbox configuration says nothing at all. Argus is not
  // diminished by a cloud service it was never given.
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
        <div className="want-setup">
          <p className="note">
            Capture ideas here and turn them into researched topics later. It needs a one-time
            sign-in; your library and its history stay on this device either way.
          </p>
          <button className="ghost" type="button" onClick={onSignIn}>
            Sign in to the inbox
          </button>
        </div>
      )}

      {status === 'unauthorized' && (
        <p className="note">
          This account is not the one this inbox belongs to. Argus itself is unaffected.
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

      {error && (
        <p className="error" role="status">
          {error}
        </p>
      )}
    </section>
  )
}
