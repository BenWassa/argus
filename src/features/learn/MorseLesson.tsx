import { useEffect, useRef, useState } from 'react'
import { canonicalPattern, patternReading } from '../../lib/acquisition'
import { canonicalNotation, mnemonicTextEquivalent, spokenRhythm } from '../../lib/morseMnemonics'
import {
  advanceLesson,
  answerLesson,
  currentStep,
  introduceLesson,
  lessonOptions,
  lessonProgressCount,
  lessonProgressOf,
  startLesson,
  withLessonProgress,
  type LessonCheckFormat,
  type LessonEntry,
  type LessonRun,
} from '../../lib/morseLesson'
import {
  LESSON_RETRIEVAL_TARGET,
  lessonSittingComplete,
  newLessonSitting,
  recordLessonRetrieval,
} from '../../lib/morseLessonSitting'
import { useLibrary } from '../../lib/store'
import type { Topic } from '../../lib/types'
import { MorseMnemonic } from './MorseMnemonic'
import { MorseBeatGrammarNote, MorsePhrase } from './MorsePhrase'
import { MorsePlayButton } from './MorsePlayButton'
import { useMorseAudio } from './useMorseAudio'
import './MorseLesson.css'

/**
 * The guided Morse lesson: one dominant task at a time.
 *
 * Acquisition policy lives in `src/lib/morseLesson.ts`. The small runtime-only
 * `morseLessonSitting.ts` policy gives every sitting a guaranteed finite target:
 * ten answered retrievals. Introductions and reteach screens do not consume the
 * budget, and correctness affects support/reteaching rather than session length.
 *
 * **Nothing here is scored.** The component writes only `Topic.lessonProgress`
 * through `withLessonProgress`. It imports no scheduler or Test cue ladder, so
 * Learn cannot write retention evidence, directional coverage or completion.
 * Session XP is runtime-only and is never written to the topic.
 */

interface MorseLessonProps {
  topic: Topic
  initialRun: LessonRun
  onExit: () => void
  onTest: () => void
  onReference: () => void
}

function CharacterStage({
  glyph,
  pattern,
  playing,
  activeIndex,
  onToggle,
}: {
  glyph: string
  pattern: string
  playing: boolean
  activeIndex: number | null
  onToggle: () => void
}) {
  return (
    <div className="lesson-stage">
      <p className="lesson-glyph" aria-hidden="true">
        {glyph}
      </p>
      <MorsePhrase glyph={glyph} />
      <div className="lesson-visual">
        <MorseMnemonic
          glyph={glyph}
          pattern={pattern}
          textLabel={mnemonicTextEquivalent(glyph, pattern)}
          activeIndex={activeIndex}
        />
        <MorsePlayButton glyph={glyph} playing={playing} onToggle={onToggle} />
      </div>
      <p className="lesson-canonical">
        <span className="morse-notation" aria-hidden="true">
          {canonicalNotation(pattern)}
        </span>
        <span className="morse-rhythm">{spokenRhythm(pattern)}</span>
      </p>
    </div>
  )
}

