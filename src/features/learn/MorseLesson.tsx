import { useEffect, useRef, useState } from 'react'
import { canonicalPattern } from '../../lib/acquisition'
import { canonicalNotation, mnemonicTextEquivalent, spokenRhythm } from '../../lib/morseMnemonics'
import {
  advanceLesson,
  answerLesson,
  currentStep,
  introduceLesson,
  lessonProgressCount,
  lessonProgressOf,
  startLesson,
  withLessonProgress,
  type LessonCheckFormat,
  type LessonEntry,
  type LessonRun,
} from '../../lib/morseLesson'
import {
  answerListeningQuestion,
  lessonListeningOptions,
  newLessonListeningState,
  recordLessonQuestion,
  shouldUseListeningQuestion,
  suppressListening,
  type ListeningFeedback,
} from '../../lib/morseLessonListening'
import {
  LESSON_RETRIEVAL_TARGET,
  lessonSittingComplete,
  newLessonSitting,
  recordLessonRetrieval,
} from '../../lib/morseLessonSitting'
import { loadLessonSitting, saveLessonSitting } from '../../lib/morseLessonSittingStorage'
import type { MorseLetter } from '../../lib/morse'
import { useLibrary } from '../../lib/store'
import type { Topic } from '../../lib/types'
import { MorseKeyInput } from '../morse/MorseKeyInput'
import { MorseMnemonic } from './MorseMnemonic'
import { MorseBeatGrammarNote, MorsePhrase } from './MorsePhrase'
import { MorsePlayButton } from './MorsePlayButton'
import { useMorseAudio } from './useMorseAudio'
import './MorseLesson.css'

const RETEACH_VISIBLE_MS = 1400

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
      <p className="lesson-glyph" aria-hidden="true">{glyph}</p>
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
        <span className="morse-notation" aria-hidden="true">{canonicalNotation(pattern)}</span>
        <span className="morse-rhythm">{spokenRhythm(pattern)}</span>
      </p>
    </div>
  )
}

/** Printed letter → Morse. Support changes the cue, never the response mechanism. */
export function VisualCheckStep({
  entry,
  format,
  regionRef,
  onAnswer,
}: {
  entry: LessonEntry
  format: LessonCheckFormat
  regionRef: React.RefObject<HTMLDivElement | null>
  onAnswer: (response: string) => void
}) {
  return (
    <div className="lesson-check" ref={regionRef} tabIndex={-1} data-question="visual">
      <p className="lesson-task">Key this pattern</p>
      <p className="lesson-glyph" aria-hidden="true">{entry.glyph}</p>
      <h2 className="sr-only">Key the Morse pattern for {entry.glyph}.</h2>

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
        </div>
      )}

      <MorseKeyInput submitLabel="Check" onSubmit={onAnswer} />
    </div>
  )
}

/** Morse sound → letter. The answer is never named by the prompt or audio control. */
export function ListeningCheckStep({
  entry,
  options,
  playing,
  regionRef,
  onToggle,
  onAnswer,
  onSkip,
}: {
  entry: LessonEntry
  options: MorseLetter[]
  playing: boolean
  regionRef: React.RefObject<HTMLDivElement | null>
  onToggle: () => void
  onAnswer: (response: string) => void
  onSkip: () => void
}) {
  return (
    <div className="lesson-check" ref={regionRef} tabIndex={-1} data-question="listening">
      <p className="lesson-task">Listen, then choose the letter</p>
      <h2 className="sr-only">Listen to the Morse sound, then choose the matching letter.</h2>
      <div className="lesson-listening-stimulus">
        <MorsePlayButton glyph={entry.glyph} playing={playing} onToggle={onToggle} concealGlyph />
        <p className="lesson-length">Replay as needed.</p>
      </div>
      <div className="lesson-options" aria-label="Letter choices">
        {options.map((option) => (
          <button className="lesson-option lesson-letter-option" key={option} type="button" onClick={() => onAnswer(option)}>
            {option}
          </button>
        ))}
      </div>
      <button className="ghost lesson-audio-skip" type="button" onClick={onSkip}>Can&apos;t listen now</button>
    </div>
  )
}

