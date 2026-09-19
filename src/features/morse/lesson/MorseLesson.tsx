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
  nextReplayLesson,
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
import { CharacterStage, ListeningCheckStep, StepLabel, VisualCheckStep } from './LessonSteps'
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
  /**
   * True when this is a rerun of a lesson the learner has already reached
   * (#117).
   *
   * Replay is deliberately not a second surface. It is this component, with
   * this component's screens, steps, mnemonics, audio, feedback and word
   * checkpoints, running a lesson the canonical builder produced for an earlier
   * position. The flag changes three things and nothing else: the record writes
   * nothing, "next lesson" walks the printed order instead of the learner's
   * durable position, and the copy stops implying a first meeting.
   */
  replay?: boolean
  onExit: () => void
  onTest: () => void
  onReference: () => void
}

export function MorseLesson({
  topic,
  initialRun,
  replay = false,
  onExit,
  onTest,
  onReference,
}: MorseLessonProps) {
  const { topics } = useLibrary()
  const record = useLessonRecord(topic.id, replay)
  const { sounding, audioError, clearError, stop, toggle } = useMorseAudio()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const stepRef = useRef<HTMLDivElement>(null)

  const [run, setRun] = useState<LessonRun>(initialRun)
  // The sitting resumes from the topic itself (#66). There is no sidecar store:
  // what the learner sees at 6/10 is the same value an export carries.
  //
  // A replay opens a clean local sitting instead. Showing the learner's real
  // "6 retrievals" against work that cannot advance it would be a readout of
  // somebody else's progress, and resuming a durable sitting inside a run that
  // never closes it would strand that sitting mid-count.
  const [sitting, setSitting] = useState<LessonSitting>(() =>
    replay ? newLessonSitting() : lessonSittingOf(topic),
  )
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
  const { phase, armed, holding, answered, acknowledge, reset: resetResponse } = useKeyedResponse(
    () => {
      const advance = pendingAdvance.current
      pendingAdvance.current = null
      advance?.()
    },
  )

  /**
   * End a correction the learner has finished reading.
   *
   * The sound is stopped first: a learner who pressed `Continue` mid-replay has
   * said they are done with this character, and letting its tone run on over
   * the next prompt would be the correction following them out of the screen.
   */
  function continueFromMiss() {
    stop()
    acknowledge()
  }
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
   * Whether the `·`/`—` mark grammar still needs explaining on the spot.
   *
   * The note used to appear under every introduction — twenty-six times across
   * the course, plus every replay — always illustrated with `ZOOM ZOOM ZIP ZIP`,
   * a letter other than the one being taught. Explaining the notation is a
   * first-meeting job, not a permanent caption competing with the mnemonic it
   * is describing.
   *
   * The test is about the learner rather than the lesson's position, which is
   * what makes it right for someone placed into the middle of the course: they
   * told the placement check they already know Morse, and a learner who is
   * genuinely new has always met fewer than a lesson's worth of characters when
   * they first see this. Everyone else keeps it permanently under
   * `How this course works` on the topic page.
   */
  const notationIsNew = introducedGlyphs(live).length < 3
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
  function checkpointOf(completedLessonNumber: number): MorseWordCheckpointPathItem | null {
    const checkpoints = morseWordCheckpointPath(topicRef.current)
    return checkpoints?.find((checkpoint) => checkpoint.afterLesson === completedLessonNumber) ?? null
  }

  function newlyUnlockedCheckpoint(
    completedLessonNumber: number,
    pathBeforeAnswer: MorseLessonPathItem[] | null,
  ): MorseWordCheckpointPathItem | null {
    if (!CHECKPOINT_LESSON_NUMBERS.has(completedLessonNumber)) return null

    // A replay writes nothing, so the two path snapshots are necessarily
    // identical and the first-crossing test can never fire. The milestone is
    // still part of the lesson being rerun, and #117 asks for the word
    // checkpoints where they belong — so replay offers the checkpoint the
    // lesson reaches, which is already unlocked by definition.
    if (replay) {
      const checkpoint = checkpointOf(completedLessonNumber)
      return checkpoint?.unlocked ? checkpoint : null
    }

    if (!pathBeforeAnswer) return null
    const pathNow = morseLessonPath(topicRef.current)
    if (!pathNow) return null
    if (!checkpointNewlyUnlocked(pathBeforeAnswer, pathNow, completedLessonNumber)) return null
    return checkpointOf(completedLessonNumber)
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
    // A replay walks the printed curriculum, because the learner's durable
    // position is the one thing it is not moving: asking `startLesson` for
    // "the next lesson" would hand back wherever acquisition actually stands.
    // The end of the curriculum is an exit rather than a new screen — the
    // replay has no claim to make, and the path it returns to says the rest.
    const next = replay
      ? nextReplayLesson(topicRef.current, run.packetIndex)
      : // Select review against the next sitting ordinal, matching the durable close.
        startLesson(withMorseReview(topicRef.current, completeSitting(morseReviewOf(topicRef.current))))
    if (!next) {
      if (replay) onExit()
      return
    }
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

  // Replay is named once, in the bar, where it stays visible for the whole run.
  // It belongs there rather than on every screen: the learner needs to know
  // which run they are in, not to be reminded at every step that it does not
  // count.
  /**
   * One word for what this is, one number for where you are, and the way out.
   *
   * It used to carry `Lesson 4 of 13` and `7 retrievals` stacked on top of each
   * other, which is two sentences and three numbers to say one thing. The
   * retrieval count in particular measured nothing the learner was working
   * towards — it went up whatever happened, and the lesson does not end on it.
   * What is left is the position in a finite course, which is the only number
   * on this screen worth reading, and it sits where a page number belongs.
   */
  const bar = (
    <div className="session-bar">
      <p>
        <span className="session-topic">{run.finished ? 'Morse' : 'Lesson'}</span>
        {/* Its own element with real whitespace around it, so the line reads as
            two facts to a screen reader too rather than as `LessonReplay`. */}
        {replay && <> <span className="session-mode">Replay</span></>}
      </p>
      {!run.finished && (
        <span className="session-count tabular" aria-label={`Lesson ${run.packetIndex + 1} of ${run.packetCount}`}>
          {run.packetIndex + 1}
          <span className="session-count-of" aria-hidden="true">/{run.packetCount}</span>
        </span>
      )}
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
        <h1 ref={headingRef} tabIndex={-1} className="lesson-title">Checkpoint</h1>
        <p className="lesson-lede">Real words, in letters you already know.</p>
        <p className="lesson-foot">
          {checkpoint.warmups.length} warm-ups, then {wordCount === 1 ? 'one word' : `${wordCount} words`}. Optional.
        </p>
        <div className="lesson-exits" inert={!armed}>
          <button type="button" onClick={startInvitedCheckpoint}>Start</button>
          <button className="ghost" type="button" onClick={skipInvitedCheckpoint}>Skip</button>
        </div>
      </section>
    )
  }

  if (run.finished) {
    return (
      <section className="session morse-lesson">
        {bar}
        <h1 ref={headingRef} tabIndex={-1} className="lesson-title">Every letter covered</h1>
        {/* Trimmed hard, but not past the claim it exists to refuse to make:
            Learn finishing is acquisition, and the A–Z claim is still Test's. */}
        <p className="lesson-lede">That is acquisition, not proof. The A–Z claim is earned in Test.</p>
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
        <h1 ref={headingRef} tabIndex={-1} className="lesson-title">
          Lesson {run.packetIndex + 1} {replay ? 'replayed' : 'done'}
        </h1>
        <p className="lesson-lede">
          {last ? 'That was the last lesson.' : 'Next lesson brings two new letters.'}
        </p>
        <div className="lesson-exits" inert={!armed}>
          <button type="button" onClick={nextPacket}>{last ? 'Finish' : 'Next lesson'}</button>
          <button className="ghost" type="button" onClick={onExit}>Stop here</button>
        </div>
        {/* One line, and only the one the learner cannot infer: what this run
            did and did not change. */}
        <p className="lesson-foot">
          {replay ? 'A replay records nothing.' : 'Nothing in Learn is scored.'}
        </p>
      </section>
    )
  }

  const feedback = run.feedback
  const shownListeningFeedback = listeningFeedback

  return (
    <section
      className="session morse-lesson"
      data-phase={phase}
      // `data-step` marks the screens whose whole job is one retrieval, so the
      // stylesheet can bring the answer down into thumb reach instead of
      // leaving a third of a phone screen empty beneath it. Feedback is
      // excluded on purpose: a correction is read from the top down.
      data-step={!hasFeedback && step ? step.kind : undefined}
    >
      {bar}
      <h1 ref={headingRef} tabIndex={-1} className="sr-only">Morse lesson, packet {run.packetIndex + 1} of {run.packetCount}</h1>
      {/* The one piece of progress worth showing inside a lesson, shown rather
          than spelled out. `Lesson progress: 2 of 5 settled` was a sentence
          carrying two numbers that mattered less than the bar does. */}
      <div
        className="lesson-progress"
        role="progressbar"
        aria-valuenow={packetProgress.done}
        aria-valuemin={0}
        aria-valuemax={packetProgress.total}
        aria-label="Letters settled this lesson"
      >
        <span
          className="lesson-progress-fill"
          style={{ inlineSize: `${packetProgress.total === 0 ? 0 : (packetProgress.done / packetProgress.total) * 100}%` }}
        />
      </div>

      {(feedback?.correct || shownListeningFeedback?.correct) && (
        <div className="lesson-feedback is-correct" role="status" aria-live="polite">
          <p className="lesson-verdict">Correct</p>
        </div>
      )}

      {/* Both corrections hold until `Continue`. Nothing about a miss is on a
          clock any more, so there is no dwell for a learner to lose a
          half-read correction to — see `useKeyedResponse`. */}
      {shownListeningFeedback && !shownListeningFeedback.correct && (
        <div className="lesson-feedback" role="status" aria-live="assertive">
          <p className="lesson-verdict">Not that one</p>
          <p className="lesson-correction">You chose {shownListeningFeedback.response || 'no letter'}. The sound was {shownListeningFeedback.glyph}:</p>
          <CharacterStage glyph={shownListeningFeedback.glyph} pattern={shownListeningFeedback.pattern}
            playing={sounding?.glyph === shownListeningFeedback.glyph}
            activeIndex={sounding?.glyph === shownListeningFeedback.glyph ? sounding.index : null}
            onToggle={() => toggle(shownListeningFeedback.glyph)} />
          <button className="lesson-next" type="button" onClick={continueFromMiss} disabled={!holding}>Continue</button>
        </div>
      )}

      {feedback && !feedback.correct && (
        <div className="lesson-feedback" role="status" aria-live="assertive">
          <p className="lesson-verdict">Not that one</p>
          <p className="lesson-correction">You keyed <span className="mono">{feedback.response ? canonicalPattern(feedback.response) : '—'}</span>. {feedback.glyph} is:</p>
          <CharacterStage glyph={feedback.glyph} pattern={feedback.pattern} playing={sounding?.glyph === feedback.glyph}
            activeIndex={sounding?.glyph === feedback.glyph ? sounding.index : null} onToggle={() => toggle(feedback.glyph)} />
          <button className="lesson-next" type="button" onClick={continueFromMiss} disabled={!holding}>Continue</button>
        </div>
      )}

      {!hasFeedback && step?.kind === 'introduce' && (
        <div className="lesson-introduce" ref={stepRef} tabIndex={-1} data-kind="new">
          <StepLabel>New letter</StepLabel>
          <CharacterStage glyph={step.entry.glyph} pattern={step.entry.pattern} playing={sounding?.glyph === step.entry.glyph}
            activeIndex={sounding?.glyph === step.entry.glyph ? sounding.index : null} onToggle={() => toggle(step.entry.glyph)} />
          {notationIsNew && <MorseBeatGrammarNote className="lesson-grammar" />}
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
