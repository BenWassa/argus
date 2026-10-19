import type { Ref } from 'react'
import './GradePair.css'

interface GradePairProps {
  onMiss: () => void
  onHit: () => void
  /** Whether the pair can be pressed. Off, it is out of the tab order and hidden from assistive technology. */
  active?: boolean
  /** Show the arrows that mirror the swipe and the arrow keys. They are an accelerator, never the only way. */
  arrows?: boolean
  hitRef?: Ref<HTMLButtonElement>
  className?: string
}

/**
 * The one grade pair for every self-graded answer, in Test and in Practice:
 * "Missed" and "Got it". Swiping and the arrow keys are accelerators for the
 * same two buttons; the buttons are always the way to grade.
 */
export function GradePair({ onMiss, onHit, active = true, arrows = false, hitRef, className = '' }: GradePairProps) {
  return (
    <div className={`grade-pair${className ? ` ${className}` : ''}`} aria-hidden={!active || undefined}>
      <button className="ghost grade-miss" type="button" tabIndex={active ? 0 : -1} onClick={onMiss}>
        {arrows && <span className="grade-arrow" aria-hidden="true">←</span>}
        Missed
      </button>
      <button ref={hitRef} className="grade-hit" type="button" tabIndex={active ? 0 : -1} onClick={onHit}>
        Got it
        {arrows && <span className="grade-arrow" aria-hidden="true">→</span>}
      </button>
    </div>
  )
}
