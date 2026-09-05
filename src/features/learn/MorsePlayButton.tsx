/**
 * The compact Play/Stop control from #44, in one place so the Learn lesson, the
 * Morse alphabet reference and the packet reading surface cannot drift apart on
 * accessible name, state or touch target.
 *
 * `button.icon` in `global.css` guarantees a 44×44 CSS px target even though the
 * drawn glyph is smaller. State is never colour-only: the glyph itself switches
 * between a play triangle and a stop square, and the accessible name switches
 * between "Play A Morse" and "Stop A Morse" to match.
 */
export function MorsePlayButton({
  glyph,
  playing,
  onToggle,
  className = '',
}: {
  glyph: string
  playing: boolean
  onToggle: () => void
  className?: string
}) {
  return (
    <button
      className={`ghost icon morse-play${playing ? ' is-playing' : ''}${className ? ` ${className}` : ''}`}
      type="button"
      onClick={onToggle}
      aria-label={playing ? `Stop ${glyph} Morse` : `Play ${glyph} Morse`}
      aria-pressed={playing}
    >
      {playing ? (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
          <rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
          <path d="M8 5l11 7-11 7z" fill="currentColor" />
        </svg>
      )}
    </button>
  )
}
