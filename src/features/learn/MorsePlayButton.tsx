/**
 * Compact Play/Stop control shared by Learn and the A–Z reference.
 *
 * `button.icon` guarantees a 44×44 CSS px target. Ordinary instructional audio
 * names its letter. A listening-question stimulus must not: `concealGlyph`
 * switches to the neutral "Play/Stop Morse sound" name so a screen reader does
 * not receive the answer that the visible prompt intentionally withholds.
 */
export function MorsePlayButton({
  glyph,
  playing,
  onToggle,
  className = '',
  concealGlyph = false,
}: {
  glyph: string
  playing: boolean
  onToggle: () => void
  className?: string
  concealGlyph?: boolean
}) {
  const label = concealGlyph
    ? playing
      ? 'Stop Morse sound'
      : 'Play Morse sound'
    : playing
      ? `Stop ${glyph} Morse`
      : `Play ${glyph} Morse`

  return (
    <button
      className={`ghost icon morse-play${playing ? ' is-playing' : ''}${className ? ` ${className}` : ''}`}
      type="button"
      onClick={onToggle}
      aria-label={label}
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
