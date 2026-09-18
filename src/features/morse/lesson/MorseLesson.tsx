import { useEffect, useRef, useState } from 'react'
import { canonicalPattern } from '../../../domain/morse/testing/acquisitionProfile'
import {
  advanceLesson,
  answerLesson,
  currentStep,
  introduceLesson,
  introducedGlyphs,
  lessonProgressCount,
  startLesson,
  type LessonRun,
} from '../../../domain/morse/curriculum/lesson'
import {
  morseLessonPath,
  type MorseLessonPathItem,
} from '../../../domain/morse/curriculum/lessonPath'
import {
  answerListeningQuestion,
  lessonListeningOptions,
  newLessonListeningState,
  recordListeningAnswer,
  recordLessonQuestion,
  chooseListeningTarget,
  suppressListening,
  type ListeningFeedback,
} from '../../../domain/morse/curriculum/listening'
import {
  lessonSittingOf,
  newLessonSitting,
  recordLessonRetrieval,
  suppressSittingListening,
  type LessonSitting,
} from '../../../domain/morse/curriculum/lessonSitting'
import {
  checkpointNewlyUnlocked,
  morseWordCheckpointPath,
  type MorseWordCheckpointPathItem,
} from '../../../domain/morse/curriculum/checkpoints'
import { completeSitting, morseReviewOf, withMorseReview } from '../../../domain/morse/curriculum/review'
import { useLibrary } from '../../../services/library/LibraryProvider'
import type { Topic } from '../../../domain/library/topic'
import { useKeyedResponse } from '../input/useKeyedResponse'
import { MorseCheckpoint } from './MorseCheckpoint'
import { MorseBeatGrammarNote } from '../MorsePhrase'
import { useMorseAudio } from '../useMorseAudio'
import { CharacterStage, ListeningCheckStep, VisualCheckStep } from './LessonSteps'
import { useLessonRecord } from './useLessonRecord'
import './MorseLesson.css'

/** The #78/#90 word-checkpoint milestones, tied to the checkpoint curriculum. */
const CHECKPOINT_LESSON_NUMBERS = new Set([4, 7, 10, 13])

interface CheckpointHandoff {
  checkpoint: MorseWordCheckpointPathItem
  /** The run to resume into once the learner starts, skips, or finishes the checkpoint. */
  resume: LessonRun
}

interface MorseLessonProps {
  topic: Topic
  initialRun: LessonRun
  onExit: () => void
  onTest: () => void
  onReference: () => void
}

