import { useEffect, useState } from 'react'
import { startLesson, type LessonRun as GuidedRun } from '../../lib/morseLesson'
import { morseLessonPath, startReplayLesson } from '../../lib/morseLessonPath'
import { morseWordCheckpointPath } from '../../lib/morseWordCheckpoints'
import { resolveStudy } from '../../lib/scheduling'
import { useLibrary } from '../../lib/LibraryProvider'
import type { RunTarget } from '../../app/routing/routes'
import { MorseCheckpoint } from './MorseCheckpoint'
import { MorseLesson } from './MorseLesson'
import { MorseReplay } from './MorseReplay'

interface LessonRunProps {
  topicId: string
  target: RunTarget
  onExit: () => void
  onCheck: () => void
  onReference: () => void
}

/**
 * The guided run: one bounded acquisition task, full screen, nothing else.
 *
 * This replaces the old generic `Learn` route, which did two unrelated jobs. For
 * an ordinary topic it rendered a reading sheet that repeated the topic page it
 * was launched from; that half is gone, and the reference now lives on the topic
 * page where it always belonged. For Morse it rendered the curriculum path and
 * then the lesson inside it; the path has moved to the topic page, so opening
 * Morse lands on the curriculum rather than behind a button called `Learn`.
 *
 * What is left is what a run should be: the learner asked for one specific task,
 * and this mounts it. The path decides which task; this does not show a menu.
 *
 * The evidence boundary is unchanged and still structural. `MorseLesson` writes
 * formative acquisition, the durable sitting and the readiness anchor through
 * narrow functional topic updates. `MorseReplay` and `MorseCheckpoint` import no
 * store write path at all, so their answers cannot reach the scheduler, cue
 * evidence or completion.
 */
export function LessonRun({ topicId, target, onExit, onCheck, onReference }: LessonRunProps) {
  const { topics, updateTopic } = useLibrary()
  const topic = topics.find((candidate) => candidate.id === topicId)

  // Built once, from the topic as it stood when the run opened. A lesson rebuilds
  // its own queue from durable state; it must not be reconstructed underneath the
  // learner every time an answer writes to the store.
  const [run] = useState<GuidedRun | null>(() => {
    if (!topic) return null
    if (target.kind === 'replay') return startReplayLesson(topic, target.index)
    if (target.kind === 'checkpoint') return null
    return startLesson(topic)
  })

  const [checkpoint] = useState(() => {
    if (!topic || target.kind !== 'checkpoint') return null
    return (
      morseWordCheckpointPath(topic)?.find(
        (candidate) => candidate.afterLesson === target.afterLesson && candidate.unlocked,
      ) ?? null
    )
  })

  const guided = topic ? morseLessonPath(topic) !== null : false

  /**
   * First exposure for a curriculum topic, which the deleted generic Learn route
   * used to own. Starting the lesson is the exposure; opening the topic page and
   * reading the path is not, which is why the topic page deliberately leaves
   * this write to the run.
   *
   * A replay or a word checkpoint is excluded for the same reason: neither is
   * canonical acquisition, and neither may move a topic off `unstarted`.
   */
  useEffect(() => {
    if (!guided || target.kind !== 'lesson') return
    updateTopic(topicId, (current) => resolveStudy(current))
    // Exposure belongs to opening the lesson, not to every render of it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topicId, guided, target.kind])

  useEffect(() => {
    // A stale history entry can name a topic that is no longer a curriculum, or
    // a lesson that no longer exists. Leave rather than render an empty shell.
    if (!topic || !guided || (!run && !checkpoint)) onExit()
  }, [topic, guided, run, checkpoint, onExit])

  if (!topic || !guided) return null

  if (checkpoint) {
    return <MorseCheckpoint checkpoint={checkpoint} onExit={onExit} />
  }

  if (!run) return null

  if (target.kind === 'replay') {
    return <MorseReplay initialRun={run} onExit={onExit} />
  }

  return (
    <MorseLesson
      topic={topic}
      initialRun={run}
      onExit={onExit}
      onTest={onCheck}
      onReference={onReference}
    />
  )
}
