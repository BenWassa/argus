import { useCallback, useEffect, useRef, useState } from 'react'
import { MorseAudioPlayer } from '../../../domain/morse/audio'
import { canonicalPattern } from '../../../domain/morse/testing/acquisitionProfile'
import {
  FREE_LETTER_PAUSE_MS,
  addPattern,
  addSpace,
  playableText,
  removeLast,
  tokensText,
  type FreeToken,
} from '../../../domain/morse/fluency/freePlay'
import { fluencyTiming, type FluencyRung } from '../../../domain/morse/fluency/timing'
import { MORSE_MAX_ELEMENTS, MorseKeyInput } from '../input/MorseKeyInput'
import './Fluency.css'

interface FreePlayProps {
  rung: FluencyRung
  onExit: () => void
}

type Side = 'key' | 'hear'

/**
 * Free play. Key anything and see what it spells; type anything and hear it.
 *
 * No target, no score, no write path at all — it takes no `onProgress`, so
 * there is nothing it could save. `FluencyBoundary.test.ts` holds it to that.
 */
export function FreePlay({ rung, onExit }: FreePlayProps) {
  const [side, setSide] = useState<Side>('key')
  const [tokens, setTokens] = useState<FreeToken[]>([])
  const [entry, setEntry] = useState('')
  const [letterToken, setLetterToken] = useState(0)
  const [typed, setTyped] = useState('')
  const [playing, setPlaying] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)

  const playerRef = useRef<MorseAudioPlayer | null>(null)
  const pauseTimer = useRef<number | null>(null)
  const playTimer = useRef<number | null>(null)
  const entryRef = useRef('')
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    playerRef.current = new MorseAudioPlayer()
    headingRef.current?.focus({ preventScroll: true })
    return () => {
      if (pauseTimer.current !== null) window.clearTimeout(pauseTimer.current)
      if (playTimer.current !== null) window.clearTimeout(playTimer.current)
      void playerRef.current?.dispose()
      playerRef.current = null
    }
  }, [])

  /** Finish the letter being keyed, if there is one, and clear the key for the next. */
  const finishLetter = useCallback(() => {
    if (pauseTimer.current !== null) window.clearTimeout(pauseTimer.current)
    pauseTimer.current = null
    const pattern = entryRef.current
    if (!pattern) return
    entryRef.current = ''
    setEntry('')
    setTokens((previous) => addPattern(previous, pattern))
    setLetterToken((count) => count + 1)
  }, [])

  const onEntry = useCallback(
    (next: string) => {
      entryRef.current = next
      setEntry(next)
      if (pauseTimer.current !== null) window.clearTimeout(pauseTimer.current)
      pauseTimer.current = window.setTimeout(finishLetter, FREE_LETTER_PAUSE_MS)
    },
    [finishLetter],
  )

  const space = useCallback(() => {
    finishLetter()
    setTokens((previous) => addSpace(previous))
  }, [finishLetter])

  const erase = useCallback(() => {
    if (entryRef.current) {
      if (pauseTimer.current !== null) window.clearTimeout(pauseTimer.current)
      entryRef.current = ''
      setEntry('')
      setLetterToken((count) => count + 1)
      return
    }
    setTokens((previous) => removeLast(previous))
  }, [])

  // Space and Backspace belong to the keying side, the same way `.` and `-`
  // already belong to the key, and never while typing in a field.
  useEffect(() => {
    if (side !== 'key') return
    function onKeyDown(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (event.key === ' ') {
        event.preventDefault()
        space()
      } else if (event.key === 'Backspace') {
        event.preventDefault()
        erase()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [side, space, erase])

  async function play(text: string) {
    const player = playerRef.current
    if (!player || !text) return
    setAudioError(null)
    setPlaying(true)
    try {
      const schedule = await player.play(text, fluencyTiming(rung))
      if (playTimer.current !== null) window.clearTimeout(playTimer.current)
      playTimer.current = window.setTimeout(() => setPlaying(false), schedule.durationMs)
    } catch (error) {
      setPlaying(false)
      setAudioError(error instanceof Error ? error.message : 'Morse audio could not start.')
    }
  }

  function stop() {
    playerRef.current?.cancel()
    if (playTimer.current !== null) window.clearTimeout(playTimer.current)
    setPlaying(false)
  }

  const keyedText = tokensText(tokens)
  const hear = playableText(typed)

  return (
    <section className="session fluency-home free-play">
      <div className="session-bar">
        <p>
          <span className="session-topic">Free play</span>
        </p>
        <button className="ghost small" type="button" onClick={onExit}>
          Close
        </button>
      </div>

      <header className="fluency-head">
        <h1 ref={headingRef} tabIndex={-1}>
          Free play
        </h1>
        <p className="lede-text">
          Nothing to get right. Key your own words and see what they spell, or type anything and
          hear it. Nothing here is saved.
        </p>
      </header>

      <div className="free-play-tabs" role="tablist" aria-label="Free play">
        <button
          type="button"
          role="tab"
          aria-selected={side === 'key'}
          className={side === 'key' ? undefined : 'ghost'}
          onClick={() => setSide('key')}
        >
          Key it
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={side === 'hear'}
          className={side === 'hear' ? undefined : 'ghost'}
          onClick={() => {
            finishLetter()
            setSide('hear')
          }}
        >
          Hear it
        </button>
      </div>

      {side === 'key' ? (
        <div className="free-play-body" role="tabpanel" aria-label="Key it">
          <p className="free-play-output mono" aria-live="polite" aria-label={keyedText ? `Spelled: ${keyedText}` : 'Nothing keyed yet'}>
            {tokens.length === 0 && !entry ? (
              <span className="free-play-placeholder">Start keying</span>
            ) : (
              tokens.map((token, index) =>
                token.kind === 'space' ? (
                  <span key={index} className="free-play-gap" aria-hidden="true">
                    {' '}
                  </span>
                ) : token.character ? (
                  <span key={index} aria-hidden="true">{token.character}</span>
                ) : (
                  // A pattern that spells nothing stays visible, as what was
                  // actually sent, so the mis-key can be seen and fixed.
                  <span key={index} className="free-play-unknown" title={canonicalPattern(token.pattern)} aria-hidden="true">
                    {canonicalPattern(token.pattern)}
                  </span>
                ),
              )
            )}
            {entry && <span className="free-play-cursor" aria-hidden="true">▍</span>}
          </p>

          <p className="note">Pause to finish a letter. Space between words.</p>

          <MorseKeyInput
            expectedLength={MORSE_MAX_ELEMENTS}
            advanceToken={letterToken}
            locked={playing}
            onEntry={onEntry}
            onSubmit={finishLetter}
          />

          <div className="free-play-actions">
            <button type="button" className="ghost" onClick={space}>
              Space
            </button>
            <button type="button" className="ghost" onClick={erase} disabled={tokens.length === 0 && !entry}>
              Delete
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                finishLetter()
                setTokens([])
              }}
              disabled={tokens.length === 0 && !entry}
            >
              Clear
            </button>
            <button type="button" onClick={() => (playing ? stop() : void play(keyedText))} disabled={!keyedText && !playing}>
              {playing ? 'Stop' : 'Play it back'}
            </button>
          </div>
        </div>
      ) : (
        <div className="free-play-body" role="tabpanel" aria-label="Hear it">
          <label className="sr-only" htmlFor="free-play-text">
            Text to hear
          </label>
          <textarea
            id="free-play-text"
            className="field mono free-play-text"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            placeholder="Type a word or a sentence"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            rows={3}
          />
          {hear.unsupported.length > 0 && (
            <p className="note">
              No Morse here for {hear.unsupported.join(' ')} — {hear.unsupported.length === 1 ? 'it is' : 'they are'} skipped.
            </p>
          )}
          <div className="free-play-actions">
            <button type="button" onClick={() => (playing ? stop() : void play(hear.playable))} disabled={!hear.playable && !playing}>
              {playing ? 'Stop' : 'Play'}
            </button>
          </div>
        </div>
      )}

      {audioError && (
        <p className="fluency-audio-error" role="status">
          {audioError}
        </p>
      )}
      <p className="note free-play-foot">Plays at your spacing: {rung} WPM, characters at 20.</p>
    </section>
  )
}
