import { useEffect, useRef, useState } from 'react'
import type { Topic } from '../../../domain/library/topic'
import {
  answerLesson,
  currentStep,
  introduceLesson,
  introducedGlyphs,
  lessonProgressCount,
  startAfterCourse,
  startLesson,
  type LessonRun
} from '../../../domain/morse/curriculum/lesson'
import {
  morseLessonPath,
  nextReplayLesson
} from '../../../domain/morse/curriculum/lessonPath'
import {
  lessonSittingOf,
  newLessonSitting,
  recordLessonRetrieval,
  suppressSittingListening,
  type LessonSitting,
} from '../../../domain/morse/curriculum/lessonSitting'
import {
  answerListeningQuestion,
  chooseListeningTarget,
  lessonListeningOptions,
  newLessonListeningState,
  recordLessonQuestion,
  recordListeningAnswer,
  suppressListening,
  type ListeningFeedback,
} from '../../../domain/morse/curriculum/listening'
import { completeSitting, morseReviewOf, withMorseReview } from '../../../domain/morse/curriculum/review'
import { useLibrary } from '../../../services/library/LibraryProvider'
import { fire } from '../../../shared/haptics'
import { useKeyedResponse } from '../input/useKeyedResponse'
import { useMorseAudio } from '../useMorseAudio'
import { useCheckpointHandoff } from './useCheckpointHandoff'
import { useLessonRecord } from './useLessonRecord'
export interface MorseLessonProps {
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
  /** Guided sending, offered beside Test once every letter is acquired (#201). */
  onPlay?: () => void
}
export function useLessonProgression({ topic, initialRun, replay = false, onExit }: MorseLessonProps) {
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
  const { checkpointInvite, runningCheckpoint, movePastVisualFeedback, startInvitedCheckpoint, skipInvitedCheckpoint, finishRunningCheckpoint } = useCheckpointHandoff(topicRef, replay, setRun)

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
    fire(next.feedback.correct ? 'settle' : 'miss')
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
    fire(result.feedback.correct ? 'settle' : 'miss')
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
    const closed = withMorseReview(topicRef.current, completeSitting(morseReviewOf(topicRef.current)))
    const next = replay
      ? nextReplayLesson(topicRef.current, run.packetIndex)
      : run.afterCourse
        ? // Another round goes over what is still owed, in the next sitting.
        startAfterCourse(closed)
        : // Select review against the next sitting ordinal, matching the durable close.
        startLesson(closed)
    if (!next) {
      if (replay || run.afterCourse) onExit()
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


  return { sounding, audioError, toggle, headingRef, stepRef, run, listeningFeedback, audioNotice, checkpointInvite, runningCheckpoint, phase, armed, holding, continueFromMiss, topicRef, hasFeedback, step, packetProgress, listeningEntry, listening, audioOptions, introduce, startInvitedCheckpoint, skipInvitedCheckpoint, finishRunningCheckpoint, answerVisual, answerListening, skipListening, nextPacket }
}
