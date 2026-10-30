import type { Topic } from '../../../domain/library/topic'
import { MORSE_MODES, modeAvailability, modeEntry, type MorseMode, type MorseModeEntry } from '../../../domain/morse/modes'
import { ModeTray } from '../../../shared/ui/ModeTray'
import { MorseMarks } from '../MorseMarks'
import './MorseModeTray.css'

interface MorseModeTrayProps {
  topic: Topic
  onStart: (mode: MorseMode, entry: MorseModeEntry | null) => void
  className?: string
}

/**
 * What a mode puts in front of you first. The tray shows it at tile size; a
 * tier pip on the path shows the same mark small, so a pip reads as its mode
 * without relying on colour.
 */
export function MorseModeGlyph({ mode, small = false }: { mode: MorseMode; small?: boolean }) {
  const size = small ? ' is-small' : ''
  if (mode === 'key') return <span className={`morse-mode-letter${size}`}>A</span>
  if (mode === 'free') return <span className={`morse-mode-text${size}`}>HI<span className="morse-mode-cursor" /></span>
  // Read shows A's pattern, the same letter Key shows, drawn by the one
  // component every Morse pattern uses (#263).
  if (mode === 'read') return <MorseMarks pattern=".-" size={small ? 'pip' : 'tile'} />
  return (
    <svg className={`morse-mode-svg${size}`} width={small ? 22 : 60} height={small ? 12 : 32} viewBox="0 0 60 32" fill="currentColor" focusable="false" aria-hidden="true">
      {[12, 22, 32, 20, 28, 14].map((height, index) => (
        <rect key={index} x={index * 10 + 1} y={(32 - height) / 2} width="6" height={height} rx="3" />
      ))}
    </svg>
  )
}

/**
 * Mode entry stays a domain decision; the tray only forwards the descriptor. Every mode is open (#257).
 * The heading is for screen readers only, so the page can be skimmed by section.
 */
export function MorseModeTray({ topic, onStart, className }: MorseModeTrayProps) {
  return (<>
    <h2 className="sr-only">Play</h2>
    <ModeTray label="Play" className={className} tiles={MORSE_MODES.map(({ id, label }) => ({
      id,
      label,
      stimulus: <MorseModeGlyph mode={id} />,
      colour: `var(--mode-${id})`,
      ink: `var(--mode-${id}-ink)`,
      disabled: modeAvailability(topic, id) === 'locked',
      onSelect: () => onStart(id, modeEntry(topic, id)),
    }))} />
  </>)
}
