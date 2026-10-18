import type { ReactNode } from 'react'
import { correctionLetter } from '../../../domain/morse/correction'
import type { MorseLetter } from '../../../domain/morse/code'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MorseAudioPlayer } from '../../../domain/morse/audio'
import { MORSE_FIGURES, MORSE_LETTERS, MORSE_PUNCTUATION } from '../../../domain/morse/code'
import { canonicalPattern } from '../../../domain/morse/testing/acquisitionProfile'
import {
  COPY_LEVEL_INFO,
  COPY_PLAYS_PER_PROMPT,
  copyBestKey,
  copyPrompts,
  copyRunScore,
  judgeCopy,
  type CopyJudgement,
  type CopyLevel,
} from '../../../domain/morse/fluency/copy'
import { recordFluencyBest, type MorseFluencyProgress } from '../../../domain/morse/fluency/progress'
import { fluencyTiming, type FluencyRung } from '../../../domain/morse/fluency/timing'
import { fire } from '../../../shared/haptics'
import { MorseCharacterSupport } from '../MorseCharacterSupport'
import { useMorseAudio } from '../useMorseAudio'
import { SessionFrame, SessionCorrect, RoundResult } from '../session/SessionFrame'
import './Fluency.css'

interface CopyRunProps {
  /** Session-level controls rendered under the frame header. */
  toolbar?: ReactNode
  level: CopyLevel
  rung: FluencyRung
  progress: MorseFluencyProgress
  /** Letters the learner is missing, weighted up in the letters level. */
  focus?: ReadonlySet<MorseLetter>
  /** The single durable write, handed in. See `FluencyRun` for why. */
  onProgress: (next: MorseFluencyProgress) => void
  onLevel: (level: CopyLevel) => void
  onExit: () => void
  seed?: number
}

/** A correct copy holds for the scale-2 budget, then moves on by itself. */
const CORRECT_HOLD_MS = 900

const INTRODUCTIONS = {
  figures: {
    heading: 'The ten figures',
    table: MORSE_FIGURES,
  },
  punctuation: {
    heading: 'Four marks of punctuation',
    table: MORSE_PUNCTUATION,
  },
} as const

type Phase =
  | { kind: 'intro' }
  | { kind: 'asking' }
  | { kind: 'feedback'; judgement: CopyJudgement }
  | { kind: 'done' }

/**
 * One Copy run: hear it, write it down.
 *
 * The learner may type while it plays, which is how copying actually works,
 * and may hear each prompt twice — once, and once more — because a second
 * hearing is ordinary in copy practice and unlimited replays would turn it
 * into reading a recording. Enter drives the whole loop from the keyboard:
 * play, answer, continue.
 *
 * Imports no store, no scheduler and no evidence recorder, for the same reason
 * `FluencyRun` does not; `FluencyBoundary.test.ts` holds both to it.
 */
