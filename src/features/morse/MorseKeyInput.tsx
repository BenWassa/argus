import { useCallback, useEffect, useRef, useState } from 'react'
import { canonicalPattern, patternReading } from '../../lib/acquisition'
import './MorseKeyInput.css'

/** Hold long enough to mean a dah, but short enough to stay comfortable one-handed. */
export const MORSE_HOLD_MS = 300
const MORSE_KEY_TONE_HZ = 600
const MORSE_KEY_TONE_GAIN = 0.08
const MORSE_KEY_TONE_EDGE_SECONDS = 0.004

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
 * speed/WPM evidence. While a pointer is held, a neutral sidetone sounds for
 * that learner-generated duration. This is motor feedback, not target playback.
 */
export function MorseKeyInput({
  onSubmit,
  submitLabel = 'Submit',
  maxLength = 4,
  now = defaultNow,
}: MorseKeyInputProps) {
  const [entry, setEntry] = useState('')
  const pressRef = useRef<{ pointerId: number; startedAt: number } | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  const append = useCallback((element: '.' | '-') => {
    setEntry((current) => (current.length < maxLength ? `${current}${element}` : current))
  }, [maxLength])

  const deleteLast = useCallback(() => {
    setEntry((current) => current.slice(0, -1))
  }, [])

  const stopTone = useCallback(() => {
    const context = audioContextRef.current
    const oscillator = oscillatorRef.current
    const gain = gainRef.current
    oscillatorRef.current = null
    gainRef.current = null
    if (!context || !oscillator || !gain) return

    const at = context.currentTime
    try {
      gain.gain.cancelScheduledValues(at)
      gain.gain.setValueAtTime(gain.gain.value, at)
      gain.gain.linearRampToValueAtTime(0, at + MORSE_KEY_TONE_EDGE_SECONDS)
      oscillator.stop(at + MORSE_KEY_TONE_EDGE_SECONDS)
    } catch {
      // Audio is optional motor feedback. Key entry must remain usable.
    }
  }, [])

  const startTone = useCallback(async (pointerId: number) => {
    if (typeof window === 'undefined') return
    try {
      const AudioContextCtor = window.AudioContext
      if (!AudioContextCtor) return
      const context = audioContextRef.current ?? new AudioContextCtor()
      audioContextRef.current = context
      if (context.state !== 'running') await context.resume()
      if (pressRef.current?.pointerId !== pointerId || context.state !== 'running') return

      stopTone()
      const oscillator = context.createOscillator()
      const gain = context.createGain()
      const at = context.currentTime
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(MORSE_KEY_TONE_HZ, at)
      gain.gain.setValueAtTime(0, at)
      gain.gain.linearRampToValueAtTime(MORSE_KEY_TONE_GAIN, at + MORSE_KEY_TONE_EDGE_SECONDS)
      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillatorRef.current = oscillator
      gainRef.current = gain
      oscillator.start(at)
    } catch {
      // Never block Morse entry because sound is unavailable.
    }
  }, [stopTone])

  const cancelPress = useCallback((pointerId: number) => {
    if (pressRef.current?.pointerId !== pointerId) return
    pressRef.current = null
    stopTone()
  }, [stopTone])

  useEffect(() => {
    return () => {
      stopTone()
      const context = audioContextRef.current
      audioContextRef.current = null
      if (context && context.state !== 'closed') void context.close().catch(() => undefined)
    }
  }, [stopTone])

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
          aria-label="Morse key. Tap for dit; press and hold for dah. Your press sounds while held."
          aria-keyshortcuts=". -"
          onPointerDown={(event) => {
            if (event.button !== 0 || pressRef.current) return
            event.preventDefault()
            pressRef.current = { pointerId: event.pointerId, startedAt: now() }
            event.currentTarget.setPointerCapture?.(event.pointerId)
            void startTone(event.pointerId)
          }}
          onPointerUp={(event) => {
            const press = pressRef.current
            if (!press || press.pointerId !== event.pointerId) return
            pressRef.current = null
            stopTone()
            append(morseElementForPressDuration(Math.max(0, now() - press.startedAt)))
          }}
          onPointerCancel={(event) => cancelPress(event.pointerId)}
          onLostPointerCapture={(event) => cancelPress(event.pointerId)}
          onContextMenu={(event) => event.preventDefault()}
          onClick={(event) => {
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
      <p className="morse-key-hint">Tap for dit · Hold for dah — · tone follows your press</p>
      <p className="morse-key-hint">Keyboard: . dit · - dah · Backspace delete · Enter submit</p>

      <div className="sr-only" aria-label="Alternative Morse entry controls">
        <button type="button" tabIndex={-1} onClick={() => append('.')}>Add a dit</button>
        <button type="button" tabIndex={-1} onClick={() => append('-')}>Add a dah</button>
      </div>
    </div>
  )
}
