import { useEffect, useRef, useState } from 'react'
import { MORSE_LETTERS, type MorseLetter } from '../../../domain/morse/code'
import {
  nextCheckpointRunState,
  type MorseCheckpointRunState,
  type MorseWordCheckpoint,
} from '../../../domain/morse/curriculum/checkpoints'
import { MorseKeyInput } from '../input/MorseKeyInput'
import { MorseCharacterSupport } from '../MorseCharacterSupport'
import { useMorseAudio } from '../useMorseAudio'
import { useKeyedResponse } from '../input/useKeyedResponse'
import { SessionFrame, SessionCorrect } from '../session/SessionFrame'
import './MorseCheckpoint.css'

interface MorseCheckpointProps {
  checkpoint: MorseWordCheckpoint
  onExit: () => void
  /** Set only when #88's automatic handoff is waiting to resume the lesson it interrupted. */
  onContinue?: () => void
  continueLabel?: string
}

interface CheckpointFeedback {
  correct: boolean
  letter: MorseLetter
}

/**
 * Local-only application run for #78/#90. This component deliberately imports no
 * library store, scheduler, lesson-progress or Test-evidence write path.
 *
 * Since #87 the response boundary is owned by `useKeyedResponse` rather than by
 * a private timer, so a checkpoint letter is graded, acknowledged and replaced
 * on exactly the same schedule as a Learn retrieval, and the next letter cannot
 * be keyed by a tap that was still in flight when the previous one landed.
 *
 * Progress is an explicit warm-up → word-character → complete state machine.
 * Once a word starts, misses cannot insert unrelated work before its boundary.
 */
export function MorseCheckpoint({ checkpoint, onExit, onContinue, continueLabel }: MorseCheckpointProps) {
  const [run, setRun] = useState<MorseCheckpointRunState>({ phase: 'warmup', warmupIndex: 0 })
  const [feedback, setFeedback] = useState<CheckpointFeedback | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const correctionAudio = useMorseAudio()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const targetRef = useRef<HTMLDivElement>(null)

  const { phase, armed, holding, answered, acknowledge } = useKeyedResponse(() => {
    setFeedback(null)
    setRun((current) => nextCheckpointRunState(checkpoint, current))
  })

  function continueCorrection() {
    correctionAudio.stop()
    acknowledge()
  }

  const complete = run.phase === 'complete'
  const word = run.phase === 'word' ? checkpoint.words[run.wordIndex] : null
  const letter: MorseLetter | null = run.phase === 'warmup'
    ? checkpoint.warmups[run.warmupIndex]
    : run.phase === 'word'
      ? word![run.characterIndex] as MorseLetter
      : null

  useEffect(() => {
    if (complete) headingRef.current?.focus({ preventScroll: true })
    // Focus follows readiness, never the render: moving it onto a target that
    // is still mid-transition would hand a keyboard learner a control the
    // pointer learner cannot use yet.
    else if (armed) targetRef.current?.focus({ preventScroll: true })
  }, [complete, armed, run])

  function answer(pattern: string | readonly string[]) {
    if (!letter || !armed || Array.isArray(pattern)) return
    const correct = pattern === MORSE_LETTERS[letter]
    setAttempts((count) => count + 1)
    if (correct) {
      setCorrectAnswers((count) => count + 1)
    }
    setFeedback({ correct, letter })
    answered(correct)
  }

  const total = checkpoint.warmups.length + checkpoint.words.reduce((count, word) => count + word.length, 0)
  const current = run.phase === 'complete' ? total : run.phase === 'warmup' ? run.warmupIndex
    : checkpoint.warmups.length + checkpoint.words.slice(0, run.wordIndex).reduce((count, word) => count + word.length, 0) + run.characterIndex
  const frame = { kind: 'checkpoint' as const, title: 'Word check', progress: { current, total }, onClose: onExit }

  if (complete) {
    return (
      <SessionFrame {...frame} className="morse-lesson morse-checkpoint">
        <div className="morse-checkpoint-summary">
          <h1 ref={headingRef} tabIndex={-1}>Checkpoint done</h1>
          <p><strong>{correctAnswers} of {attempts} correct</strong></p>
          {onContinue ? (
            <div className="lesson-exits" inert={!armed}>
              <button type="button" onClick={onContinue}>{continueLabel ?? 'Keep going'}</button>
              <button className="ghost" type="button" onClick={onExit}>Back to lessons</button>
            </div>
          ) : (
            <button type="button" disabled={!armed} onClick={onExit}>Back to lessons</button>
          )}
        </div>
      </SessionFrame>
    )
  }

  if (!letter) return null

  const targetKey = run.phase === 'warmup'
    ? `warmup-${run.warmupIndex}`
    : `word-${run.wordIndex}-${run.characterIndex}`

  return (
    <SessionFrame {...frame} className="morse-lesson morse-checkpoint" data-step="check">

      <div
        className="morse-checkpoint-target"
        key={targetKey}
        data-phase={phase}
        ref={targetRef}
        tabIndex={-1}
        aria-label={`Key the Morse pattern for ${letter}`}
      >
        <p className="lesson-task">{run.phase === 'warmup' ? 'Warm up' : 'Word'}</p>

        {run.phase === 'warmup' ? (
          <>
            <p className="morse-checkpoint-letter" aria-hidden="true">{letter}</p>
            <h1 className="sr-only">Key the Morse pattern for {letter}.</h1>
          </>
        ) : (
          <>
            <p className="morse-checkpoint-word" aria-hidden="true">
              {Array.from(word!).map((character, characterIndex) => (
                <span className={characterIndex === run.characterIndex ? 'is-current' : undefined} key={characterIndex}>
                  {character}
                </span>
              ))}
            </p>
            <h1 className="sr-only">Key {letter}, letter {run.characterIndex + 1} of {word}.</h1>
          </>
        )}

        {feedback ? (
          <div
            className={`morse-checkpoint-feedback${feedback.correct ? ' is-correct' : ' is-wrong'}`}
            role="status"
            aria-live="assertive"
          >
            {feedback.correct ? <SessionCorrect target={feedback.letter} announce={false} /> : <strong>Miss</strong>}
            {!feedback.correct && (
              <>
                <MorseCharacterSupport glyph={feedback.letter} pattern={MORSE_LETTERS[feedback.letter]} playing={correctionAudio.sounding?.glyph === feedback.letter} onToggle={() => correctionAudio.toggle(feedback.letter)} audioError={correctionAudio.audioError} />
                {/* The same rule as Learn: a correction ends when the learner
                    says it does, never on a timer they did not set. */}
                <button type="button" className="lesson-next" onClick={continueCorrection} disabled={!holding}>
                  Continue
                </button>
              </>
            )}
          </div>
        ) : (
          // `inert` is the real gate: `pointer-events: none` alone would let the
          // same tap fall through to whatever sits underneath the key.
          <div className="morse-checkpoint-answer" inert={!armed}>
            <MorseKeyInput
              key={`${checkpoint.id}-${targetKey}`}
              expectedLength={MORSE_LETTERS[letter].length}
              locked={!armed}
              onSubmit={answer}
            />
          </div>
        )}
      </div>
    </SessionFrame>
  )
}
