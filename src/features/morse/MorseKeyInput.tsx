import { useCallback, useEffect, useRef, useState } from 'react'
import { canonicalPattern, patternReading } from '../../lib/acquisition'
import { DEFAULT_MORSE_AUDIO, MORSE_AUDIO_EDGE_RAMP_MS } from '../../lib/morseAudio'
import { morseElementDurationMs } from '../../lib/morseResponse'
import './MorseKeyInput.css'

/** Hold long enough to mean a dah, but short enough to stay comfortable one-handed. */
export const MORSE_HOLD_MS = 300

/**
 * Keyboard entry has no pointer, but it uses the identical commit path, so it
 * borrows a pointer id that a real pointer can never be assigned.
 */
const KEYBOARD_POINTER_ID = -1

export function morseElementForPressDuration(durationMs: number): '.' | '-' {
  return durationMs >= MORSE_HOLD_MS ? '-' : '.'
}

export function nextMorseEntry(
  current: string,
  element: '.' | '-',
  expectedLength: number,
): { entry: string; complete: boolean } {
  if (!Number.isInteger(expectedLength) || expectedLength < 1 || expectedLength > 4) {
    throw new RangeError('expectedLength must be an integer from 1 to 4.')
  }
  const entry = current.length < expectedLength ? `${current}${element}` : current
  return { entry, complete: entry.length === expectedLength }
}

interface MorseKeyInputProps {
  onSubmit: (pattern: string) => void
  expectedLength: number
  /**
   * Parent-owned interaction gate (#87). The surface that owns the answer
   * lifecycle locks the key while the previous element's tone, its feedback and
   * the transition to the next target are still resolving, so a finger that is
   * still moving cannot produce an element on a target that only just arrived.
   */
  locked?: boolean
  now?: () => number
}

interface PressState {
  pointerId: number
  startedAt: number
  releasedElement?: '.' | '-'
}

