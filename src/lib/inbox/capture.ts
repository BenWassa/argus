import { validateCapture, type CaptureDraft, type TrackHint } from './model'

/**
 * The capture sheet as a pure state machine.
 *
 * The single rule this exists to make mechanically checkable: nothing that
 * fails ever discards what the user typed. A rejected validation, a dropped
 * connection and a permission error all land back in `editing` holding the
 * same text and the same track hint, ready to send again.
 */
export type CapturePhase = 'editing' | 'submitting' | 'saved'

export interface CaptureState {
  text: string
  trackHint: TrackHint | null
  phase: CapturePhase
  /** Set when the last attempt failed. Cleared as soon as the user types. */
  error: string | null
}

export const EMPTY_CAPTURE: CaptureState = {
  text: '',
  trackHint: null,
  phase: 'editing',
  error: null,
}

export function typeText(state: CaptureState, text: string): CaptureState {
  if (state.phase === 'submitting') return state
  return { ...state, text, phase: 'editing', error: null }
}

export function chooseTrack(state: CaptureState, trackHint: TrackHint | null): CaptureState {
  if (state.phase === 'submitting') return state
  return { ...state, trackHint, phase: 'editing', error: null }
}

export type SubmitStart =
  | { ok: true; state: CaptureState; draft: CaptureDraft }
  | { ok: false; state: CaptureState }

export function beginSubmit(state: CaptureState): SubmitStart {
  if (state.phase === 'submitting') return { ok: false, state }

  const validation = validateCapture(state.text, state.trackHint)
  if (!validation.ok) {
    return { ok: false, state: { ...state, phase: 'editing', error: validation.error } }
  }
  return {
    ok: true,
    // The normalized text goes back into the field, so what is queued and what
    // is on screen are the same thing.
    state: { ...state, text: validation.draft.text, phase: 'submitting', error: null },
    draft: validation.draft,
  }
}

/**
 * A failed write. The text and the track hint are kept exactly as they were:
 * the request was never queued, and the only copy of it is on this screen.
 */
export function submitFailed(state: CaptureState, error: string): CaptureState {
  return { ...state, phase: 'editing', error }
}

/** Acknowledged by the inbox. Only now is it safe to forget what was typed. */
export function submitSucceeded(state: CaptureState): CaptureState {
  return { ...EMPTY_CAPTURE, trackHint: state.trackHint, phase: 'saved' }
}

export function canSubmit(state: CaptureState): boolean {
  return state.phase !== 'submitting' && validateCapture(state.text, state.trackHint).ok
}

export function hasUnsentText(state: CaptureState): boolean {
  return state.text.trim().length > 0
}
