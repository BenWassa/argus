// Owns ephemeral checkpoint invitations and the lesson run resumed afterwards.

import { useState, type RefObject, type Dispatch, type SetStateAction } from 'react'
import type { Topic } from '../../../domain/library/topic'
import { advanceLesson, type LessonRun } from '../../../domain/morse/curriculum/lesson'
import { morseLessonPath, type MorseLessonPathItem } from '../../../domain/morse/curriculum/lessonPath'
import { checkpointNewlyUnlocked, morseWordCheckpointPath, type MorseWordCheckpointPathItem } from '../../../domain/morse/curriculum/checkpoints'

/** The #78/#90 word-checkpoint milestones, tied to the checkpoint curriculum. */
const CHECKPOINT_LESSON_NUMBERS = new Set([4, 7, 10, 13])

interface CheckpointHandoff {
  checkpoint: MorseWordCheckpointPathItem
  /** The run to resume into once the learner starts, skips, or finishes the checkpoint. */
  resume: LessonRun
}

export function useCheckpointHandoff(
  topicRef: RefObject<Topic>,
  replay: boolean,
  setRun: Dispatch<SetStateAction<LessonRun>>,
) {
  // #88: a milestone lesson just settled and its word checkpoint is being
  // offered before the learner is sent on. Local and ephemeral like the
  // checkpoint itself — losing it on reload re-derives the same choice from
  // `morseWordCheckpointPath`, it just skips one invitation rather than
  // corrupting anything durable.
  const [checkpointInvite, setCheckpointInvite] = useState<CheckpointHandoff | null>(null)
  const [runningCheckpoint, setRunningCheckpoint] = useState<CheckpointHandoff | null>(null)
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

  return {
    checkpointInvite, runningCheckpoint, movePastVisualFeedback,
    startInvitedCheckpoint, skipInvitedCheckpoint, finishRunningCheckpoint,
  }
}
