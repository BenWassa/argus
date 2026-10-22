// Owns entry, pointer/keyboard activation and cancellation for one mounted key.

import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { fire } from '../../../shared/haptics'
import { defaultNow, KEYBOARD_POINTER_ID, morseElementForPressDuration, nextMorseEntry, type PressState } from './morseKeying'
import { useMorseSidetone } from './useMorseSidetone'

export interface MorseKeyInputProps {
  onSubmit: (pattern: string) => void
  expectedLength: number
  /**
   * Parent-owned interaction gate (#87). The surface that owns the answer
   * lifecycle locks the key while the previous element's tone, its feedback and
   * the transition to the next target are still resolving, so a finger that is
   * still moving cannot produce an element on a target that only just arrived.
   */
  locked?: boolean
  /**
   * Move to the next target without being remounted.
   *
   * Callers used to advance by changing React's `key`, which destroys and
   * rebuilds the control — and its `useEffect` cleanup closes the AudioContext
   * on the way out. Keying a six-letter word therefore created and closed six
   * audio contexts, on the one platform where audio unlocking is fragile and
   * hard-won (see `MORSE_AUDIO_RUNTIME.md`).
   *
   * Changing this token clears the entry and re-arms the key in place instead,
   * so one mounted control can serve a whole word, or a whole run, against a
   * single context. Remounting still works and is still correct; it is simply
   * no longer the only way to ask the next question.
   */
  advanceToken?: string | number
  /**
   * Every change to the entry, as it happens. For an open-ended surface that
   * decides for itself when a character is finished (free play, on a pause)
   * rather than grading on a known length.
   */
  onEntry?: (entry: string) => void
  /** Pause-delimited callers must suspend their idle timer during a held element. */
  onPressStart?: () => void
  now?: () => number
}

export function useMorseKeyPress({
  onSubmit,
  expectedLength,
  locked = false,
  advanceToken,
  onEntry,
  onPressStart,
  now = defaultNow,
}: MorseKeyInputProps) {
  const [entry, setEntry] = useState('')
  const [pressed, setPressed] = useState(false)
  const entryRef = useRef('')
  const lockedRef = useRef(false)
  const pressRef = useRef<PressState | null>(null)
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
    onEntry?.(next.entry)
    if (next.complete) {
      lockedRef.current = true
      if (submitTimerRef.current) clearTimeout(submitTimerRef.current)
      submitTimerRef.current = setTimeout(() => {
        submitTimerRef.current = null
        onSubmit(next.entry)
      }, Math.max(0, audioTailMs))
    }
  }, [expectedLength, onEntry, onSubmit])

  const clearSubmitTimer = useCallback(() => {
    if (submitTimerRef.current) clearTimeout(submitTimerRef.current)
    submitTimerRef.current = null
  }, [])

  const {
    audioContextRef, audioGenerationRef, tonePointerRef,
    clearReleasedToneTimer, stopTone, startTone, finishSustainedTone,
  } = useMorseSidetone(pressRef, commitElement)

  /**
   * Keyboard and assistive activation produce the same complete element the
   * pointer does, through the same commit path, so `.`/`-` is a first-class
   * way to answer rather than a silent shortcut that grades early.
   */
  const keyElement = useCallback((element: '.' | '-') => {
    if (lockedRef.current) return
    onPressStart?.()
    pressRef.current = { pointerId: KEYBOARD_POINTER_ID, startedAt: now(), releasedElement: element }
    fire('element')
    startTone(KEYBOARD_POINTER_ID)
  }, [now, onPressStart, startTone])

  const cancelPress = useCallback((pointerId: number) => {
    const press = pressRef.current
    if (!press || press.pointerId !== pointerId || press.releasedElement) return
    audioGenerationRef.current += 1
    pressRef.current = null
    setPressed(false)
    clearReleasedToneTimer()
    stopTone()
    onEntry?.(entryRef.current)
  }, [clearReleasedToneTimer, onEntry, stopTone])

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

  /**
   * A new target arrived on the same mounted control.
   *
   * This is the in-place equivalent of a remount: abandon any press still in
   * flight, drop its tone, and clear the completion lock so the key accepts
   * the next pattern. The AudioContext deliberately survives, which is the
   * whole point.
   *
   * The initial render is skipped — there is nothing to clear, and firing here
   * would cancel a press that a fast learner had already started.
   */
  const advanceTokenRef = useRef(advanceToken)
  useEffect(() => {
    if (advanceTokenRef.current === advanceToken) return
    advanceTokenRef.current = advanceToken
    audioGenerationRef.current += 1
    pressRef.current = null
    lockedRef.current = false
    entryRef.current = ''
    setEntry('')
    setPressed(false)
    clearReleasedToneTimer()
    clearSubmitTimer()
    stopTone()
  }, [advanceToken, clearReleasedToneTimer, clearSubmitTimer, stopTone])

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

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || pressRef.current || lockedRef.current || inputBlocked) return
    event.preventDefault()
    onPressStart?.()
    pressRef.current = { pointerId: event.pointerId, startedAt: now() }
    // A key should feel like a key. Onset only, and the lightest effect
    // in the vocabulary: a second pulse on release would compete with
    // the sidetone's own tail, and press onset is the moment the
    // learner's intent actually lands. Silently absent on iOS, which is
    // why the visible pressed state and the tone are the real feedback
    // and this is the third channel rather than the first.
    fire('element')
    setPressed(true)
    event.currentTarget.setPointerCapture?.(event.pointerId)
    startTone(event.pointerId)
  }

  const onPointerUp = (event: PointerEvent<HTMLButtonElement>) => {
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
      // This only occurs if pointer-down could not create the tone (for
      // example, a context closed between events). Retry from pointer-up
      // while the interaction is still directly user initiated.
      startTone(event.pointerId)
    }
  }

  return { entry, pressed, inputBlocked, onPointerDown, onPointerUp, cancelPress, keyElement }
}
