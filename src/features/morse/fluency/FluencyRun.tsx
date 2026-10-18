import { fluencyRunLength, type FluencyMode } from '../../../domain/morse/fluency/session'
import { nextRung, previousRung } from '../../../domain/morse/fluency/timing'
import { MorseWordKeyInput } from '../input/MorseWordKeyInput'
import { MorseCharacterSupport } from '../MorseCharacterSupport'
import { useFluencyRun, type FluencyRunProps } from './useFluencyRun'
import './Fluency.css'

const MODE_TITLES: Record<FluencyMode, string> = {
  sprint: 'Sprint',
  ladder: 'Ladder',
  words: 'Words',
  groups: 'Groups',
}

/**
 * One post-acquisition run.
 *
 * The loop is the same for every mode: play it, key it back, judge it, move
 * on. What differs is the material and what the end screen offers, which is
 * why there is one component rather than four.
 *
 */
export function FluencyRun({ mode, rung, progress, focus, only, onProgress, onExit }: FluencyRunProps) {
  const {
    run,
    feedback,
    playing,
    audioError,
    characterIndex,
    setCharacterIndex,
    crested,
    headingRef,
    stimulusEndedAt,
    prompt,
    correctionAudio,
    complete,
    phase,
    armed,
    holding,
    play,
    submit,
    outcome,
    advanceRung,
    continueCorrection,
  } = useFluencyRun({ mode, rung, progress, focus, only, onProgress, onExit })

  const bar = (position: string | null) => (
    <div className="session-bar">
      <p>
        <span className="session-topic">{MODE_TITLES[mode]}</span>
      </p>
      {position && <span className="session-count tabular">{position}</span>}
      <button className="ghost small" type="button" onClick={onExit}>
        Close
      </button>
    </div>
  )

  if (complete) {
    return (
      <section className="session morse-lesson fluency-run">
        {bar(null)}
        <div className="fluency-summary">
          <h1 ref={headingRef} tabIndex={-1}>
            {MODE_TITLES[mode]} done
          </h1>

          <p className="fluency-score">
            <strong className="tabular">
              {outcome.correct} of {outcome.prompts}
            </strong>{' '}
            correct
          </p>

          {outcome.medianLatencyMs !== null && (
            <p className="fluency-metric tabular">
              {(outcome.medianLatencyMs / 1000).toFixed(2)}s typical response
            </p>
          )}

          {outcome.longestStreak > 1 && (
            <p className="fluency-metric tabular">{outcome.longestStreak} in a row</p>
          )}

          {crested && (
            <p className="fluency-crest" role="status">
              Personal best.
            </p>
          )}

          {/* An offer, never a gate. The learner owns the rung; this only says
              what the run suggests. */}
          {mode === 'ladder' && outcome.cleanForAdvance && (
            <button type="button" onClick={() => advanceRung(1)}>
              Try {nextRung(run.rung)} WPM spacing
            </button>
          )}
          {mode === 'ladder' && !outcome.cleanForAdvance && run.rung > 6 && (
            <button className="ghost" type="button" onClick={() => advanceRung(-1)}>
              Ease back to {previousRung(run.rung)} WPM spacing
            </button>
          )}

          <p className="lesson-foot">
            Nothing here changed your saved progress, your check evidence or your completion.
          </p>

          <button className="ghost" type="button" onClick={onExit}>
            Done
          </button>
        </div>
      </section>
    )
  }

  if (!prompt) return null

  return (
    <section className="session morse-lesson fluency-run" data-step="check">
      {bar(`${run.at + 1}/${fluencyRunLength(mode)}`)}

      <div className="fluency-target" data-phase={phase}>
        <h1 className="sr-only">
          Listen and key back {prompt.text.length === 1 ? 'the character' : prompt.text.length + ' characters'}.
        </h1>

        <p className="lesson-task">{prompt.text.length === 1 ? 'Hear it' : 'Hear the whole thing'}</p>

        {/* The prompt is never shown before the answer. Fluency is a sound-first
            surface; printing the target would make it a reading exercise. */}
        <div className="fluency-listen">
          <button
            type="button"
            className="fluency-play"
            onClick={() => void play(stimulusEndedAt.current !== null || playing)}
            disabled={!armed || playing}
          >
            {stimulusEndedAt.current === null && !playing ? 'Play' : 'Play again'}
          </button>
          {prompt.text.length > 1 && (
            <p className="fluency-shape tabular" aria-hidden="true">
              {Array.from(prompt.text).map((_, index) => (
                <span key={index} className={index === characterIndex ? 'is-current' : undefined}>
                  ·
                </span>
              ))}
            </p>
          )}
        </div>

        {audioError && (
          <p className="fluency-audio-error" role="status">
            {audioError}
          </p>
        )}

        {feedback ? (
          <div
            className={`fluency-feedback${feedback.correct ? ' is-correct' : ' is-wrong'}`}
            role="status"
            aria-live="assertive"
          >
            <strong>{feedback.correct ? 'Correct' : 'Miss'}</strong>
            {/* The word is the headline of a word miss, and the broken
                character is marked inside it rather than replacing it. */}
            <span className="fluency-answer">
              {Array.from(feedback.text).map((character, index) => (
                <span
                  key={index}
                  className={feedback.marks[index] === false ? 'is-wrong-char' : undefined}
                >
                  {character}
                </span>
              ))}
            </span>
            {!feedback.correct && (
              <>
                {/* The pattern for the first character that broke. Showing
                    every pattern in a six-letter word buries the one thing
                    the learner needs to look at. */}
                {(() => {
                  const brokeAt = feedback.marks.findIndex((mark) => !mark)
                  const at = brokeAt === -1 ? 0 : brokeAt
                  return <MorseCharacterSupport glyph={feedback.text[at]} pattern={feedback.patterns[at] ?? ''} playing={correctionAudio.sounding?.glyph === feedback.text[at]} onToggle={() => correctionAudio.toggle(feedback.text[at])} audioError={correctionAudio.audioError} />
                })()}
                <button type="button" className="lesson-next" onClick={continueCorrection} disabled={!holding}>
                  Continue
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="fluency-answer-area" inert={!armed}>
            <MorseWordKeyInput
              word={prompt.text}
              locked={!armed || playing}
              // One mounted key for the whole run: the token changes per
              // prompt, and nothing is remounted, so the AudioContext that was
              // unlocked by the learner's first tap survives to the end.
              advanceToken={run.at}
              onProgress={setCharacterIndex}
              onSubmit={submit}
            />
          </div>
        )}
      </div>
    </section>
  )
}