export function MorseLesson({ topic, initialRun, onExit, onTest, onReference }: MorseLessonProps) {
  const { upsertTopic } = useLibrary()
  const { sounding, audioError, clearError, stop, toggle } = useMorseAudio()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const stepRef = useRef<HTMLDivElement>(null)

  const [run, setRun] = useState<LessonRun>(initialRun)
  const [sitting, setSitting] = useState(() => loadLessonSitting(topic.id))
  const [listeningState, setListeningState] = useState(newLessonListeningState)
  const [listeningFeedback, setListeningFeedback] = useState<ListeningFeedback | null>(null)
  const [audioNotice, setAudioNotice] = useState<string | null>(null)
  const [packetsAdvanced, setPacketsAdvanced] = useState(0)
  const topicRef = useRef<Topic>(topic)

  const sittingDone = lessonSittingComplete(sitting)
  const hasFeedback = Boolean(run.feedback || listeningFeedback)
  const step = hasFeedback || sittingDone ? null : currentStep(run)
  const packetProgress = lessonProgressCount(run)
  const listening = step?.kind === 'check' && shouldUseListeningQuestion(sitting.retrievals, step.entry, listeningState)
  const audioOptions = step?.kind === 'check' && listening ? lessonListeningOptions(run, step.entry) : []

  useEffect(() => {
    if (!audioError) return
    stop()
    setListeningState((state) => suppressListening(state))
    setAudioNotice('Audio is unavailable. Continuing with visual questions for this lesson.')
  }, [audioError, stop])

  useEffect(() => {
    if (run.complete || run.finished || (sittingDone && !hasFeedback)) headingRef.current?.focus()
    else if (!hasFeedback) stepRef.current?.focus({ preventScroll: true })
  }, [run.step, run.complete, run.finished, sittingDone, hasFeedback, listeningState.suppressed])

  function commit(next: LessonRun) {
    setRun(next)
    const updated = withLessonProgress(topicRef.current, lessonProgressOf(next))
    if (updated !== topicRef.current) {
      topicRef.current = updated
      upsertTopic(updated)
    }
  }

  function persistSitting(next: typeof sitting) {
    setSitting(next)
    saveLessonSitting(topic.id, next)
  }

  function movePastVisualFeedback(answeredRun: LessonRun, nextSitting: typeof sitting) {
    const cleared = advanceLesson(answeredRun)
    if (cleared.complete && !lessonSittingComplete(nextSitting)) {
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

  function answerVisual(itemId: string, response: string) {
    const next = answerLesson(run, itemId, response)
    if (next === run || !next.feedback) return
    setListeningState((state) => recordLessonQuestion(state, itemId))
    const nextSitting = recordLessonRetrieval(sitting, itemId, next.feedback.correct)
    persistSitting(nextSitting)
    commit(next)
    if (next.feedback.correct) movePastVisualFeedback(next, nextSitting)
  }

  function answerListening(itemId: string, response: string) {
    const answered = answerListeningQuestion(run, itemId, response)
    if (!answered) return
    stop()
    setRun(answered.run)
    setListeningState((state) => recordLessonQuestion(state, itemId))
    const nextSitting = recordLessonRetrieval(sitting, itemId, answered.feedback.correct)
    persistSitting(nextSitting)
    if (answered.feedback.correct) {
      setListeningFeedback(null)
    } else {
      setListeningFeedback(answered.feedback)
    }
  }

  useEffect(() => {
    if (run.feedback?.correct !== false) return
    const answeredRun = run
    const sittingAtAnswer = sitting
    const timer = setTimeout(() => movePastVisualFeedback(answeredRun, sittingAtAnswer), RETEACH_VISIBLE_MS)
    return () => clearTimeout(timer)
    // `movePastVisualFeedback` intentionally uses the state captured for this
    // answer; a new answer cannot occur while feedback owns the surface.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run.feedback])

  useEffect(() => {
    if (!listeningFeedback || listeningFeedback.correct) return
    const timer = setTimeout(() => setListeningFeedback(null), RETEACH_VISIBLE_MS)
    return () => clearTimeout(timer)
  }, [listeningFeedback])

  function skipListening() {
    stop()
    setListeningState((state) => suppressListening(state))
    setAudioNotice('Listening skipped. This lesson will stay visual.')
  }

  function nextSitting() {
    const next = startLesson(topicRef.current)
    if (!next) return
    stop()
    clearError()
    setRun(next)
    const freshSitting = newLessonSitting()
    persistSitting(freshSitting)
    setListeningState(newLessonListeningState())
    setListeningFeedback(null)
    setAudioNotice(null)
    setPacketsAdvanced(0)
  }

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
      <button className="ghost small" type="button" onClick={onExit}>Close</button>
    </div>
  )

  if (run.finished) {
    return (
      <section className="session morse-lesson">
        {bar}
        <h1 ref={headingRef} tabIndex={-1} className="lesson-title">You have been through every letter</h1>
        <p className="lesson-lede">
          All 26 characters have been produced unaided at least once in Learn. That is acquisition, not proof:
          the printed A–Z claim is earned in Test, uncued and in both directions.
        </p>
        <div className="lesson-exits">
          <button type="button" onClick={onTest}>Test me</button>
          <button className="ghost" type="button" onClick={onReference}>Morse alphabet</button>
        </div>
      </section>
    )
  }

  if (sittingDone && !hasFeedback) {
    const packetsSettled = packetsAdvanced + (run.complete ? 1 : 0)
    const revisit = sitting.revisitItemIds.length
    return (
      <section className="session morse-lesson">
        {bar}
        <h1 ref={headingRef} tabIndex={-1} className="lesson-title">Lesson complete</h1>
        <p className="lesson-lede"><strong>{sitting.retrievals} XP</strong> · {sitting.correct} correct · {revisit} {revisit === 1 ? 'letter' : 'letters'} to revisit</p>
        <p className="lesson-foot">Packet {run.packetIndex + 1} of {run.packetCount}: {packetProgress.done} of {packetProgress.total} settled.</p>
        {packetsSettled > 0 && <p className="lesson-foot">{packetsSettled === 1 ? '1 packet settled this sitting.' : `${packetsSettled} packets settled this sitting.`}</p>}
        <div className="lesson-exits">
          <button type="button" onClick={nextSitting}>Next lesson</button>
          <button className="ghost" type="button" onClick={onExit}>Stop here</button>
        </div>
        <p className="lesson-foot">XP is only this sitting&apos;s progress. Test is still the only place the A–Z claim is proved.</p>
      </section>
    )
  }

  if (run.complete && sitting.retrievals === 0) {
    const last = run.packetIndex + 1 >= run.packetCount
    return (
      <section className="session morse-lesson">
        {bar}
        <h1 ref={headingRef} tabIndex={-1} className="lesson-title">Packet {run.packetIndex + 1} done</h1>
        <p className="lesson-lede">Every character in this packet was produced from the letter alone. {last ? 'That was the last packet.' : 'The next packet brings two new characters and mixes these back in.'}</p>
        <div className="lesson-exits">
          <button type="button" onClick={nextPacket}>{last ? 'Finish' : 'Next packet'}</button>
          <button className="ghost" type="button" onClick={onExit}>Stop here</button>
        </div>
        <p className="lesson-foot">Nothing in Learn is scored. Test is still the only place the A–Z claim is proved.</p>
      </section>
    )
  }

  const feedback = run.feedback
  const shownListeningFeedback = listeningFeedback

  return (
    <section className="session morse-lesson">
      {bar}
      <h1 ref={headingRef} tabIndex={-1} className="sr-only">Morse lesson, packet {run.packetIndex + 1} of {run.packetCount}</h1>
      <div className="lesson-progress" role="progressbar" aria-valuemin={0} aria-valuemax={LESSON_RETRIEVAL_TARGET}
        aria-valuenow={sitting.retrievals} aria-label="Lesson XP">
        <span className="lesson-progress-fill" style={{ inlineSize: `${(sitting.retrievals / LESSON_RETRIEVAL_TARGET) * 100}%` }} />
      </div>
      <p className="lesson-foot">Packet progress: {packetProgress.done} of {packetProgress.total} settled.</p>

      {shownListeningFeedback && !shownListeningFeedback.correct && (
        <div className="lesson-feedback" role="status" aria-live="assertive">
          <p className="lesson-verdict">Not that one</p>
          <p className="lesson-correction">You chose {shownListeningFeedback.response || 'no letter'}. The sound was {shownListeningFeedback.glyph}:</p>
          <CharacterStage glyph={shownListeningFeedback.glyph} pattern={shownListeningFeedback.pattern}
            playing={sounding?.glyph === shownListeningFeedback.glyph}
            activeIndex={sounding?.glyph === shownListeningFeedback.glyph ? sounding.index : null}
            onToggle={() => toggle(shownListeningFeedback.glyph)} />
          <p className="lesson-foot">Listening reinforcement does not change printed packet support.</p>
        </div>
      )}

      {feedback && !feedback.correct && (
        <div className="lesson-feedback" role="status" aria-live="assertive">
          <p className="lesson-verdict">Not that one</p>
          <p className="lesson-correction">You keyed <span className="mono">{feedback.response ? canonicalPattern(feedback.response) : '—'}</span>. {feedback.glyph} is:</p>
          <CharacterStage glyph={feedback.glyph} pattern={feedback.pattern} playing={sounding?.glyph === feedback.glyph}
            activeIndex={sounding?.glyph === feedback.glyph ? sounding.index : null} onToggle={() => toggle(feedback.glyph)} />
          <p className="lesson-foot">It comes back later, after other letters.</p>
        </div>
      )}

      {!hasFeedback && step?.kind === 'introduce' && (
        <div className="lesson-introduce" ref={stepRef} tabIndex={-1}>
          <p className="lesson-task">New letter</p>
          <CharacterStage glyph={step.entry.glyph} pattern={step.entry.pattern} playing={sounding?.glyph === step.entry.glyph}
            activeIndex={sounding?.glyph === step.entry.glyph ? sounding.index : null} onToggle={() => toggle(step.entry.glyph)} />
          <MorseBeatGrammarNote className="lesson-grammar" />
          <button className="lesson-next" type="button" onClick={() => commit(introduceLesson(run, step.entry.itemId))}>Got it</button>
        </div>
      )}

      {!hasFeedback && step?.kind === 'check' && listening && (
        <ListeningCheckStep key={`listen-${step.entry.itemId}-${run.step}`} regionRef={stepRef} entry={step.entry}
          options={audioOptions} playing={sounding?.glyph === step.entry.glyph} onToggle={() => toggle(step.entry.glyph)}
          onAnswer={(response) => answerListening(step.entry.itemId, response)} onSkip={skipListening} />
      )}

      {!hasFeedback && step?.kind === 'check' && !listening && (
        <VisualCheckStep key={`visual-${step.entry.itemId}-${run.step}`} regionRef={stepRef} entry={step.entry}
          format={step.format} onAnswer={(response) => answerVisual(step.entry.itemId, response)} />
      )}

      {(audioNotice || audioError) && <p className="morse-audio-error" role="status">{audioNotice ?? `${audioError} Continuing visually.`}</p>}
    </section>
  )
}
