import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  buildCuePayload,
  canonicalPattern,
  isCorrectResponse,
  patternReading,
  promptFor,
  type AcquisitionCharacter,
} from '../../lib/acquisition'
import { DEFAULT_MORSE_TIMING } from '../../lib/morse'
import {
  MORSE_AUDIO_START_DELAY_MS,
  MorseAudioPlayer,
  MorsePlaybackCancelledError,
} from '../../lib/morseAudio'
import type { CueRung } from '../../lib/cueLadder'
import { MorseMnemonic } from '../learn/MorseMnemonic'
import { MorseKeyInput } from '../morse/MorseKeyInput'
import './ProgressiveMorseCue.css'

export interface ProgressiveAnswer {
  correct: boolean
  /** Recorded from the first session. Gates nothing. */
  latencyMs: number
  response: string
}

interface ProgressiveCardProps {
  character: AcquisitionCharacter
  rung: CueRung
  /** Kept temporarily at the call boundary while Session sheds old distractor plumbing. */
  options?: string[]
  onAnswer: (answer: ProgressiveAnswer) => void
  /** Changes whenever a new card is shown, resetting every local state. */
  cardKey: string
  now?: () => number
}

function defaultNow(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now()
}

function useCueAudio(audioText: string | undefined) {
  const playerRef = useRef<MorseAudioPlayer | null>(null)
  const endTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [playing, setPlaying] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)

  const stop = useCallback(() => {
    if (endTimerRef.current) clearTimeout(endTimerRef.current)
    endTimerRef.current = null
    playerRef.current?.cancel()
    setPlaying(false)
  }, [])

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
      if (endTimerRef.current) clearTimeout(endTimerRef.current)
      void playerRef.current?.dispose()
      playerRef.current = null
    }
  }, [stop])

  const toggle = useCallback(async () => {
    if (!audioText) return
    if (playing) {
      stop()
      return
    }
    setAudioError(null)
    try {
      playerRef.current ??= new MorseAudioPlayer()
      const schedule = await playerRef.current.play(audioText, DEFAULT_MORSE_TIMING)
      setPlaying(true)
      endTimerRef.current = setTimeout(
        () => setPlaying(false),
        MORSE_AUDIO_START_DELAY_MS + schedule.durationMs + 80,
      )
    } catch (error) {
      if (error instanceof MorsePlaybackCancelledError) return
      setPlaying(false)
      setAudioError(error instanceof Error ? error.message : 'Morse audio is unavailable on this device.')
    }
  }, [audioText, playing, stop])

  return { playing, audioError, toggle }
}

function CuePanel({ rung, character }: { rung: CueRung; character: AcquisitionCharacter }) {
  const cue = buildCuePayload(rung, character)
  const { playing, audioError, toggle } = useCueAudio(cue.audioText)
  if (
    cue.elementCount === undefined &&
    cue.revealedPattern === undefined &&
    cue.verbalBeats === undefined &&
    cue.audioText === undefined
  ) return null

  return (
    <div className="test-cue" data-rung={cue.rungId}>
      <p className="test-cue-label">Cue</p>

      {cue.verbalBeats && cue.verbalBeats.length > 0 && (
        <div className="test-cue-verbal">
          <span className="sr-only">
            {`Opening mnemonic: ${cue.verbalBeats.map((beat) => `${beat.text} ${beat.length}`).join(', ')}. ${cue.hiddenCount ?? 0} more ${cue.hiddenCount === 1 ? 'beat' : 'beats'} hidden.`}
          </span>
          <span className="test-cue-verbal-beats" aria-hidden="true">
            {cue.verbalBeats.map((beat, index) => (
              <span className={`test-cue-verbal-beat is-${beat.length}`} key={`${beat.text}-${index}`}>
                <strong>{beat.text}</strong>
                <small>{beat.length === 'short' ? 'short ·' : 'hold —'}</small>
              </span>
            ))}
            {cue.hiddenCount ? <span className="test-cue-hidden">{'? '.repeat(cue.hiddenCount).trim()}</span> : null}
          </span>
        </div>
      )}

      {cue.mnemonicId && cue.revealedRawPattern && (
        <div className="test-cue-svg">
          <MorseMnemonic
            glyph={character.glyph}
            pattern={cue.revealedRawPattern}
            textLabel={`Timing cue for ${character.glyph}: starts ${cue.revealedReading}, with ${cue.hiddenCount} more to recall.`}
          />
        </div>
      )}

      {cue.revealedPattern && (
        <p className="test-cue-pattern">
          <span aria-hidden="true">
            {cue.revealedPattern}
            {cue.hiddenCount ? ` ${'?'.repeat(cue.hiddenCount)}` : ''}
          </span>
          <span className="sr-only">
            {`Starts ${cue.revealedReading}, with ${cue.hiddenCount} more to recall.`}
          </span>
        </p>
      )}
      {cue.elementCount !== undefined && (
        <p className="test-cue-length">
          {cue.elementCount} {cue.elementCount === 1 ? 'element' : 'elements'} in total
        </p>
      )}

      {cue.audioText && (
        <div className="test-cue-audio">
          <button className="ghost small" type="button" onClick={() => void toggle()}>
            {playing ? 'Stop canonical rhythm' : 'Play canonical rhythm'}
          </button>
          <span className="test-cue-audio-note">Support cue · device media volume</span>
          {audioError && <p className="test-cue-audio-error" role="status">{audioError}</p>}
        </div>
      )}
    </div>
  )
}

