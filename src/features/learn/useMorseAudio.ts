import { useCallback, useEffect, useRef, useState } from 'react'
import { LEARN_ACQUISITION_MORSE_TIMING } from '../../lib/morse'
import {
  MORSE_AUDIO_START_DELAY_MS,
  MorseAudioPlayer,
  MorsePlaybackCancelledError,
} from '../../lib/morseAudio'

export interface Sounding {
  glyph: string
  /** Element currently sounding, or null between elements. */
  index: number | null
}

/**
 * One Morse player for a whole surface, at #44's acquisition speed.
 *
 * One player and one character at a time: starting a character cancels whatever
 * was playing, so the illuminated element on screen and the tone in the ear are
 * always the same event. Playback only ever starts from a click — nothing here
 * plays on mount, on navigation or on re-render.
 *
 * Shared by the Learn lesson, the Morse alphabet reference and the packet
 * reading surface, so all three keep the same lifecycle, the same
 * cancel-on-background behaviour and the same 12 WPM acquisition timing rather
 * than three copies that can drift apart.
 */
export function useMorseAudio() {
  const playerRef = useRef<MorseAudioPlayer | null>(null)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const [sounding, setSounding] = useState<Sounding | null>(null)
  const [audioError, setAudioError] = useState<string | null>(null)

  const clearTimers = useCallback(() => {
    for (const timer of timersRef.current) clearTimeout(timer)
    timersRef.current = []
  }, [])

  const stop = useCallback(() => {
    clearTimers()
    playerRef.current?.cancel()
    setSounding(null)
  }, [clearTimers])

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) stop()
    }
    const onPageHide = () => stop()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', onPageHide)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', onPageHide)
      clearTimers()
      void playerRef.current?.dispose()
      playerRef.current = null
    }
  }, [clearTimers, stop])

  const play = useCallback(
    async (glyph: string) => {
      stop()
      setAudioError(null)
      try {
        playerRef.current ??= new MorseAudioPlayer()
        const schedule = await playerRef.current.play(glyph, LEARN_ACQUISITION_MORSE_TIMING)
        setSounding({ glyph, index: null })

        // Element illumination is driven by the same schedule and the same
        // start-delay constant as the tone. Nothing here invents a second
        // timing model, so the visual and audible short/long sequence cannot
        // silently drift apart.
        let offset = MORSE_AUDIO_START_DELAY_MS
        let element = 0
        for (const event of schedule.events) {
          if (event.kind === 'signal') {
            const at = offset
            const index = element
            // Lit for exactly as long as the tone sounds, dark through the gap,
            // so the silence between elements is as visible as the elements.
            timersRef.current.push(setTimeout(() => setSounding({ glyph, index }), at))
            timersRef.current.push(
              setTimeout(() => setSounding({ glyph, index: null }), at + event.durationMs),
            )
            element += 1
          }
          offset += event.durationMs
        }
        timersRef.current.push(setTimeout(() => setSounding(null), offset + 80))
      } catch (error) {
        // A second Play/Stop/background action is new user intent, not an audio
        // failure. The player invalidates the stale request before it can
        // schedule an oscillator; keep that cancellation silent in the UI.
        if (error instanceof MorsePlaybackCancelledError) return
        setSounding(null)
        setAudioError(
          error instanceof Error ? error.message : 'Morse audio is unavailable on this device.',
        )
      }
    },
    [stop],
  )

  const toggle = useCallback(
    (glyph: string) => {
      if (sounding?.glyph === glyph) stop()
      else void play(glyph)
    },
    [play, sounding, stop],
  )

  return { sounding, audioError, play, stop, toggle }
}