export function MorseLesson({ topic, initialRun, onExit, onTest, onReference }: MorseLessonProps) {
  const { topics } = useLibrary()
  const record = useLessonRecord(topic.id)
  const { sounding, audioError, clearError, stop, toggle } = useMorseAudio()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const stepRef = useRef<HTMLDivElement>(null)

  const [run, setRun] = useState<LessonRun>(initialRun)
  // The sitting resumes from the topic itself (#66). There is no sidecar store:
  // what the learner sees at 6/10 is the same value an export carries.
  const [sitting, setSitting] = useState<LessonSitting>(() => lessonSittingOf(topic))
  const [listeningState, setListeningState] = useState(() => ({
    ...newLessonListeningState(),
    // A durable sitting has to resume the learner's own declaration with it.
    // Saying "can't listen now" and being handed a listening question again
    // after a reload, still inside the same sitting, is the contradiction the
    // durable field exists to prevent.
    suppressed: Boolean(topic.lessonSitting?.listeningSuppressed),
  }))
  const [listeningFeedback, setListeningFeedback] = useState<ListeningFeedback | null>(null)
  const [audioNotice, setAudioNotice] = useState<string | null>(null)
  // #88: a milestone lesson just settled and its word checkpoint is being
  // offered before the learner is sent on. Local and ephemeral like the
  // checkpoint itself — losing it on reload re-derives the same choice from
  // `morseWordCheckpointPath`, it just skips one invitation rather than
  // corrupting anything durable.
  const [checkpointInvite, setCheckpointInvite] = useState<CheckpointHandoff | null>(null)
  const [runningCheckpoint, setRunningCheckpoint] = useState<CheckpointHandoff | null>(null)
  /**
   * The advance that belongs to the answer currently on screen. It is captured
   * at answer time rather than rebuilt on render, because the run and sitting
   * it must act on are the ones that existed when the learner responded.
   */
  const pendingAdvance = useRef<(() => void) | null>(null)
  const { phase, armed, answered, reset: resetResponse } = useKeyedResponse(
    () => {
      const advance = pendingAdvance.current
      pendingAdvance.current = null
      advance?.()
    },
    // A learner who taps to replay the correct sound on a miss is still
    // reading the correction; the surface must not move on underneath them.
    () => sounding !== null,
  )
  // The lesson's own view of the topic, kept current from the store rather than
  // frozen at mount, so resuming a packet reads the support levels that exist
  // now. Writes go through `updateTopic` and never replay this value.
  const live = topics.find((candidate) => candidate.id === topic.id) ?? topic
  const topicRef = useRef<Topic>(live)
  topicRef.current = live

  const hasFeedback = Boolean(run.feedback || listeningFeedback)
  const step = hasFeedback ? null : currentStep(run)
  const packetProgress = lessonProgressCount(run)
  /**
   * Which character this slot asks by ear, chosen by listening need across the
   * whole roster rather than by whichever one the printed queue offered (#90
   * §5). Asking the printed queue's pick is what produced the baseline's
   * modality gap: a fixed cadence landing repeatedly on the same few letters
   * while others were never heard at all.
   */
  const listeningEntry =
    step?.kind === 'check'
      ? chooseListeningTarget(sitting.retrievals, run.entries, listeningState, morseReviewOf(live))
      : null
  const listening = listeningEntry !== null
  const audioOptions = listeningEntry
    ? lessonListeningOptions(run, listeningEntry, introducedGlyphs(live), sitting.retrievals, morseReviewOf(live))
    : []

  useEffect(() => {
    if (!audioError) return
    stop()
    setListeningState((state) => suppressListening(state))
    setAudioNotice('Audio is unavailable. Continuing with visual questions for this lesson.')
  }, [audioError, stop])

  useEffect(() => {
    if (checkpointInvite || run.complete || run.finished) headingRef.current?.focus()
    else if (!hasFeedback && armed) stepRef.current?.focus({ preventScroll: true })
  }, [run.step, run.complete, run.finished, hasFeedback, armed, listeningState.suppressed, checkpointInvite])

  /**
   * Persist one lesson step.
   *
   * Functional rather than whole-object (#62): a Test banked minutes ago, or a
   * sibling write, may have changed this topic since the lesson opened, and
   * writing back a captured copy would quietly undo it. `withLessonProgress`
   * touches nothing but lesson support, and `withAcquisitionReadiness` stamps
   * the readiness anchor in the same update as the answer that earned it, so the
   * retention clock starts at readiness rather than one render later.
   */
  function commit(next: LessonRun) {
    setRun(next)
    record.commitProgress(next)
  }

  function persistSitting(next: LessonSitting) {
    setSitting(next)
    record.persistSitting(next)
  }

  /**
   * Acknowledge an introduction, and record which sitting it happened in.
   *
   * The sitting ordinal is what makes #90 §4's "succeeded in a later sitting"
   * answerable at all, and it can only be captured here — by the time the
   * character is being retrieved, the fact of when it was first met is gone.
   */
  function introduce(itemId: string) {
    commit(introduceLesson(run, itemId))
    record.recordIntroduction(itemId)
  }

  /**
   * Record one printed retrieval in the review history.
   *
   * Functional against `current` rather than a captured copy, for the same
   * reason `commit` is: a sibling write may have moved this topic since the
   * lesson opened, and review history must compose with it rather than
   * reinstate a stale snapshot.
   */
  function notePrinted(itemId: string, correct: boolean) {
    record.recordPrinted(itemId, correct)
  }

  /**
   * Record one listening retrieval. Kept in its own counters, so it can neither
   * satisfy the printed claim nor reset printed staleness (#90 §5, #29).
   */
  function noteListening(itemId: string, correct: boolean) {
    record.recordListening(itemId, correct)
  }

  /**
   * Which checkpoint, if any, this exact lesson settlement just unlocked for
   * the first time (#88). The milestone list now includes #90's later cumulative
   * applications after Lessons 10 and 13 as well as the original #78 pair.
   *
   * `pathBeforeAnswer` is a snapshot taken in `answerVisual` before that
   * answer's progress was persisted — the one moment this comparison needs
   * and the render loop never naturally holds onto, since by the time this
   * runs `topicRef.current` already reflects the committed answer. Comparing
   * it against the path now is what tells a genuine first crossing apart from
   * passing through a later lesson-complete screen, or a repair re-settling an
   * already-reached lesson.
   */
  function newlyUnlockedCheckpoint(
    completedLessonNumber: number,
    pathBeforeAnswer: MorseLessonPathItem[] | null,
  ): MorseWordCheckpointPathItem | null {
    if (!pathBeforeAnswer || !CHECKPOINT_LESSON_NUMBERS.has(completedLessonNumber)) return null
    const pathNow = morseLessonPath(topicRef.current)
    if (!pathNow) return null
    if (!checkpointNewlyUnlocked(pathBeforeAnswer, pathNow, completedLessonNumber)) return null
    const checkpoints = morseWordCheckpointPath(topicRef.current)
    return checkpoints?.find((checkpoint) => checkpoint.afterLesson === completedLessonNumber) ?? null
  }

  function movePastVisualFeedback(
    answeredRun: LessonRun,
    pathBeforeAnswer: MorseLessonPathItem[] | null,
  ) {
    const cleared = advanceLesson(answeredRun)
    const invite = cleared.complete ? newlyUnlockedCheckpoint(cleared.packetIndex + 1, pathBeforeAnswer) : null

    if (invite) {
      setCheckpointInvite({ checkpoint: invite, resume: cleared })
      return
    }
    setRun(cleared)
  }

  function startInvitedCheckpoint() {
    if (!checkpointInvite) return
    setRunningCheckpoint(checkpointInvite)
    setCheckpointInvite(null)
  }

  function skipInvitedCheckpoint() {
    if (!checkpointInvite) return
    setRun(checkpointInvite.resume)
    setCheckpointInvite(null)
  }

  function finishRunningCheckpoint() {
    if (!runningCheckpoint) return
    setRun(runningCheckpoint.resume)
    setRunningCheckpoint(null)
  }

  function answerVisual(itemId: string, response: string) {
    if (!armed) return
    const next = answerLesson(run, itemId, response)
    if (next === run || !next.feedback) return
    setListeningState((state) => recordLessonQuestion(state, itemId))
    const nextSitting = recordLessonRetrieval(sitting, itemId, next.feedback.correct)
    persistSitting(nextSitting)
    notePrinted(itemId, next.feedback.correct)
    // Snapshot the path before this answer's progress commits (#88): it is
    // the "before" side of the newly-unlocked comparison, and the only point
    // at which `topicRef.current` has not yet absorbed this answer.
    const pathBeforeAnswer = morseLessonPath(topicRef.current)
    commit(next)
    // A hit used to advance in the same tick it was recorded, so its feedback
    // existed in state for less than a frame and the learner never saw it. Both
    // verdicts now stand for their policy duration before the surface moves.
    pendingAdvance.current = () => movePastVisualFeedback(next, pathBeforeAnswer)
    answered(next.feedback.correct)
  }

  function answerListening(itemId: string, response: string) {
    if (!armed) return
    const result = answerListeningQuestion(run, itemId, response)
    if (!result) return
    stop()
    setRun(result.run)
    setListeningState((state) => recordListeningAnswer(state, itemId, result.feedback.correct))
    const nextSitting = recordLessonRetrieval(sitting, itemId, result.feedback.correct)
    persistSitting(nextSitting)
    noteListening(itemId, result.feedback.correct)
    setListeningFeedback(result.feedback)
    pendingAdvance.current = () => setListeningFeedback(null)
    answered(result.feedback.correct)
  }

  /**
   * The learner declining listening is durable for this sitting; an audio
   * *failure* is not. One is a decision that belongs to the sitting they are in,
   * the other is a fact about this device right now, and restoring listening
   * after a reload that fixes it is the right answer for the second.
   */
  function skipListening() {
    stop()
    setListeningState((state) => suppressListening(state))
    persistSitting(suppressSittingListening(sitting))
    setAudioNotice('Listening skipped. This sitting will stay visual.')
  }

  function nextPacket() {
    // Select review against the next sitting ordinal, matching the durable close.
    const nextTopic = withMorseReview(topicRef.current, completeSitting(morseReviewOf(topicRef.current)))
    const next = startLesson(nextTopic)
    if (!next) return
    stop()
    clearError()
    resetResponse()
    pendingAdvance.current = null
    setRun(next)
    // A packet completes the current sitting. The next packet begins clean,
    // and a clean sitting is represented by the absent durable field.
    setSitting(newLessonSitting())
    // Count the close when the learner actually proceeds. This makes the next
    // retrieval a later-sitting success without crediting an abandoned run.
    record.closeSitting()
    setListeningState(newLessonListeningState())
    setListeningFeedback(null)
    setAudioNotice(null)
  }

  const bar = (
    <div className="session-bar">
      <p>
        <span className="session-topic">
          {run.finished ? 'Morse curriculum' : `Lesson ${run.packetIndex + 1} of ${run.packetCount}`}
        </span>
        <span className="tabular">
          {run.finished
            ? 'All packets settled'
            : `${sitting.retrievals} retrievals`}
        </span>
      </p>
      <button className="ghost small" type="button" onClick={onExit}>Close</button>
    </div>
  )

  if (runningCheckpoint) {
    return (
      <MorseCheckpoint
        checkpoint={runningCheckpoint.checkpoint}
        onExit={onExit}
        onContinue={finishRunningCheckpoint}
        continueLabel="Keep going"
      />
    )
  }

  if (checkpointInvite) {
    const { checkpoint } = checkpointInvite
    const wordCount = checkpoint.words.length
    return (
      <section className="session morse-lesson">
        {bar}
        <h1 ref={headingRef} tabIndex={-1} className="lesson-title">Lesson {checkpoint.afterLesson} complete</h1>
        <p className="lesson-lede">You now know enough letters to use a few of them together.</p>
        <div className="checkpoint-invite-card">
          <p className="lesson-task">Word checkpoint</p>
          <p>Key a real word one letter at a time, using only letters you already know.</p>
          <p className="lesson-foot">
            {checkpoint.warmups.length} quick warm-ups, then {wordCount === 1 ? 'one word' : `${wordCount} words`}.
          </p>
        </div>
        <div className="lesson-exits" inert={!armed}>
          <button type="button" onClick={startInvitedCheckpoint}>Start checkpoint</button>
          <button className="ghost" type="button" onClick={skipInvitedCheckpoint}>Skip for now</button>
        </div>
        <p className="lesson-foot">Optional and formative: skipping never blocks the next lesson.</p>
      </section>
    )
  }

  if (run.finished) {
    return (
      <section className="session morse-lesson">
        {bar}
        <h1 ref={headingRef} tabIndex={-1} className="lesson-title">You have been through every letter</h1>
        <p className="lesson-lede">
          All 26 characters have been produced unaided at least once in Learn. That is acquisition, not proof:
          the printed A–Z claim is earned in Test, uncued and in both directions.
        </p>
        <div className="lesson-exits" inert={!armed}>
          <button type="button" onClick={onTest}>Test me</button>
          <button className="ghost" type="button" onClick={onReference}>Morse alphabet</button>
        </div>
      </section>
    )
  }

  if (run.complete) {
    const last = run.packetIndex + 1 >= run.packetCount
    return (
      <section className="session morse-lesson">
        {bar}
        <h1 ref={headingRef} tabIndex={-1} className="lesson-title">Lesson {run.packetIndex + 1} done</h1>
        <p className="lesson-lede">Every character in this packet was produced from the letter alone. {last ? 'That was the last lesson.' : 'The next lesson brings two new characters and mixes these back in.'}</p>
        <div className="lesson-exits" inert={!armed}>
          <button type="button" onClick={nextPacket}>{last ? 'Finish' : 'Next lesson'}</button>
          <button className="ghost" type="button" onClick={onExit}>Stop here</button>
        </div>
        <p className="lesson-foot">Nothing in Learn is scored. Test is still the only place the A–Z claim is proved.</p>
      </section>
    )
  }

  const feedback = run.feedback
  const shownListeningFeedback = listeningFeedback

  return (
    <section className="session morse-lesson" data-phase={phase}>
      {bar}
      <h1 ref={headingRef} tabIndex={-1} className="sr-only">Morse lesson, packet {run.packetIndex + 1} of {run.packetCount}</h1>
      <p className="lesson-foot">Lesson progress: {packetProgress.done} of {packetProgress.total} settled.</p>
      {run.reviewOnly && <p className="lesson-review-label">Review</p>}

      {(feedback?.correct || shownListeningFeedback?.correct) && (
        <div className="lesson-feedback is-correct" role="status" aria-live="polite">
          <p className="lesson-verdict">Correct</p>
        </div>
      )}

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
          <button
            className="lesson-next"
            type="button"
            onClick={() => introduce(step.entry.itemId)}
          >
            Got it
          </button>
        </div>
      )}

      {!hasFeedback && step?.kind === 'check' && listeningEntry && (
        <ListeningCheckStep key={`listen-${listeningEntry.itemId}-${run.step}`} regionRef={stepRef} entry={listeningEntry}
          options={audioOptions} playing={sounding?.glyph === listeningEntry.glyph} onToggle={() => toggle(listeningEntry.glyph)}
          onAnswer={(response) => answerListening(listeningEntry.itemId, response)} onSkip={skipListening} armed={armed} />
      )}

      {!hasFeedback && step?.kind === 'check' && !listening && (
        <VisualCheckStep key={`visual-${step.entry.itemId}-${run.step}`} regionRef={stepRef} entry={step.entry}
          format={step.format} armed={armed} onAnswer={(response) => answerVisual(step.entry.itemId, response)} />
      )}

      {(audioNotice || audioError) && <p className="morse-audio-error" role="status">{audioNotice ?? `${audioError} Continuing visually.`}</p>}
    </section>
  )
}
