import { useCallback, useEffect, useRef, useState } from 'react'
import { canonicalPattern, patternReading } from '../../lib/acquisition'
import { LEARN_ACQUISITION_MORSE_TIMING } from '../../lib/morse'
import { DEFAULT_MORSE_AUDIO, MORSE_AUDIO_EDGE_RAMP_MS } from '../../lib/morseAudio'
import './MorseKeyInput.css'

/** Hold long enough to mean a dah, but short enough to stay comfortable one-handed. */
export const MORSE_HOLD_MS = 300

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
 * sending-speed/WPM evidence. The sidetone shares the sample player's tone,
 * level and click-free edge shaping so keyed and played Morse sound like one
 * system. If a first quick press ends while AudioContext.resume() is still
 * pending, the released element is sounded once after resume before it is
 * submitted, rather than silently losing the first tone.
 */
export function MorseKeyInput({
  onSubmit,
  expectedLength,
  now = defaultNow,
}: MorseKeyInputProps) {
  const [entry, setEntry] = useState('')
  const entryRef = useRef('')
  const lockedRef = useRef(false)
  const pressRef = useRef<PressState | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const tonePointerRef = useRef<number | null>(null)
  const audioGenerationRef = useRef(0)
  const releasedToneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const commitElement = useCallback((element: '.' | '-') => {
    if (lockedRef.current) return
    const next = nextMorseEntry(entryRef.current, element, expectedLength)
    entryRef.current = next.entry
    setEntry(next.entry)
    if (next.complete) {
      lockedRef.current = true
      onSubmit(next.entry)
    }
  }, [expectedLength, onSubmit])

  const clearReleasedToneTimer = useCallback(() => {
    if (releasedToneTimerRef.current) clearTimeout(releasedToneTimerRef.current)
    releasedToneTimerRef.current = null
  }, [])

  const stopTone = useCallback(() => {
    const context = audioContextRef.current
    const oscillator = oscillatorRef.current
    const gain = gainRef.current
    oscillatorRef.current = null
    gainRef.current = null
    tonePointerRef.current = null
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
    oscillator.start(at)
  }, [stopTone])

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
    const ditMs = 1200 / LEARN_ACQUISITION_MORSE_TIMING.characterWpm
    const durationMs = element === '.' ? ditMs : ditMs * 3
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
    oscillator.start(at)
    oscillator.stop(end)

    releasedToneTimerRef.current = setTimeout(() => {
      releasedToneTimerRef.current = null
      const press = pressRef.current
      if (!press || press.pointerId !== pointerId || press.releasedElement !== element) return
      pressRef.current = null
      stopTone()
      commitElement(element)
    }, durationMs + MORSE_AUDIO_EDGE_RAMP_MS)
  }, [clearReleasedToneTimer, commitElement, stopTone])

  const startTone = useCallback(async (pointerId: number) => {
    const generation = ++audioGenerationRef.current
    const AudioContextCtor = contextConstructor()
    if (!AudioContextCtor) {
      const press = pressRef.current
      if (press?.pointerId === pointerId && press.releasedElement) {
        pressRef.current = null
        commitElement(press.releasedElement)
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
        commitElement(press.releasedElement)
      }
      // Never block Morse entry because sound is unavailable.
    }
  }, [beginTone, commitElement, playReleasedTone])

  const cancelPress = useCallback((pointerId: number) => {
    const press = pressRef.current
    if (!press || press.pointerId !== pointerId || press.releasedElement) return
    audioGenerationRef.current += 1
    pressRef.current = null
    clearReleasedToneTimer()
    stopTone()
  }, [clearReleasedToneTimer, stopTone])

  useEffect(() => {
    return () => {
      audioGenerationRef.current += 1
      pressRef.current = null
      clearReleasedToneTimer()
      stopTone()
      const context = audioContextRef.current
      audioContextRef.current = null
      if (context && context.state !== 'closed') void context.close().catch(() => undefined)
    }
  }, [clearReleasedToneTimer, stopTone])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const typing = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement
      if (typing || pressRef.current) return

      if (event.key === '.') {
        event.preventDefault()
        commitElement('.')
      } else if (event.key === '-') {
        event.preventDefault()
        commitElement('-')
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [commitElement])

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
        disabled={entry.length >= expectedLength}
        aria-label="Morse key. Tap for dit; press and hold for dah. Hold duration only chooses the element; the answer grades automatically when complete."
        aria-keyshortcuts=". -"
        onPointerDown={(event) => {
          if (event.button !== 0 || pressRef.current || lockedRef.current) return
          event.preventDefault()
          pressRef.current = { pointerId: event.pointerId, startedAt: now() }
          event.currentTarget.setPointerCapture?.(event.pointerId)
          void startTone(event.pointerId)
        }}
        onPointerUp={(event) => {
          const press = pressRef.current
          if (!press || press.pointerId !== event.pointerId || press.releasedElement) return
          const element = morseElementForPressDuration(Math.max(0, now() - press.startedAt))
          pressRef.current = { ...press, releasedElement: element }

          if (tonePointerRef.current === event.pointerId) {
            audioGenerationRef.current += 1
            pressRef.current = null
            stopTone()
            commitElement(element)
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
          if (event.detail === 0) commitElement('.')
        }}
      >
        <span className="morse-key-face" aria-hidden="true" />
      </button>
    </div>
  )
}
