import type { Topic } from '../../../domain/library/topic'
import { MORSE_MODES, modeAvailability, modeEntry, type MorseMode, type MorseModeEntry } from '../../../domain/morse/modes'
import { ModeTray } from '../../../shared/ui/ModeTray'
import './MorseModeTray.css'

interface MorseModeTrayProps {
  topic: Topic
  onStart: (mode: MorseMode, entry: MorseModeEntry | null) => void
  className?: string
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
export function MorseModeTray({ topic, onStart, className }: MorseModeTrayProps) {
  return (
    <ModeTray label="Play" className={className} tiles={MORSE_MODES.map(({ id, label }) => ({
      id,
      label,
      stimulus: <Stimulus mode={id} />,
      colour: `var(--mode-${id})`,
      ink: `var(--mode-${id}-ink)`,
      disabled: modeAvailability(topic, id) === 'locked',
      onSelect: () => onStart(id, modeEntry(topic, id)),
    }))} />
  )
}
