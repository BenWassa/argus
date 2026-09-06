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
 * Playback starts only from an explicit user action. One player and one
 * character run at a time; starting another cancels the prior schedule.
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

  const clearError = useCallback(() => setAudioError(null), [])

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

        let offset = MORSE_AUDIO_START_DELAY_MS
        let element = 0
        for (const event of schedule.events) {
          if (event.kind === 'signal') {
            const at = offset
            const index = element
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

  return { sounding, audioError, clearError, play, stop, toggle }
}
