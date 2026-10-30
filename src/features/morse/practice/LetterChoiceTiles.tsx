import { forwardRef } from 'react'
import type { MorseLetter } from '../../../domain/morse/code'

/**
 * Four (or honestly fewer) large answer tiles for single-letter recognition
 * (#279), in place of the one-letter text field and the software keyboard.
 *
 * The tiles are plain buttons in DOM order, which is the visual order, so the
 * order a screen reader or Tab walks is the order the learner sees. Nothing
 * here knows which tile is right: no highlight, no label and no attribute
 * varies with the answer, and a tile's name is its own letter only. The
 * parent unmounts the group when an answer is graded, so a selection cannot be
 * changed or repeated afterwards.
 */
export const LetterChoiceTiles = forwardRef<HTMLDivElement, {
  choices: readonly MorseLetter[]
  disabled: boolean
  onChoose: (letter: MorseLetter) => void
}>(function LetterChoiceTiles({ choices, disabled, onChoose }, ref) {
  return (
    <div ref={ref} role="group" aria-label="Choose the letter" tabIndex={-1}
      className="letter-choices" data-count={choices.length}>
      {choices.map(letter => (
        <button key={letter} type="button" className="ghost letter-choice" aria-label={`${letter}, letter`}
          disabled={disabled} onClick={() => onChoose(letter)}>
          <span aria-hidden="true">{letter}</span>
        </button>
      ))}
    </div>
  )
})
