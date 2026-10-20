import { MORSE_FIGURES, MORSE_LETTERS, MORSE_PUNCTUATION } from '../../../domain/morse/code'
import { correctionLetter } from '../../../domain/morse/correction'
import {
  COPY_PLAYS_PER_PROMPT
} from '../../../domain/morse/fluency/copy'
import { canonicalPattern } from '../../../domain/morse/testing/acquisitionProfile'
import { RoundResult, SessionCorrect, SessionFrame } from '../../../shared/ui/SessionFrame'
import { MorseCharacterSupport } from '../MorseCharacterSupport'
import { MorseListenPlay } from '../MorseListenPlay'
import './Fluency.css'
import { useCopyRun, type CopyRunProps } from './useCopyRun'
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
export function CopyRun({ level, rung, progress, focus, allowed, onProgress, onLevel, onExit, toolbar, seed = 0 }: CopyRunProps) {
  const { info, correctionAudio, prompts, phase, setPhase, typed, setTyped, plays, playing, audioError, judgements, inputRef, headingRef, prompt, play, canPlay, canCheck, check, advance, frame } = useCopyRun({ level, rung, progress, focus, allowed, onProgress, onLevel, onExit, toolbar, seed })
  if (phase.kind === 'intro' && info.introduces) {
    const intro = INTRODUCTIONS[info.introduces]
    return (
      <SessionFrame {...frame} className="fluency-run copy-run">
        <div className="fluency-head">
          <h2 ref={headingRef} tabIndex={-1} className="session-prompt-heading">
            {intro.heading}
          </h2>
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
      <RoundResult extra={toolbar} correct={judgements.filter(judgement => judgement.correct).length} total={prompts.length} onAgain={() => onLevel(level)} onDone={onExit} />
    </SessionFrame>
  }

  if (!prompt) return null
  const judgement = phase.kind === 'feedback' ? phase.judgement : null
  const correctionGlyph = judgement && !judgement.correct ? correctionLetter(judgement.expected, judgement.given) : null

  return (
    <SessionFrame {...frame} className="fluency-run copy-run" data-step="check">

      <div className="fluency-target">
        <h2 className="session-prompt-heading sr-only">Listen, then type what you heard.</h2>
        <p className="lesson-task">Copy</p>

        {/* The shared Listen control (#263); two hearings, counted under it. */}
        <div className="fluency-listen">
          <MorseListenPlay
            label={playing ? 'Playing' : plays === 0 ? 'Play' : plays < COPY_PLAYS_PER_PROMPT ? 'Play once more' : 'Heard twice'}
            icon={plays === 0 ? 'play' : 'replay'}
            onClick={() => void play(prompt, true)}
            disabled={!canPlay}
            readout={`${Math.min(plays, COPY_PLAYS_PER_PROMPT)} / ${COPY_PLAYS_PER_PROMPT}`}
          />
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

        {judgement?.correct && (
          <div className="fluency-feedback copy-feedback is-correct" role="status" aria-live="assertive">
            <SessionCorrect target={judgement.expected} announce={false} />
            <p className="copy-expected">
              {judgement.words.map((word, index) => <span key={index}>{word.text}</span>)}
            </p>
          </div>
        )}

        {judgement && !judgement.correct && (
          <SessionCorrect className="copy-miss" miss={{
            said: judgement.given,
            saidLabel: 'You wrote',
            answer: <>
              <p className="copy-expected">
                {judgement.words.map((word, index) => (
                  <span key={index} className={word.ok ? undefined : 'is-wrong-char'}>{word.text}</span>
                ))}
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
            </>,
            onContinue: advance,
          }} />
        )}
      </div>
    </SessionFrame>
  )

}
