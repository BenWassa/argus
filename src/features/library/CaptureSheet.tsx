import { useId, useState } from 'react'
import { Dialog } from '../../components/ui/Dialog'
import {
  EMPTY_CAPTURE,
  beginSubmit,
  canSubmit,
  chooseTrack,
  submitFailed,
  submitSucceeded,
  typeText,
  type CaptureState,
} from '../../lib/inbox/capture'
import { describeInboxError } from '../../lib/inbox/backend'
import { CAPTURE_TEXT_MAX, TRACK_HINTS, type CaptureDraft, type TrackHint } from '../../lib/inbox/model'

interface CaptureSheetProps {
  onSubmit: (draft: CaptureDraft) => Promise<void>
  onClose: () => void
  onCaptured: () => void
}

const TRACK_HINT_LABELS: Record<TrackHint, string> = {
  learning: 'Learning',
  survival: 'Survival',
  tradecraft: 'Tradecraft',
}

/**
 * Capture, and nothing more.
 *
 * One field takes an idea, a link, or a link and a note. There is no title, no
 * scope, no items and no sources here on purpose: a request is not a topic, and
 * asking for a completion boundary at the moment an idea occurs is exactly the
 * friction this exists to remove. Deciding what can honestly be finished is
 * ingestion's job, in the repository, under review.
 */
export function CaptureSheet({ onSubmit, onClose, onCaptured }: CaptureSheetProps) {
  const [state, setState] = useState<CaptureState>(EMPTY_CAPTURE)
  const fieldId = useId()
  const trackId = useId()
  const errorId = useId()

  async function submit() {
    const start = beginSubmit(state)
    if (!start.ok) {
      setState(start.state)
      return
    }
    setState(start.state)
    try {
      await onSubmit(start.draft)
      setState((current) => submitSucceeded(current))
      onCaptured()
      onClose()
    } catch (error) {
      // The request never left this screen, so neither does the text.
      setState((current) => submitFailed(current, describeInboxError(error)))
    }
  }

  const submitting = state.phase === 'submitting'

  return (
    <Dialog title="Want to learn" onClose={onClose} closeLabel="Close want to learn">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <div className="field-row">
          <label htmlFor={fieldId}>What do you want to learn?</label>
          <textarea
            id={fieldId}
            className="field"
            rows={3}
            value={state.text}
            maxLength={CAPTURE_TEXT_MAX}
            autoComplete="off"
            enterKeyHint="done"
            readOnly={submitting}
            placeholder="An idea, a link, or a link and a note"
            aria-describedby={state.error ? errorId : `${fieldId}-help`}
            aria-invalid={state.error ? true : undefined}
            onChange={(e) => setState((current) => typeText(current, e.target.value))}
          />
          <p className="help" id={`${fieldId}-help`}>
            This is a note to yourself, not a topic. Nothing here is scheduled, scored or counted
            until it has been researched and shipped.
          </p>
        </div>

        <div className="field-row">
          <label htmlFor={trackId}>Track</label>
          <select
            id={trackId}
            className="field"
            value={state.trackHint ?? 'auto'}
            disabled={submitting}
            onChange={(e) =>
              setState((current) =>
                chooseTrack(current, e.target.value === 'auto' ? null : (e.target.value as TrackHint)),
              )
            }
          >
            <option value="auto">Auto</option>
            {TRACK_HINTS.map((hint) => (
              <option key={hint} value={hint}>
                {TRACK_HINT_LABELS[hint]}
              </option>
            ))}
          </select>
          <p className="help">Optional. Auto lets ingestion decide where it belongs.</p>
        </div>

        {state.error && (
          <p className="error" id={errorId} role="alert">
            {state.error}
          </p>
        )}

        <div className="actions">
          <button className="ghost" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" disabled={submitting || !canSubmit(state)}>
            {submitting ? 'Adding…' : 'Add'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
