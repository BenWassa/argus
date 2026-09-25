import { useEffect, useMemo, useRef, useState } from 'react'
import { MorseAudioPlayer } from '../../../domain/morse/audio'
import { MORSE_FIGURES, MORSE_PUNCTUATION } from '../../../domain/morse/code'
import { canonicalPattern } from '../../../domain/morse/testing/acquisitionProfile'
import {
  COPY_CLEAR_ACCURACY,
  COPY_LEVELS,
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
import './Fluency.css'

interface CopyRunProps {
  level: CopyLevel
  rung: FluencyRung
  progress: MorseFluencyProgress
  /** The single durable write, handed in. See `FluencyRun` for why. */
  onProgress: (next: MorseFluencyProgress) => void
  onLevel: (level: CopyLevel) => void
  onExit: () => void
}

/** A correct copy holds for the scale-2 budget, then moves on by itself. */
const CORRECT_HOLD_MS = 900

const INTRODUCTIONS = {
  figures: {
    heading: 'The ten figures',
    lines: [
      'Every figure is five marks long, so you are listening for where the switch from dits to dahs falls.',
      '1 to 5 start with dits: the figure is how many dits come first. 6 to 9 start with dahs: take away 5 and that is how many dahs come first. 0 is five dahs.',
    ],
    table: MORSE_FIGURES,
  },
  punctuation: {
    heading: 'Four marks of punctuation',
    lines: [
      'The full stop is A three times. The comma and the question mark are both symmetrical — the comma is dahs outside, the question mark is dits outside. The slash is D and N run together.',
    ],
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
export function CopyRun({ level, rung, progress, onProgress, onLevel, onExit }: CopyRunProps) {
  const info = COPY_LEVEL_INFO[level]
  const [prompts] = useState(() => copyPrompts(level, progress, Date.now()))
  const [at, setAt] = useState(0)
  const [phase, setPhase] = useState<Phase>(() => (info.introduces ? { kind: 'intro' } : { kind: 'asking' }))
  const [typed, setTyped] = useState('')
  const [plays, setPlays] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [audioError, setAudioError] = useState<string | null>(null)
  const [judgements, setJudgements] = useState<CopyJudgement[]>([])
  const [crested, setCrested] = useState(false)

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
      setCrested(true)
      fire('crest')
    }
    onProgress(result.progress)
  }, [phase, progress, level, score, onProgress])

  const bar = (position: string | null) => (
    <div className="session-bar">
      <p>
        <span className="session-topic">Copy · {info.title}</span>
      </p>
      {position && <span className="session-count tabular">{position}</span>}
      <button className="ghost small" type="button" onClick={onExit}>
        Close
      </button>
    </div>
  )

  if (phase.kind === 'intro' && info.introduces) {
    const intro = INTRODUCTIONS[info.introduces]
    return (
      <section className="session fluency-run copy-run">
        {bar(null)}
        <div className="fluency-head">
          <h1 ref={headingRef} tabIndex={-1}>
            {intro.heading}
          </h1>
          {intro.lines.map((line) => (
            <p key={line} className="lede-text">
              {line}
            </p>
          ))}
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
        <p className="note copy-table-note">Tap any of them to hear it.</p>
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
      </section>
    )
  }

  if (phase.kind === 'done') {
    const cleared = score >= COPY_CLEAR_ACCURACY * 100
    const exact = judgements.filter((judgement) => judgement.correct).length
    const following = COPY_LEVELS[COPY_LEVELS.indexOf(level) + 1]
    return (
      <section className="session fluency-run copy-run">
        {bar(null)}
        <div className="fluency-summary">
          <h1 ref={headingRef} tabIndex={-1}>
            {info.title} done
          </h1>
          <p className="fluency-score">
            <strong className="tabular">{score}%</strong> of characters copied
          </p>
          <p className="fluency-metric tabular">
            {exact} of {judgements.length} exactly right
          </p>
          {crested && (
            <p className="fluency-crest" role="status">
              Personal best.
            </p>
          )}
          {cleared && following ? (
            <>
              <p className="note">Ninety percent or better. {COPY_LEVEL_INFO[following].title} is next.</p>
              <button type="button" onClick={() => onLevel(following)}>
                Go on to {COPY_LEVEL_INFO[following].title.toLowerCase()}
              </button>
            </>
          ) : cleared ? (
            <p className="note">
              Every level at ninety percent or better. Take the spacing down a notch and go round again.
            </p>
          ) : (
            <p className="note">Ninety percent clears the level. Another run draws new material.</p>
          )}
          <button className={cleared && following ? 'ghost' : undefined} type="button" onClick={() => onLevel(level)}>
            Another run
          </button>
          <p className="lesson-foot">
            Nothing here changed your saved progress, your check evidence or your completion.
          </p>
          <button className="ghost" type="button" onClick={onExit}>
            Back to fluency
          </button>
        </div>
      </section>
    )
  }

  if (!prompt) return null
  const judgement = phase.kind === 'feedback' ? phase.judgement : null

  return (
    <section className="session fluency-run copy-run" data-step="check">
      {bar(`${at + 1}/${prompts.length}`)}

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
            <strong>{judgement.correct ? 'Correct' : `${Math.round(judgement.accuracy * 100)}%`}</strong>
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
                <button type="button" className="lesson-next" onClick={advance}>
                  Continue
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
