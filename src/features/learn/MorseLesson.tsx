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
 * Every acquisition rule lives in `src/lib/morseLesson.ts`. A separate tiny
 * runtime policy in `morseLessonSitting.ts` gives each visit a guaranteed finite
 * boundary: ten answered retrievals. Introductions and reteach screens do not
 * consume that budget, and correctness still affects support/reteaching rather
 * than whether the learner is allowed to finish the sitting.
 *
 * **Nothing here is scored.** The component imports the lesson policy and the
 * store, and writes exactly one field: `Topic.lessonProgress`, through
 * `withLessonProgress`, which copies every other field of the topic through
 * verbatim. It does not import `scheduling.ts` or `cueLadder.ts`, so no
 * retrieval on this surface can record a retention attempt, move a scheduler
 * timestamp, write directional evidence or award completion. Session XP is
 * runtime-only and is never written to the topic.
 */

interface MorseLessonProps {
  topic: Topic
  /** Resolved by `Learn`, which already had to ask whether a lesson exists. */
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

/**
 * A supported check keeps the phrase in view (`taught`) or reduces to the
 * element count with optional canonical audio (`cued`). The unaided check
 * (`solo`) shows the glyph and nothing else, and is answered by keying the
 * pattern — the same production task the formal Test uses, so the lesson hands
 * the learner over in the format they will be asked in.
 */
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
      {/* Same shape as an introduction and as the uncued Test card: a short
          instruction, then the prompt itself at full size. The glyph is its own
          element rather than a word inside the sentence, so it is the thing on
          screen rather than punctuation in a label. */}
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
  // The topic as this lesson has since written it. The prop is the snapshot
  // `Learn` took on entry, so starting the next packet has to read from here
  // rather than from a value that predates every support level just earned.
  const topicRef = useRef<Topic>(topic)

  const sittingDone = lessonSittingComplete(sitting)
  const step = run.feedback || sittingDone ? null : currentStep(run)
  const progress = lessonProgressCount(run)
  // Alternatives are a pure function of the run, so there is nothing to
  // memoise against a reshuffle: the same step always produces the same three.
  const options =
    step?.kind === 'check' && step.format !== 'solo' ? lessonOptions(run, step.entry) : []

  /**
   * Every step replaces the control the learner just used, so focus has to be
   * placed deliberately or it falls to the document body and a keyboard or
   * screen-reader user loses the lesson. Feedback takes focus to Continue; a
   * new step takes it to the step region; a sitting/programme endpoint takes it
   * to the summary heading.
   */
  useEffect(() => {
    if (run.complete || run.finished || (sittingDone && !run.feedback)) headingRef.current?.focus()
    else if (run.feedback) continueRef.current?.focus({ preventScroll: true })
    else stepRef.current?.focus({ preventScroll: true })
  }, [run.step, run.feedback, run.complete, run.finished, sittingDone])

  /** Persist only durable acquisition support after every lesson step. */
  function commit(next: LessonRun) {
    setRun(next)
    const updated = withLessonProgress(topicRef.current, lessonProgressOf(next))
    if (updated !== topicRef.current) {
      topicRef.current = updated
      upsertTopic(updated)
    }
  }

  /**
   * Count an answered retrieval once. Session XP is deliberately independent of
   * correctness; the acquisition policy already uses correctness to fade or
   * restore support and to schedule weak items later.
   */
  function answerStep(itemId: string, response: string) {
    const next = answerLesson(run, itemId, response)
    if (next === run || !next.feedback) return
    setSitting((current) => recordLessonRetrieval(current, itemId, next.feedback?.correct ?? false))
    commit(next)
  }

  /**
   * Finish feedback, then cross a packet boundary automatically if the sitting
   * still has retrievals left. Packet readiness remains real; it simply no
   * longer dictates how long the current sitting must last.
   */
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

  /** Legacy/direct-render fallback; normal in-product flow crosses automatically. */
  function nextPacket() {
    const next = startLesson(topicRef.current)
    if (next) setRun(next)
  }

  const bar = (
    <div className="session-bar">
      <p>
        <span className="session-topic">
          {run.finished ? 'Lesson' : `Lesson ${run.packetIndex + 1} of ${run.packetCount}`}
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
          All 26 characters have been produced unaided at least once in the lesson. That is
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
        {packetsSettled > 0 && (
          <p className="lesson-foot">
            {packetsSettled === 1 ? '1 packet settled this lesson.' : `${packetsSettled} packets settled this lesson.`}
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
          Lesson XP is only this sitting's progress. Test is still the only place the A–Z claim is proved.
        </p>
      </section>
    )
  }

  // Defensive/direct-render fallback for a completed run supplied from outside
  // the normal finite-sitting flow. Real lesson play crosses packet boundaries
  // automatically until the ten-retrieval sitting ends.
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
          Nothing in the lesson is scored. Test is still the only place the A–Z claim is proved.
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
        aria-valuemax={progress.total}
        aria-valuenow={progress.done}
        aria-label="Characters settled in this packet"
      >
        <span className="lesson-progress-fill" style={{ inlineSize: `${(progress.done / progress.total) * 100}%` }} />
      </div>
      <p className="sr-only">
        {progress.done} of {progress.total} settled. {sitting.retrievals} of {LESSON_RETRIEVAL_TARGET} lesson XP earned.
      </p>

      {feedback && (
        <div className={`lesson-feedback${feedback.correct ? ' is-correct' : ''}`} role="status">
          <p className="lesson-verdict">{feedback.correct ? 'Correct' : 'Not that one'}</p>
          {feedback.reteach ? (
            <>
              {/* A miss restores the support that was withheld and teaches the
                  correction, rather than only marking the answer wrong. */}
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
              <p className="lesson-foot">It comes back later in this lesson, after other letters.</p>
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