import type { ReactNode } from 'react'
import './MorseListenPlay.css'

/**
 * The one Listen play control in a session (#263): a round button in the
 * mode's colour, the largest thing on screen, because in Listen the sound is
 * the stimulus. Letters, Copy and Groups all use it; only the name changes
 * ("Play", "Play again", "Play once more"), and an optional mono readout under
 * it says how many hearings are left where that is limited.
 */
export function MorseListenPlay({ label, icon = 'play', onClick, disabled = false, pressed, readout }: {
  /** The accessible name, which is also the button's state. */
  label: string
  icon?: 'play' | 'stop' | 'replay'
  onClick: () => void
  disabled?: boolean
  /** Set for a play/stop toggle. */
  pressed?: boolean
  readout?: ReactNode
}) {
  return (
    <span className="morse-listen-play-wrap">
      <button type="button" className="morse-listen-play" aria-label={label} aria-pressed={pressed} onClick={onClick} disabled={disabled}>
        <svg viewBox="0 0 24 24" width="36" height="36" aria-hidden="true" focusable="false" fill="currentColor">
          {icon === 'stop' ? <rect x="6" y="6" width="12" height="12" rx="1.5" />
            : icon === 'replay' ? <path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7Z" />
              : <path d="M8 5l11 7-11 7z" />}
        </svg>
      </button>
      {readout !== undefined && readout !== null && <span className="morse-listen-play-readout" aria-hidden="true">{readout}</span>}
    </span>
  )
}
