import type { PracticeTarget } from './practiceTargets'

/**
 * How far back a missed target is pushed before it is asked again.
 *
 * The same interval the Learn ladder uses, and for the same reason: an item
 * re-asked immediately is answered from the echo of the answer just shown,
 * which is recognition wearing recall's clothes. Two intervening targets is
 * enough to make the second answer a retrieval again without stretching a
 * ten-item run into a long one.
 */
export const PRACTICE_REVISIT_GAP = 2

export interface PracticeStep {
  target: PracticeTarget
  /** What the learner is shown. */
  question: string
  /** What `reveal` uncovers. */
  answer: string
}

export interface PracticeRunState {
  /** Remaining queue, current step first. */
  queue: PracticeTarget[]
  /** Targets answered right and not re-queued. */
  settled: string[]
  /** How many answers have been given, right or wrong. */
  answered: number
  /** Set while feedback for the just-answered target is on screen. */
  feedback: { correct: boolean; answer: string } | null
}

/**
 * The stable key for one direction of one item.
 *
 * Direction is part of the identity: recalling `-...` from `B` and `B` from
 * `-...` are two different retrievals, and a run that settled one when the
 * learner answered the other would be claiming practice that did not happen.
 */
export function targetKey(target: PracticeTarget): string {
  return `${target.item.id}:${target.direction}`
}

/**
 * Which way round this target is asked.
 *
 * `prompt-to-answer` shows the prompt and wants the answer; `answer-to-prompt`
 * is the reverse. Both readings come from the same authored pair, so a topic
 * needs no extra content to be practised in either direction.
 */
export function practiceStep(target: PracticeTarget): PracticeStep {
  const forward = target.direction === 'prompt-to-answer'
  return {
    target,
    question: forward ? target.item.prompt : target.item.answer,
    answer: forward ? target.item.answer : target.item.prompt,
  }
}

export function startPracticeRun(targets: PracticeTarget[]): PracticeRunState {
  return { queue: [...targets], settled: [], answered: 0, feedback: null }
}

export function currentTarget(state: PracticeRunState): PracticeTarget | null {
  return state.queue[0] ?? null
}

export function practiceComplete(state: PracticeRunState): boolean {
  return state.queue.length === 0 && state.feedback === null
}

/**
 * Grade the current target.
 *
 * A right answer settles it and moves straight on: the learner just produced
 * the answer, so being shown it again is an extra tap in exchange for nothing.
 * The next question arriving, and the count going down, is the confirmation. A
 * wrong answer holds, because that is the one case where there is something the
 * learner does not already have — and the target is pushed back down the queue
 * so the run ends only once it has actually been retrieved, which is what makes
 * practice practice rather than a second opportunity to be told.
 *
 * Nothing here touches a topic, and nothing here returns one. That is the whole
 * evidence guarantee: a practice answer has no path to durable state because
 * this function has no durable state to reach. `PracticeRun` imports no store
 * write, exactly as `MorseCheckpoint` imports none.
 */
export function answerPractice(state: PracticeRunState, correct: boolean): PracticeRunState {
  const target = currentTarget(state)
  if (!target || state.feedback) return state

  const rest = state.queue.slice(1)
  const step = practiceStep(target)

  if (correct) {
    return {
      queue: rest,
      settled: [...state.settled, targetKey(target)],
      answered: state.answered + 1,
      feedback: null,
    }
  }

  // Re-queue behind the next few, or at the end when the run is nearly over.
  const at = Math.min(PRACTICE_REVISIT_GAP, rest.length)
  return {
    queue: [...rest.slice(0, at), target, ...rest.slice(at)],
    settled: state.settled,
    answered: state.answered + 1,
    feedback: { correct: false, answer: step.answer },
  }
}

/** Clear feedback and move to whatever the queue now holds. */
export function advancePractice(state: PracticeRunState): PracticeRunState {
  return state.feedback ? { ...state, feedback: null } : state
}
