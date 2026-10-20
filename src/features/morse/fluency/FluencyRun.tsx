import { decodePattern } from '../../../domain/morse/code'
import { RoundResult, SessionCorrect, SessionFrame } from '../../../shared/ui/SessionFrame'
import { MorseWordKeyInput } from '../input/MorseWordKeyInput'
import { MorseCharacterSupport } from '../MorseCharacterSupport'
import { MorseListenPlay } from '../MorseListenPlay'
import './Fluency.css'
import { useFluencyRun, type FluencyRunProps } from './useFluencyRun'

export function FluencyRun({ mode, rung, progress, focus, only, allowed, onProgress, onExit, toolbar }: FluencyRunProps) {
  const { run, feedback, playing, audioError, characterIndex, setCharacterIndex, stimulusEndedAt, prompt, correctionAudio, complete, phase, armed, holding, play, submit, outcome, continueCorrection, frame, again } = useFluencyRun({ mode, rung, progress, focus, only, allowed, onProgress, onExit, toolbar })
  if (complete) {
    return <SessionFrame {...frame} className="morse-lesson fluency-run">
      <RoundResult extra={toolbar} correct={outcome.correct} total={outcome.prompts} onAgain={again} onDone={onExit} />
    </SessionFrame>
  }

  if (!prompt) return null

  return (
    <SessionFrame {...frame} className="morse-lesson fluency-run" data-step="check">

      <div className="fluency-target" data-phase={phase}>
        <h2 className="session-prompt-heading sr-only">
          Listen and key back {prompt.text.length === 1 ? 'the character' : prompt.text.length + ' characters'}.
        </h2>

        {/* One or two words: what is being played (#263). */}
        <p className="lesson-task">{prompt.text.length === 1 ? 'Letters' : mode === 'groups' ? 'Groups' : 'Words'}</p>

        {/* The prompt is never shown before the answer. Fluency is a sound-first
            surface; printing the target would make it a reading exercise. */}
        <div className="fluency-listen">
          <MorseListenPlay
            label={stimulusEndedAt.current === null && !playing ? 'Play' : 'Play again'}
            icon={stimulusEndedAt.current === null && !playing ? 'play' : 'replay'}
            onClick={() => void play(stimulusEndedAt.current !== null || playing)}
            disabled={!armed || playing}
          />
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

        {feedback?.correct ? (
          <div className="fluency-feedback is-correct" role="status" aria-live="assertive">
            <SessionCorrect target={feedback.text} announce={false} />
          </div>
        ) : feedback ? (() => {
          // The pattern for the first character that broke. Showing every
          // pattern in a six-letter word buries the one thing the learner
          // needs to look at. The word is still the headline of the answer,
          // with the broken character marked inside it.
          const brokeAt = feedback.marks.findIndex((mark) => !mark)
          const at = brokeAt === -1 ? 0 : brokeAt
          const keyed = feedback.response.map((pattern) => decodePattern(pattern) ?? '?').join('')
          return <SessionCorrect className="fluency-miss" miss={{
            said: keyed,
            saidLabel: 'You keyed',
            answer: <>
              <span className="fluency-answer">
                {Array.from(feedback.text).map((character, index) => (
                  <span key={index} className={feedback.marks[index] === false ? 'is-wrong-char' : undefined}>{character}</span>
                ))}
              </span>
              <MorseCharacterSupport glyph={feedback.text[at]} pattern={feedback.patterns[at] ?? ''} playing={correctionAudio.sounding?.glyph === feedback.text[at]} onToggle={() => correctionAudio.toggle(feedback.text[at])} audioError={correctionAudio.audioError} />
            </>,
            onContinue: continueCorrection,
            continueDisabled: !holding,
          }} />
        })() : (
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
    </SessionFrame>
  )

}
