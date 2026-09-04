import { useCallback, useEffect, useRef, useState } from 'react'
import { DEFAULT_MORSE_TIMING } from '../../lib/morse'
import { MorseAudioPlayer } from '../../lib/morseAudio'
import { canonicalNotation, spokenRhythm } from '../../lib/morseMnemonics'
import type { MorseCharacterLearnItem } from '../../lib/types'
import { MorseMnemonic } from './MorseMnemonic'

interface Sounding {
  glyph: string
  index: number | null
}

/**
 * Audio for one packet. One player, one character at a time: starting a card
 * cancels whatever was playing, so the illuminated element on screen and the
 * tone in the ear are always the same event.
 *
 * Playback is only ever started from a click. Nothing here plays on mount, on
 * navigation or on re-render.
 */
function usePacketAudio() {
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
    return () => {
      clearTimers()
      void playerRef.current?.dispose()
      playerRef.current = null
    }
  }, [clearTimers])

  const play = useCallback(
    async (glyph: string) => {
      stop()
      setAudioError(null)
      try {
        playerRef.current ??= new MorseAudioPlayer()
        const schedule = await playerRef.current.play(glyph, DEFAULT_MORSE_TIMING)
        setSounding({ glyph, index: null })

        // Element illumination is driven by the same schedule the tone is, so
        // the two channels cannot drift; each remains usable on its own.
        let offset = 15
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
        setSounding(null)
        setAudioError(
          error instanceof Error ? error.message : 'Morse audio is unavailable on this device.',
        )
      }
    },
    [stop],
  )

  return { sounding, audioError, play, stop }
}

function MorseCharacterCard({
  character,
  sounding,
  onPlay,
  onStop,
}: {
  character: MorseCharacterLearnItem
  sounding: Sounding | null
  onPlay: (glyph: string) => void
  onStop: () => void
}) {
  const isSounding = sounding?.glyph === character.glyph
  const rhythm = spokenRhythm(character.pattern)

  return (
    <li className={`morse-card${isSounding ? ' is-sounding' : ''}`}>
      <MorseMnemonic
        glyph={character.glyph}
        pattern={character.pattern}
        textLabel={character.textLabel}
        activeIndex={isSounding ? sounding.index : null}
      />

      <p className="morse-canonical">
        <span className="morse-notation" aria-hidden="true">
          {canonicalNotation(character.pattern)}
        </span>
        <span className="morse-rhythm">{rhythm}</span>
      </p>

      <button
        className="ghost small morse-play"
        type="button"
        onClick={() => (isSounding ? onStop() : onPlay(character.audioText))}
      >
        {isSounding ? `Stop ${character.glyph}` : `Play ${character.glyph}`}
      </button>
    </li>
  )
}

/**
 * The Learn acquisition surface for a packet of characters.
 *
 * Learn stays what it has always been: ungraded first exposure and a reference
 * you can come back to. Nothing here is scored, nothing is hidden behind
 * progress, and no packet is locked — the acquisition ladder lives in Test
 * (D3), and this surface must not become a second scheduler.
 */
export function MorseCharacterPacket({ characters }: { characters: MorseCharacterLearnItem[] }) {
  const { sounding, audioError, play, stop } = usePacketAudio()

  return (
    <div className="morse-packet">
      <ul className="morse-cards">
        {characters.map((character) => (
          <MorseCharacterCard
            key={character.glyph}
            character={character}
            sounding={sounding}
            onPlay={play}
            onStop={stop}
          />
        ))}
      </ul>

      <p className="morse-packet-note">
        Each drawing is the character’s own timing: a dit is one unit, a dah is three, and the gap
        between them is one. Read it left to right, in the order it is keyed.
      </p>

      <p className="sr-only" aria-live="polite">
        {sounding ? `Playing ${sounding.glyph}.` : ''}
      </p>

      {audioError && (
        <p className="morse-audio-error" role="status">
          {audioError} The written pattern and the dit/dah reading above carry the same information.
        </p>
      )}
    </div>
  )
}
