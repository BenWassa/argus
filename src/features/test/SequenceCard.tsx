import type { Card } from './testDeck'
import { sequenceTextClass } from './textScale'
import './SequenceCard.css'

/** A whole authored acronym; earlier answers stay lit regardless of their grade. */
export function SequenceCard({ sequence }: { sequence: NonNullable<Card['sequence']> }) {
  const { group, step, track } = sequence
  const letters = Array.from(group.letters)
  return (
    <span className={`sequence-card track-${track}${sequenceTextClass(group.letters)}`}>
      <span className="sr-only">{group.label}. Step {step + 1} of {letters.length}, {letters[step]}.</span>
      <span className="sequence-word" role="list" aria-label={group.label}>
        {letters.map((letter, index) => (
          <span key={index} role="listitem" aria-current={index === step ? 'step' : undefined}
            className={`sequence-letter${index === step ? ' is-current' : index < step ? ' is-answered' : ''}`}>
            {letter}
          </span>
        ))}
      </span>
    </span>
  )
}
