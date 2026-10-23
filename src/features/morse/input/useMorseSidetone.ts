// Owns the mounted key's AudioContext, oscillator and canonical element tails.

import { useCallback, useRef, type RefObject } from 'react'
import { DEFAULT_MORSE_AUDIO, MORSE_AUDIO_EDGE_RAMP_MS } from '../../../domain/morse/audio'
import { morseElementDurationMs } from '../../../domain/morse/response'
import type { PressState } from './morseKeying'

function contextConstructor(): typeof AudioContext | undefined {
  if (typeof window === 'undefined') return undefined
  return window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
}

export function useMorseSidetone(
  pressRef: RefObject<PressState | null>,
  commitElement: (element: '.' | '-', audioTailMs?: number) => void,
) {
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const tonePointerRef = useRef<number | null>(null)
  const toneStartedAtRef = useRef<number | null>(null)
  const audioGenerationRef = useRef(0)
  const releasedToneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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
   * The tone lasts exactly as long as the touch: it ends at release with only
   * a click-free edge, so the sound follows the finger rather than a fixed
   * dit/dah length. Press duration still decides which element was keyed. Keyboard elements have no
   * touch to follow and keep the canonical length (`playReleasedTone`), as does
   * a first press released before the context finished resuming.
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
    // Touch length, unless the context is still waking up: then nothing has
    // been audible yet, so the first press keeps its full element and is
    // still heard once resume lands (see MORSE_AUDIO_RUNTIME.md).
    const end = context.state === 'running'
      ? at + edgeSeconds * 2
      : Math.max(at + edgeSeconds * 2, startedAt + morseElementDurationMs(element) / 1000)
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

  const startTone = useCallback((pointerId: number) => {
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
      const press = pressRef.current
      if (!press || press.pointerId !== pointerId) return

      // This path intentionally starts the oscillator before waiting for
      // `resume()`. On iOS and installed Android PWAs a quick first tap can
      // lose its transient user activation by the time an awaited resume
      // settles. A source started against a suspended context waits there and
      // becomes audible as soon as this direct interaction unlocks it.
      if (press.releasedElement) playReleasedTone(context, pointerId, press.releasedElement)
      else beginTone(context, pointerId)

      if (context.state === 'running') return
      void context.resume().catch(() => {
        if (generation !== audioGenerationRef.current) return
        const current = pressRef.current
        if (current?.pointerId === pointerId && current.releasedElement) {
          pressRef.current = null
          stopTone()
          commitElement(current.releasedElement, morseElementDurationMs(current.releasedElement))
        }
      })
    } catch {
      if (generation !== audioGenerationRef.current) return
      const press = pressRef.current
      if (press?.pointerId === pointerId && press.releasedElement) {
        pressRef.current = null
        commitElement(press.releasedElement, morseElementDurationMs(press.releasedElement))
      }
      // Never block Morse entry because sound is unavailable.
    }
  }, [beginTone, commitElement, playReleasedTone, stopTone])

  return {
    audioContextRef, audioGenerationRef, tonePointerRef,
    clearReleasedToneTimer, stopTone, startTone, finishSustainedTone,
  }
}
