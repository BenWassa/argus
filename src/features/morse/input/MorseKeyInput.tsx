import { canonicalPattern, patternReading } from '../../../domain/morse/testing/acquisitionProfile'
import { useMorseKeyPress, type MorseKeyInputProps } from './useMorseKeyPress'
import './MorseKeyInput.css'

export { MORSE_HOLD_MS, MORSE_MAX_ELEMENTS, morseElementForPressDuration, nextMorseEntry } from './morseKeying'

/**
 * Shared letter → Morse response control for Learn and Test.
 *
 * The learner gets one categorical key: short press = dit, hold = dah. The
 * caller supplies only the expected element count, so the control can grade as
 * soon as the response is complete without learning the target answer itself.
 * There is deliberately no edit/submit path: a mis-key is a miss.
 *
 * Press duration is never returned to the caller and therefore cannot become
 * sending-speed/WPM evidence. What press duration *does* decide is only which
 * element was meant. The touched tone lasts exactly as long as the touch
 * (2026-10-23, superseding #87's canonical extension). Only a keyboard element,
 * or a first press released before audio resumed, sounds the canonical
 * `morseElementDurationMs` length. The sidetone shares the sample player's
 * tone, level and click-free edge shaping
 * so keyed and played Morse sound like one system. The key does not vibrate
 * (deferred 2026-10-23; see ISSUE_280_281_MORSE_HAPTICS.md).
 *
 * An element is never committed before its audible form has finished. Its
 * oscillator starts inside the direct first press, even when the context is
 * suspended, so resume cannot consume the mobile gesture before there is an
 * audible source waiting for it.
 */
export function MorseKeyInput(props: MorseKeyInputProps) {
  const { expectedLength } = props
  const {
    entry, pressed, inputBlocked,
    onPointerDown, onPointerUp, cancelPress, keyElement,
  } = useMorseKeyPress(props)

  return (
    <div className="morse-key-input">
      <p
        className="morse-key-entry mono"
        aria-live="polite"
        aria-label={entry ? `Keyed pattern: ${patternReading(entry)}` : 'Keyed pattern is empty'}
      >
        <span aria-hidden="true">{entry ? canonicalPattern(entry) : '\u00a0'}</span>
      </p>

      <button
        className="morse-key"
        type="button"
        data-pressed={pressed ? 'true' : undefined}
        disabled={inputBlocked || entry.length >= expectedLength}
        aria-label="Morse key. Tap for dit; press and hold for dah. Hold duration only chooses the element; the answer grades automatically when complete."
        aria-keyshortcuts=". -"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={(event) => cancelPress(event.pointerId)}
        onLostPointerCapture={(event) => cancelPress(event.pointerId)}
        onContextMenu={(event) => event.preventDefault()}
        onClick={(event) => {
          if (event.detail === 0 && !inputBlocked) keyElement('.')
        }}
      >
        <span className="morse-key-face" aria-hidden="true" />
        {/* What the key does, said on the key.
            The tap/hold rule existed only in `aria-label`, so a sighted learner
            met an unlabelled slab at the first retrieval of Lesson 1 and had to
            discover the single mechanic the whole product runs on. It is stated
            in the marks the lesson already teaches — `·` short, `—` held — so
            it reinforces the mnemonic grammar rather than adding a second
            vocabulary, and it is hidden from assistive tech because the button's
            own label says the same thing in sentences. */}
        <span className="morse-key-legend" aria-hidden="true">
          <span>Tap <span className="morse-key-legend-mark">·</span></span>
          <span>Hold <span className="morse-key-legend-mark">—</span></span>
        </span>
      </button>
    </div>
  )
}
