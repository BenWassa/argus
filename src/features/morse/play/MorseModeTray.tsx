import type { Topic } from '../../../domain/library/topic'
import { MORSE_MODES, modeAvailability, modeEntry, type MorseMode, type MorseModeEntry } from '../../../domain/morse/modes'
import './MorseModeTray.css'

interface MorseModeTrayProps {
  topic: Topic
  onStart: (mode: MorseMode, entry: MorseModeEntry | null) => void
}

function Stimulus({ mode }: { mode: MorseMode }) {
  if (mode === 'key') return <span className="morse-mode-letter">A</span>
  if (mode === 'free') return <span className="morse-mode-text">HI<span className="morse-mode-cursor" /></span>
  return (
    <svg width="60" height="32" viewBox="0 0 60 32" fill="currentColor" focusable="false">
      {mode === 'listen' ? [12, 22, 32, 20, 28, 14].map((height, index) => (
        <rect key={index} x={index * 10 + 1} y={(32 - height) / 2} width="6" height={height} rx="3" />
      )) : <><circle cx="6" cy="16" r="5" /><rect x="18" y="11" width="16" height="10" rx="3" /><rect x="41" y="11" width="16" height="10" rx="3" /></>}
    </svg>
  )
}

/** Mode entry stays a domain decision; the tray only forwards the descriptor. */
export function MorseModeTray({ topic, onStart }: MorseModeTrayProps) {
  return (
    <nav className="morse-mode-tray" aria-label="Play">
      {MORSE_MODES.map(({ id, label }) => {
        const locked = modeAvailability(topic, id) === 'locked'
        return (
          <button key={id} type="button" className={`morse-mode-tile morse-mode-${id}`}
            aria-disabled={locked || undefined}
            onClick={() => { if (!locked) onStart(id, modeEntry(topic, id)) }}>
            <span className="morse-mode-stimulus" aria-hidden="true"><Stimulus mode={id} /></span>
            <span className="morse-mode-label">{label}</span>
            {locked && <svg className="morse-mode-lock" aria-hidden="true" focusable="false" width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
              <path d="M2 6V4a4 4 0 0 1 8 0v2h1v8H1V6h1Zm2 0h4V4a2 2 0 0 0-4 0v2Z" />
            </svg>}
          </button>
        )
      })}
    </nav>
  )
}