/**
 * The rung decides direction and scaffolding, not the forward response widget.
 * Printed letter → Morse is always shared keyed production; printed pattern →
 * letter is typed entry. Visual pattern-choice rendering no longer exists here.
 */
export function ProgressiveCard({
  character,
  rung,
  onAnswer,
  cardKey,
  now = defaultNow,
}: ProgressiveCardProps) {
  const [entry, setEntry] = useState('')
  const [result, setResult] = useState<ProgressiveAnswer | null>(null)
  const startedAt = useRef(now())
  const nextRef = useRef<HTMLButtonElement>(null)
  const entryRef = useRef<HTMLInputElement>(null)

  const prompt = useMemo(() => promptFor(rung, character), [rung, character])

  useEffect(() => {
    setEntry('')
    setResult(null)
    startedAt.current = now()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardKey])

  useEffect(() => {
    if (result) nextRef.current?.focus({ preventScroll: true })
    else if (rung.response === 'entry') entryRef.current?.focus({ preventScroll: true })
  }, [result, rung.response, cardKey])

  function submit(response: string) {
    if (result) return
    setResult({
      correct: isCorrectResponse(rung, character, response),
      latencyMs: Math.max(0, Math.round(now() - startedAt.current)),
      response,
    })
  }

  function advance() {
    if (result) onAnswer(result)
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!result) return
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  return (
    <section className="progressive-card" aria-labelledby="prompt-heading">
      <p className="test-rung">
        <span className="test-rung-name">{rung.label}</span>
        <span className="test-rung-instruction">{rung.instruction}</span>
      </p>

      <div className="test-prompt">
        <h1 id="prompt-heading" className="test-prompt-value">
          {prompt}
        </h1>
        {rung.direction === 'answer-to-prompt' && (
          <p className="sr-only">{patternReading(character.pattern)}</p>
        )}
      </div>

      {!result && <CuePanel rung={rung} character={character} />}

      {!result && rung.response === 'production' && (
        <div className="test-production">
          <MorseKeyInput onSubmit={submit} />
        </div>
      )}

      {!result && rung.response === 'entry' && (
        <form
          className="test-entry-form"
          onSubmit={(event) => {
            event.preventDefault()
            if (entry.trim()) submit(entry)
          }}
        >
          <label className="test-entry-label" htmlFor="character-entry">
            Which character is this?
          </label>
          <input
            ref={entryRef}
            id="character-entry"
            className="field test-entry-input"
            type="text"
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            maxLength={1}
            value={entry}
            onChange={(event) => setEntry(event.target.value)}
          />
          <button className="test-submit" type="submit" disabled={entry.trim().length === 0}>
            Submit
          </button>
        </form>
      )}

      {result && (
        <div className={`test-feedback${result.correct ? ' is-correct' : ''}`} role="status">
          <p className="test-feedback-verdict">{result.correct ? 'Correct' : 'Not this time'}</p>
          <p className="test-feedback-answer">
            <span className="test-feedback-glyph">{character.glyph}</span>
            <span className="mono" aria-hidden="true">{canonicalPattern(character.pattern)}</span>
            <span className="sr-only">{character.reading}</span>
          </p>
          <button ref={nextRef} className="test-next" type="button" onClick={advance}>
            Next
          </button>
        </div>
      )}
    </section>
  )
}
