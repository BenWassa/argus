import { useCallback, useEffect, useRef, useState } from 'react'
import { canonicalPattern, patternReading } from '../../lib/acquisition'
import './MorseKeyInput.css'

/** Hold long enough to mean a dah, but short enough to stay comfortable one-handed. */
export const MORSE_HOLD_MS = 300

export function morseElementForPressDuration(durationMs: number): '.' | '-' {
  return durationMs >= MORSE_HOLD_MS ? '-' : '.'
}

interface MorseKeyInputProps {
  onSubmit: (pattern: string) => void
  submitLabel?: string
  maxLength?: number
  now?: () => number
}

function defaultNow(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

/**
 * Shared letter → Morse response control for Learn and Test.
 *
 * The touch gesture is categorical input only: tap = dit, hold = dah. Press
 * duration is never returned to the caller and therefore cannot become sending
 * speed/WPM evidence. Keyboard users may use `.`, `-`, Backspace and Enter.
 */
export function MorseKeyInput({
  onSubmit,
  submitLabel = 'Submit',
  maxLength = 4,
  now = defaultNow,
}: MorseKeyInputProps) {
  const [entry, setEntry] = useState('')
  const pressRef = useRef<{ pointerId: number; startedAt: number } | null>(null)

  const append = useCallback((element: '.' | '-') => {
    setEntry((current) => (current.length < maxLength ? `${current}${element}` : current))
  }, [maxLength])

  const deleteLast = useCallback(() => {
    setEntry((current) => current.slice(0, -1))
  }, [])

  const cancelPress = useCallback((pointerId: number) => {
    if (pressRef.current?.pointerId === pointerId) pressRef.current = null
  }, [])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const typing = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement
      if (typing) return

      if (event.key === '.') {
        event.preventDefault()
        append('.')
      } else if (event.key === '-') {
        event.preventDefault()
        append('-')
      } else if (event.key === 'Backspace') {
        event.preventDefault()
        deleteLast()
      } else if (event.key === 'Enter' && entry && !(event.target instanceof HTMLButtonElement)) {
        event.preventDefault()
        onSubmit(entry)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [append, deleteLast, entry, onSubmit])

  return (
    <div className="morse-key-input">
      <p
        className="morse-key-entry mono"
        aria-live="polite"
        aria-label={entry ? `Keyed pattern: ${patternReading(entry)}` : 'Keyed pattern is empty'}
      >
        <span aria-hidden="true">{entry ? canonicalPattern(entry) : '—'}</span>
      </p>

      <div className="morse-key-controls">
        <button
          className="morse-key"
          type="button"
          disabled={entry.length >= maxLength}
          aria-label="Morse key. Tap for dit; press and hold for dah."
          aria-keyshortcuts=". -"
          onPointerDown={(event) => {
            if (event.button !== 0 || pressRef.current) return
            event.preventDefault()
            pressRef.current = { pointerId: event.pointerId, startedAt: now() }
            event.currentTarget.setPointerCapture?.(event.pointerId)
          }}
          onPointerUp={(event) => {
            const press = pressRef.current
            if (!press || press.pointerId !== event.pointerId) return
            pressRef.current = null
            append(morseElementForPressDuration(Math.max(0, now() - press.startedAt)))
          }}
          onPointerCancel={(event) => cancelPress(event.pointerId)}
          onLostPointerCapture={(event) => cancelPress(event.pointerId)}
          onContextMenu={(event) => event.preventDefault()}
          onClick={(event) => {
            // Keyboard/switch activation has no PointerEvent duration. Treat the
            // primary activation as dit; `-` remains the timing-free dah route.
            if (event.detail === 0) append('.')
          }}
        >
          <span className="morse-key-short" aria-hidden="true">Tap&nbsp;·</span>
          <span className="morse-key-long" aria-hidden="true">Hold&nbsp;—</span>
        </button>

        <button className="ghost morse-key-back" type="button" disabled={!entry} onClick={deleteLast}>
          Back
        </button>
      </div>

      <button className="morse-key-submit" type="button" disabled={!entry} onClick={() => onSubmit(entry)}>
        {submitLabel}
      </button>
      <p className="morse-key-hint">Tap for dit · Hold for dah —</p>
      <p className="morse-key-hint">Keyboard: . dit · - dah · Backspace delete · Enter submit</p>

      <div className="sr-only" aria-label="Alternative Morse entry controls">
        <button type="button" tabIndex={-1} onClick={() => append('.')}>Add a dit</button>
        <button type="button" tabIndex={-1} onClick={() => append('-')}>Add a dah</button>
      </div>
    </div>
  )
}