function CheckStep({
  entry,
  format,
  options,
  playing,
  regionRef,
  onToggle,
  onAnswer,
}: {
  entry: LessonEntry
  format: LessonCheckFormat
  options: string[]
  playing: boolean
  regionRef: React.RefObject<HTMLDivElement | null>
  onToggle: () => void
  onAnswer: (response: string) => void
}) {
  const [entered, setEntered] = useState('')

  return (
    <div className="lesson-check" ref={regionRef} tabIndex={-1}>
      <p className="lesson-task">
        {format === 'solo' ? 'Key this pattern' : 'Choose this pattern'}
      </p>
      <p className="lesson-glyph" aria-hidden="true">
        {entry.glyph}
      </p>
      <h2 className="sr-only">
        {format === 'solo'
          ? `Key the Morse pattern for ${entry.glyph}.`
          : `Choose the Morse pattern for ${entry.glyph}.`}
      </h2>

      {format === 'taught' && (
        <div className="lesson-support" data-support="taught">
          <MorsePhrase glyph={entry.glyph} />
        </div>
      )}

      {format === 'cued' && (
        <div className="lesson-support" data-support="cued">
          <p className="lesson-length">
            {entry.pattern.length} {entry.pattern.length === 1 ? 'signal' : 'signals'}
          </p>
          <MorsePlayButton glyph={entry.glyph} playing={playing} onToggle={onToggle} />
        </div>
      )}

      {format === 'solo' ? (
        <div className="lesson-production">
          <p className="lesson-entry mono" aria-live="polite">
            <span aria-hidden="true">{entered ? canonicalPattern(entered) : '—'}</span>
            <span className="sr-only">{entered ? patternReading(entered) : 'nothing keyed yet'}</span>
          </p>
          <div className="lesson-keys">
            <button className="lesson-key" type="button" onClick={() => setEntered((c) => `${c}.`)}>
              <span aria-hidden="true">·</span>
              <span className="sr-only">Add a dit</span>
            </button>
            <button className="lesson-key" type="button" onClick={() => setEntered((c) => `${c}-`)}>
              <span aria-hidden="true">—</span>
              <span className="sr-only">Add a dah</span>
            </button>
            <button
              className="ghost lesson-key-small"
              type="button"
              disabled={entered.length === 0}
              onClick={() => setEntered((c) => c.slice(0, -1))}
            >
              Back
            </button>
          </div>
          <button
            className="lesson-submit"
            type="button"
            disabled={entered.length === 0}
            onClick={() => onAnswer(entered)}
          >
            Check
          </button>
        </div>
      ) : (
        <div className="lesson-options">
          {options.map((option) => (
            <button
              className="lesson-option mono"
              key={option}
              type="button"
              onClick={() => onAnswer(option)}
            >
              <span aria-hidden="true">{canonicalPattern(option)}</span>
              <span className="sr-only">{patternReading(option)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function MorseLesson({ topic, initialRun, onExit, onTest, onReference }: MorseLessonProps) {
  const { upsertTopic } = useLibrary()
  const { sounding, audioError, toggle } = useMorseAudio()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const continueRef = useRef<HTMLButtonElement>(null)
  const stepRef = useRef<HTMLDivElement>(null)

  const [run, setRun] = useState<LessonRun>(initialRun)
  const [sitting, setSitting] = useState(newLessonSitting)
  const [packetsAdvanced, setPacketsAdvanced] = useState(0)
  const topicRef = useRef<Topic>(topic)

  const sittingDone = lessonSittingComplete(sitting)
  const step = run.feedback || sittingDone ? null : currentStep(run)
  const packetProgress = lessonProgressCount(run)
  const options =
    step?.kind === 'check' && step.format !== 'solo' ? lessonOptions(run, step.entry) : []

  useEffect(() => {
    if (run.complete || run.finished || (sittingDone && !run.feedback)) headingRef.current?.focus()
    else if (run.feedback) continueRef.current?.focus({ preventScroll: true })
    else stepRef.current?.focus({ preventScroll: true })
  }, [run.step, run.feedback, run.complete, run.finished, sittingDone])

  function commit(next: LessonRun) {
    setRun(next)
    const updated = withLessonProgress(topicRef.current, lessonProgressOf(next))
    if (updated !== topicRef.current) {
      topicRef.current = updated
      upsertTopic(updated)
    }
  }

  function answerStep(itemId: string, response: string) {
    const next = answerLesson(run, itemId, response)
    if (next === run || !next.feedback) return
    setSitting((current) => recordLessonRetrieval(current, itemId, next.feedback?.correct ?? false))
    commit(next)
  }

  function continueAfterFeedback() {
    const cleared = advanceLesson(run)
    if (cleared.complete && !sittingDone) {
      const next = startLesson(topicRef.current)
      if (next) {
        if (next.packetIndex > cleared.packetIndex) {
          setPacketsAdvanced((count) => count + (next.packetIndex - cleared.packetIndex))
        }
        setRun(next)
        return
      }
    }
    setRun(cleared)
  }

  function nextSitting() {
    const next = startLesson(topicRef.current)
    if (!next) return
    setRun(next)
    setSitting(newLessonSitting())
    setPacketsAdvanced(0)
  }

  /** Defensive/direct-render fallback; normal play crosses packets automatically. */
  function nextPacket() {
    const next = startLesson(topicRef.current)
    if (next) setRun(next)
  }

  const bar = (
    <div className="session-bar">
      <p>
        <span className="session-topic">
          {run.finished ? 'Morse programme' : `Packet ${run.packetIndex + 1} of ${run.packetCount}`}
        </span>
        <span className="tabular">
          {run.finished ? 'All packets settled' : `${sitting.retrievals} / ${LESSON_RETRIEVAL_TARGET} XP`}
        </span>
      </p>
      <button className="ghost small" type="button" onClick={onExit}>
        Close
      </button>
    </div>
  )

  if (run.finished) {
    return (
      <section className="session morse-lesson">
        {bar}
        <h1 ref={headingRef} tabIndex={-1} className="lesson-title">
          You have been through every letter
        </h1>
        <p className="lesson-lede">
          All 26 characters have been produced unaided at least once in Learn. That is
          acquisition, not proof: the printed A–Z claim is earned in Test, uncued and in both
          directions.
        </p>
        <div className="lesson-exits">
          <button type="button" onClick={onTest}>
            Test me
          </button>
          <button className="ghost" type="button" onClick={onReference}>
            Morse alphabet
          </button>
        </div>
      </section>
    )
  }

  if (sittingDone && !run.feedback) {
    const packetsSettled = packetsAdvanced + (run.complete ? 1 : 0)
    const revisit = sitting.revisitItemIds.length
    return (
      <section className="session morse-lesson">
        {bar}
        <h1 ref={headingRef} tabIndex={-1} className="lesson-title">
          Lesson complete
        </h1>
        <p className="lesson-lede">
          <strong>{sitting.retrievals} XP</strong> · {sitting.correct} correct · {revisit}{' '}
          {revisit === 1 ? 'letter' : 'letters'} to revisit
        </p>
        <p className="lesson-foot">
          Packet {run.packetIndex + 1} of {run.packetCount}: {packetProgress.done} of{' '}
          {packetProgress.total} settled.
        </p>
        {packetsSettled > 0 && (
          <p className="lesson-foot">
            {packetsSettled === 1
              ? '1 packet settled this sitting.'
              : `${packetsSettled} packets settled this sitting.`}
          </p>
        )}
        <div className="lesson-exits">
          <button type="button" onClick={nextSitting}>
            Next lesson
          </button>
          <button className="ghost" type="button" onClick={onExit}>
            Stop here
          </button>
        </div>
        <p className="lesson-foot">
          XP is only this sitting's progress. Test is still the only place the A–Z claim is proved.
        </p>
      </section>
    )
  }

  if (run.complete && sitting.retrievals === 0) {
    const last = run.packetIndex + 1 >= run.packetCount
    return (
      <section className="session morse-lesson">
        {bar}
        <h1 ref={headingRef} tabIndex={-1} className="lesson-title">
          Packet {run.packetIndex + 1} done
        </h1>
        <p className="lesson-lede">
          Every character in this packet was produced from the letter alone. {last
            ? 'That was the last packet.'
            : 'The next packet brings two new characters and mixes these back in.'}
        </p>
        <div className="lesson-exits">
          <button type="button" onClick={nextPacket}>
            {last ? 'Finish' : 'Next packet'}
          </button>
          <button className="ghost" type="button" onClick={onExit}>
            Stop here
          </button>
        </div>
        <p className="lesson-foot">
          Nothing in Learn is scored. Test is still the only place the A–Z claim is proved.
        </p>
      </section>
    )
  }

  const feedback = run.feedback

  return (
    <section className="session morse-lesson">
      {bar}

      <h1 ref={headingRef} tabIndex={-1} className="sr-only">
        Morse lesson, packet {run.packetIndex + 1} of {run.packetCount}
      </h1>

      <div
        className="lesson-progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={LESSON_RETRIEVAL_TARGET}
        aria-valuenow={sitting.retrievals}
        aria-label="Lesson XP"
      >
        <span
          className="lesson-progress-fill"
          style={{ inlineSize: `${(sitting.retrievals / LESSON_RETRIEVAL_TARGET) * 100}%` }}
        />
      </div>
      <p className="lesson-foot">
        Packet progress: {packetProgress.done} of {packetProgress.total} settled.
      </p>

      {feedback && (
        <div className={`lesson-feedback${feedback.correct ? ' is-correct' : ''}`} role="status">
          <p className="lesson-verdict">{feedback.correct ? 'Correct' : 'Not that one'}</p>
          {feedback.reteach ? (
            <>
              <p className="lesson-correction">
                You keyed{' '}
                <span className="mono">
                  {feedback.response ? canonicalPattern(feedback.response) : '—'}
                </span>
                . {feedback.glyph} is:
              </p>
              <CharacterStage
                glyph={feedback.glyph}
                pattern={feedback.pattern}
                playing={sounding?.glyph === feedback.glyph}
                activeIndex={sounding?.glyph === feedback.glyph ? sounding.index : null}
                onToggle={() => toggle(feedback.glyph)}
              />
              <p className="lesson-foot">It comes back later, after other letters.</p>
            </>
          ) : (
            <p className="lesson-correction">
              <span className="lesson-correction-glyph">{feedback.glyph}</span>
              <span className="mono" aria-hidden="true">{canonicalPattern(feedback.pattern)}</span>
              <span className="sr-only">{patternReading(feedback.pattern)}</span>
            </p>
          )}
          <button ref={continueRef} className="lesson-next" type="button" onClick={continueAfterFeedback}>
            Continue
          </button>
        </div>
      )}

      {!feedback && step?.kind === 'introduce' && (
        <div className="lesson-introduce" ref={stepRef} tabIndex={-1}>
          <p className="lesson-task">New letter</p>
          <CharacterStage
            glyph={step.entry.glyph}
            pattern={step.entry.pattern}
            playing={sounding?.glyph === step.entry.glyph}
            activeIndex={sounding?.glyph === step.entry.glyph ? sounding.index : null}
            onToggle={() => toggle(step.entry.glyph)}
          />
          <MorseBeatGrammarNote className="lesson-grammar" />
          <button
            className="lesson-next"
            type="button"
            onClick={() => commit(introduceLesson(run, step.entry.itemId))}
          >
            Got it
          </button>
        </div>
      )}

      {!feedback && step?.kind === 'check' && (
        <CheckStep
          key={`${step.entry.itemId}-${run.step}`}
          regionRef={stepRef}
          entry={step.entry}
          format={step.format}
          options={options}
          playing={sounding?.glyph === step.entry.glyph}
          onToggle={() => toggle(step.entry.glyph)}
          onAnswer={(response) => answerStep(step.entry.itemId, response)}
        />
      )}

      {audioError && (
        <p className="morse-audio-error" role="status">
          {audioError} Audio is optional here; the phrase, its beat marks and the drawing teach the
          same mapping.
        </p>
      )}
    </section>
  )
}