function defaultNow(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

function contextConstructor(): typeof AudioContext | undefined {
  if (typeof window === 'undefined') return undefined
  return window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
}

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
 * element was meant. How long that element then sounds is canonical (#87): a
 * released press is extended to the full dit/dah length from
 * `morseElementDurationMs` rather than being cut off at finger-contact
 * duration, so a quick stab is a complete dit instead of a clipped chirp. The
 * sidetone shares the sample player's tone, level and click-free edge shaping
 * so keyed and played Morse sound like one system.
 *
 * An element is never committed before its audible form has finished. If a
 * first quick press ends while AudioContext.resume() is still pending, the
 * released element is sounded once after resume before it is submitted, rather
 * than silently losing the first tone.
 */
export function MorseKeyInput({
  onSubmit,
  expectedLength,
  locked = false,
  now = defaultNow,
}: MorseKeyInputProps) {
  const [entry, setEntry] = useState('')
  const [pressed, setPressed] = useState(false)
  const entryRef = useRef('')
  const lockedRef = useRef(false)
  const pressRef = useRef<PressState | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const tonePointerRef = useRef<number | null>(null)
  const toneStartedAtRef = useRef<number | null>(null)
  const audioGenerationRef = useRef(0)
  const releasedToneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  /** Holds the completed pattern until its final element has finished sounding. */
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // A parent lock and the control's own completion lock are the same refusal as
  // far as every handler below is concerned.
  const inputBlocked = locked

  /**
   * Record one element and, when it completes the pattern, hand it over.
   *
   * The entry itself updates the instant the finger lifts, so keying a
   * three-element letter is never throttled by the sound of the element before
   * it. Only the *submit* waits, and only for the final element's own tail:
   * #87 requires that the answer not be graded away before the learner has
   * heard what they keyed, not that elements queue behind each other.
   */
  const commitElement = useCallback((element: '.' | '-', audioTailMs = 0) => {
    if (lockedRef.current) return
    const next = nextMorseEntry(entryRef.current, element, expectedLength)
    entryRef.current = next.entry
    setEntry(next.entry)
    if (next.complete) {
      lockedRef.current = true
      if (submitTimerRef.current) clearTimeout(submitTimerRef.current)
      submitTimerRef.current = setTimeout(() => {
        submitTimerRef.current = null
        onSubmit(next.entry)
      }, Math.max(0, audioTailMs))
    }
  }, [expectedLength, onSubmit])

  const clearReleasedToneTimer = useCallback(() => {
    if (releasedToneTimerRef.current) clearTimeout(releasedToneTimerRef.current)
    releasedToneTimerRef.current = null
  }, [])

  const clearSubmitTimer = useCallback(() => {
    if (submitTimerRef.current) clearTimeout(submitTimerRef.current)
    submitTimerRef.current = null
  }, [])

  const stopTone = useCallback(() => {
    const context = audioContextRef.current
    const oscillator = oscillatorRef.current
    const gain = gainRef.current
    oscillatorRef.current = null
    gainRef.current = null
    tonePointerRef.current = null
    toneStartedAtRef.current = null
    if (!context || !oscillator || !gain) return

    const at = context.currentTime
    const edgeSeconds = MORSE_AUDIO_EDGE_RAMP_MS / 1000
    try {
      gain.gain.cancelScheduledValues(at)
      gain.gain.setValueAtTime(gain.gain.value, at)
      gain.gain.linearRampToValueAtTime(0, at + edgeSeconds)
      oscillator.stop(at + edgeSeconds)
    } catch {
      // Audio is optional motor feedback. Key entry must remain usable.
    }
  }, [])

  const beginTone = useCallback((context: AudioContext, pointerId: number) => {
    stopTone()
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const at = context.currentTime
    const edgeSeconds = MORSE_AUDIO_EDGE_RAMP_MS / 1000
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(DEFAULT_MORSE_AUDIO.toneHz, at)
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(DEFAULT_MORSE_AUDIO.volume, at + edgeSeconds)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillatorRef.current = oscillator
    gainRef.current = gain
    tonePointerRef.current = pointerId
    toneStartedAtRef.current = at
    oscillator.start(at)
  }, [stopTone])

  /**
   * Close out a tone that is already sounding under the finger.
   *
   * The element runs to its canonical length measured from when the tone
   * actually started, not from when the finger left, so releasing early
   * lengthens the tone rather than truncating it. A dah held past its own
   * length simply ends at release. The commit waits for that end.
   */
  const finishSustainedTone = useCallback((element: '.' | '-') => {
    const context = audioContextRef.current
    const oscillator = oscillatorRef.current
    const gain = gainRef.current
    const startedAt = toneStartedAtRef.current

    if (!context || !oscillator || !gain || startedAt === null) {
      audioGenerationRef.current += 1
      pressRef.current = null
      stopTone()
      commitElement(element, morseElementDurationMs(element))
      return
    }

    const at = context.currentTime
    const edgeSeconds = MORSE_AUDIO_EDGE_RAMP_MS / 1000
    const end = Math.max(at + edgeSeconds * 2, startedAt + morseElementDurationMs(element) / 1000)
    const ramp = Math.min(edgeSeconds, (end - at) / 4)

    audioGenerationRef.current += 1
    oscillatorRef.current = null
    gainRef.current = null
    tonePointerRef.current = null
    toneStartedAtRef.current = null

    try {
      gain.gain.cancelScheduledValues(at)
      gain.gain.setValueAtTime(gain.gain.value, at)
      gain.gain.linearRampToValueAtTime(DEFAULT_MORSE_AUDIO.volume, at + ramp)
      gain.gain.setValueAtTime(DEFAULT_MORSE_AUDIO.volume, end - ramp)
      gain.gain.linearRampToValueAtTime(0, end)
      oscillator.stop(end)
    } catch {
      // Audio is optional motor feedback. Key entry must remain usable.
    }

    // The press is over the moment the finger lifts, so the key is free for
    // the next element straight away; only the completed pattern waits for the
    // tail this element still has left to sound.
    clearReleasedToneTimer()
    pressRef.current = null
    commitElement(element, Math.max(0, (end - at) * 1000) + MORSE_AUDIO_EDGE_RAMP_MS)
  }, [clearReleasedToneTimer, commitElement, stopTone])

  const playReleasedTone = useCallback((
    context: AudioContext,
    pointerId: number,
    element: '.' | '-',
  ) => {
    stopTone()
    clearReleasedToneTimer()

    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const at = context.currentTime
    const edgeSeconds = MORSE_AUDIO_EDGE_RAMP_MS / 1000
    const durationMs = morseElementDurationMs(element)
    const end = at + durationMs / 1000
    const ramp = Math.min(edgeSeconds, durationMs / 4000)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(DEFAULT_MORSE_AUDIO.toneHz, at)
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(DEFAULT_MORSE_AUDIO.volume, at + ramp)
    gain.gain.setValueAtTime(DEFAULT_MORSE_AUDIO.volume, end - ramp)
    gain.gain.linearRampToValueAtTime(0, end)
    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillatorRef.current = oscillator
    gainRef.current = gain
    tonePointerRef.current = pointerId
    toneStartedAtRef.current = at
    oscillator.start(at)
    oscillator.stop(end)

    pressRef.current = null
    commitElement(element, durationMs + MORSE_AUDIO_EDGE_RAMP_MS)
  }, [clearReleasedToneTimer, commitElement, stopTone])

  const startTone = useCallback(async (pointerId: number) => {
    const generation = ++audioGenerationRef.current
    const AudioContextCtor = contextConstructor()
    if (!AudioContextCtor) {
      const press = pressRef.current
      if (press?.pointerId === pointerId && press.releasedElement) {
        pressRef.current = null
        commitElement(press.releasedElement, morseElementDurationMs(press.releasedElement))
      }
      return
    }

    try {
      const context = audioContextRef.current ?? new AudioContextCtor()
      audioContextRef.current = context
      if (context.state !== 'running') await context.resume()
      if (generation !== audioGenerationRef.current) return

      const press = pressRef.current
      if (!press || press.pointerId !== pointerId) return
      if (context.state !== 'running') throw new Error('AudioContext did not resume.')

      if (press.releasedElement) playReleasedTone(context, pointerId, press.releasedElement)
      else beginTone(context, pointerId)
    } catch {
      if (generation !== audioGenerationRef.current) return
      const press = pressRef.current
      if (press?.pointerId === pointerId && press.releasedElement) {
        pressRef.current = null
        commitElement(press.releasedElement, morseElementDurationMs(press.releasedElement))
      }
      // Never block Morse entry because sound is unavailable.
    }
  }, [beginTone, commitElement, playReleasedTone])

  /**
   * Keyboard and assistive activation produce the same complete element the
   * pointer does, through the same commit path, so `.`/`-` is a first-class
   * way to answer rather than a silent shortcut that grades early.
   */
  const keyElement = useCallback((element: '.' | '-') => {
    if (lockedRef.current) return
    pressRef.current = { pointerId: KEYBOARD_POINTER_ID, startedAt: now(), releasedElement: element }
    void startTone(KEYBOARD_POINTER_ID)
  }, [now, startTone])

  const cancelPress = useCallback((pointerId: number) => {
    const press = pressRef.current
    if (!press || press.pointerId !== pointerId || press.releasedElement) return
    audioGenerationRef.current += 1
    pressRef.current = null
    setPressed(false)
    clearReleasedToneTimer()
    stopTone()
  }, [clearReleasedToneTimer, stopTone])

  useEffect(() => {
    return () => {
      audioGenerationRef.current += 1
      pressRef.current = null
      clearReleasedToneTimer()
      clearSubmitTimer()
      stopTone()
      const context = audioContextRef.current
      audioContextRef.current = null
      if (context && context.state !== 'closed') void context.close().catch(() => undefined)
    }
  }, [clearReleasedToneTimer, clearSubmitTimer, stopTone])

  /**
   * Backgrounding mid-press would otherwise leave a sustaining oscillator with
   * no `pointerup` ever coming to close it, so the app returns to the
   * foreground still humming. The press is abandoned rather than graded: a
   * response interrupted by leaving the app was never a response.
   */
  useEffect(() => {
    if (typeof document === 'undefined') return
    function abandonPress() {
      audioGenerationRef.current += 1
      pressRef.current = null
      setPressed(false)
      clearReleasedToneTimer()
      stopTone()
    }
    function onVisibilityChange() {
      if (document.hidden) abandonPress()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', abandonPress)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', abandonPress)
    }
  }, [clearReleasedToneTimer, stopTone])

  /**
   * A parent that locks mid-press abandons that press rather than letting it
   * land on whatever arrives next.
   */
  useEffect(() => {
    if (!locked) return
    audioGenerationRef.current += 1
    pressRef.current = null
    setPressed(false)
    clearReleasedToneTimer()
    stopTone()
  }, [locked, clearReleasedToneTimer, stopTone])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const typing = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement
      // `event.repeat` is a held key autorepeating, never a second deliberate
      // element, and it must not be able to run out a whole pattern by itself.
      if (typing || inputBlocked || event.repeat) return

      if (event.key === '.') {
        event.preventDefault()
        keyElement('.')
      } else if (event.key === '-') {
        event.preventDefault()
        keyElement('-')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [inputBlocked, keyElement])

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
        onPointerDown={(event) => {
          if (event.button !== 0 || pressRef.current || lockedRef.current || inputBlocked) return
          event.preventDefault()
          pressRef.current = { pointerId: event.pointerId, startedAt: now() }
          setPressed(true)
          event.currentTarget.setPointerCapture?.(event.pointerId)
          void startTone(event.pointerId)
        }}
        onPointerUp={(event) => {
          const press = pressRef.current
          setPressed(false)
          if (!press || press.pointerId !== event.pointerId || press.releasedElement) return
          const element = morseElementForPressDuration(Math.max(0, now() - press.startedAt))
          pressRef.current = { ...press, releasedElement: element }

          if (tonePointerRef.current === event.pointerId) {
            // The tone under the finger becomes the canonical element: it is
            // extended to full length if the press was shorter, and the commit
            // waits for it rather than racing it.
            finishSustainedTone(element)
          } else {
            // A quick first press may beat AudioContext.resume(). Retry directly
            // from pointerup's user activation; `startTone` will sound the
            // released element before committing it once the context is ready.
            void startTone(event.pointerId)
          }
        }}
        onPointerCancel={(event) => cancelPress(event.pointerId)}
        onLostPointerCapture={(event) => cancelPress(event.pointerId)}
        onContextMenu={(event) => event.preventDefault()}
        onClick={(event) => {
          if (event.detail === 0 && !inputBlocked) keyElement('.')
        }}
      >
        <span className="morse-key-face" aria-hidden="true" />
      </button>
    </div>
  )
}