export function CopyRun({ level, rung, progress, focus, onProgress, onLevel, onExit, toolbar, seed = 0 }: CopyRunProps) {
  const info = COPY_LEVEL_INFO[level]
  const correctionAudio = useMorseAudio()
  const [prompts] = useState(() => copyPrompts(level, progress, seed, focus))
  const [at, setAt] = useState(0)
  const [phase, setPhase] = useState<Phase>(() => (info.introduces ? { kind: 'intro' } : { kind: 'asking' }))
  const [typed, setTyped] = useState('')
  const [plays, setPlays] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [judgements, setJudgements] = useState<CopyJudgement[]>([])

  const playerRef = useRef<MorseAudioPlayer | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const playTimer = useRef<number | null>(null)
  const timing = fluencyTiming(rung)
  const prompt = prompts[at]

  useEffect(() => {
    playerRef.current = new MorseAudioPlayer()
    return () => {
      if (playTimer.current !== null) window.clearTimeout(playTimer.current)
      void playerRef.current?.dispose()
      playerRef.current = null
    }
  }, [])

  // Focus stays in the field for the whole run, feedback included, so a phone
  // keyboard does not drop and rise between prompts and Enter can continue.
  useEffect(() => {
    if (phase.kind === 'done' || phase.kind === 'intro') headingRef.current?.focus({ preventScroll: true })
    else inputRef.current?.focus({ preventScroll: true })
  }, [phase, at])

  async function play(text: string, counted: boolean) {
    const player = playerRef.current
    if (!player) return
    setAudioError(null)
    setPlaying(true)
    if (counted) setPlays((count) => count + 1)
    try {
      const schedule = await player.play(text, timing)
      if (playTimer.current !== null) window.clearTimeout(playTimer.current)
      playTimer.current = window.setTimeout(() => setPlaying(false), schedule.durationMs)
    } catch (error) {
      setPlaying(false)
      setAudioError(error instanceof Error ? error.message : 'Morse audio could not start.')
    }
  }

  const canPlay = phase.kind === 'asking' && !playing && plays < COPY_PLAYS_PER_PROMPT
  const canCheck = phase.kind === 'asking' && plays > 0 && typed.trim().length > 0

  function check() {
    if (!canCheck || !prompt) return
    // Answering mid-playback is allowed; the rest of the prompt stops with it.
    playerRef.current?.cancel()
    if (playTimer.current !== null) window.clearTimeout(playTimer.current)
    setPlaying(false)
    const judgement = judgeCopy(prompt, typed)
    setJudgements((previous) => [...previous, judgement])
    fire(judgement.correct ? (prompt.length > 1 ? 'word' : 'settle') : 'miss')
    setPhase({ kind: 'feedback', judgement })
  }

  function advance() {
    correctionAudio.stop()
    const next = at + 1
    setTyped('')
    setPlays(0)
    if (next >= prompts.length) {
      setPhase({ kind: 'done' })
      return
    }
    setAt(next)
    setPhase({ kind: 'asking' })
    // The learner's own tap or keypress got here, or the audio is already
    // unlocked from the first prompt; either way the next one can start itself.
    void play(prompts[next], true)
  }

  useEffect(() => {
    if (phase.kind !== 'feedback' || !phase.judgement.correct) return
    const timer = window.setTimeout(advance, CORRECT_HOLD_MS)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const score = useMemo(() => copyRunScore(judgements), [judgements])
  const committed = useRef(false)
  useEffect(() => {
    if (phase.kind !== 'done' || committed.current) return
    committed.current = true
    const hadBest = progress.bests[copyBestKey(level)] !== undefined
    const result = recordFluencyBest(progress, copyBestKey(level), score)
    // A first run is a baseline, not a best; celebrating it would make the
    // scale-4 moment the most common one on the surface.
    if (result.improved && hadBest) {
      fire('crest')
    }
    onProgress(result.progress)
  }, [phase, progress, level, score, onProgress])

  const frame = { kind: 'listen' as const, title: 'Listen', onClose: onExit, toolbar, progress: { current: phase.kind === 'done' ? prompts.length : at + 1, total: prompts.length } }

  if (phase.kind === 'intro' && info.introduces) {
    const intro = INTRODUCTIONS[info.introduces]
    return (
      <SessionFrame {...frame} className="fluency-run copy-run">
        <div className="fluency-head">
          <h1 ref={headingRef} tabIndex={-1}>
            {intro.heading}
          </h1>
        </div>
        <ul className="copy-table" aria-label={intro.heading}>
          {Object.entries(intro.table).map(([glyph, pattern]) => (
            <li key={glyph}>
              <button type="button" className="copy-table-entry" onClick={() => void play(glyph, false)}>
                <span className="copy-table-glyph">{glyph}</span>
                <span className="mono copy-table-pattern">{canonicalPattern(pattern)}</span>
              </button>
            </li>
          ))}
        </ul>
        {audioError && (
          <p className="fluency-audio-error" role="status">
            {audioError}
          </p>
        )}
        <button
          type="button"
          className="copy-start"
          onClick={() => {
            setPhase({ kind: 'asking' })
            void play(prompts[0], true)
          }}
        >
          Start copying
        </button>
      </SessionFrame>
    )
  }

  if (phase.kind === 'done') {
    return <SessionFrame {...frame} className="fluency-run copy-run">
      <RoundResult correct={judgements.filter(judgement => judgement.correct).length} total={prompts.length} onAgain={() => onLevel(level)} onDone={onExit} />
    </SessionFrame>
  }

  if (!prompt) return null
  const judgement = phase.kind === 'feedback' ? phase.judgement : null
  const correctionGlyph = judgement && !judgement.correct ? correctionLetter(judgement.expected, judgement.given) : null

  return (
    <SessionFrame {...frame} className="fluency-run copy-run" data-step="check">

      <div className="fluency-target">
        <h1 className="sr-only">Listen, then type what you heard.</h1>
        <p className="lesson-task">Hear it, write it</p>

        <div className="fluency-listen">
          <button
            type="button"
            className="fluency-play"
            onClick={() => void play(prompt, true)}
            disabled={!canPlay}
          >
            {playing ? 'Playing' : plays === 0 ? 'Play' : plays < COPY_PLAYS_PER_PROMPT ? 'Play once more' : 'Heard twice'}
          </button>
        </div>

        {audioError && (
          <p className="fluency-audio-error" role="status">
            {audioError}
          </p>
        )}

        <form
          className="copy-answer"
          onSubmit={(event) => {
            event.preventDefault()
            if (phase.kind === 'feedback') {
              if (!phase.judgement.correct) advance()
              return
            }
            if (plays === 0 && canPlay) void play(prompt, true)
            else check()
          }}
        >
          <label className="sr-only" htmlFor="copy-input">
            What you heard
          </label>
          <input
            id="copy-input"
            ref={inputRef}
            className="field mono copy-input"
            type="text"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            readOnly={phase.kind !== 'asking'}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            enterKeyHint={plays === 0 ? 'go' : 'done'}
            placeholder={plays === 0 ? 'Press Play, then type' : 'Type what you heard'}
          />
          {phase.kind === 'asking' && (
            <button type="submit" disabled={!canCheck}>
              Check
            </button>
          )}
        </form>

        {judgement && (
          <div
            className={`fluency-feedback copy-feedback${judgement.correct ? ' is-correct' : ' is-wrong'}`}
            role="status"
            aria-live="assertive"
          >
            {judgement.correct ? <SessionCorrect target={judgement.expected} announce={false} /> : <strong>{Math.round(judgement.accuracy * 100)}%</strong>}
            <p className="copy-expected">
              {judgement.words.map((word, index) => (
                <span key={index} className={word.ok ? undefined : 'is-wrong-char'}>
                  {word.text}
                </span>
              ))}
            </p>
            {!judgement.correct && (
              <>
                <p className="copy-given mono">
                  You wrote <span>{judgement.given || '—'}</span>
                </p>
                {correctionGlyph && (
                  <MorseCharacterSupport
                    glyph={correctionGlyph}
                    pattern={MORSE_LETTERS[correctionGlyph]}
                    playing={correctionAudio.sounding?.glyph === correctionGlyph}
                    onToggle={() => correctionAudio.toggle(correctionGlyph)}
                    audioError={correctionAudio.audioError}
                  />
                )}
                <button type="button" className="lesson-next" onClick={advance}>
                  Continue
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </SessionFrame>
  )
}
