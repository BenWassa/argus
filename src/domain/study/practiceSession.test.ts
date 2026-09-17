import { describe, expect, it } from 'vitest'
import type { PracticeTarget } from './practiceTargets'
import {
  PRACTICE_REVISIT_GAP,
  advancePractice,
  answerPractice,
  currentTarget,
  practiceComplete,
  practiceStep,
  startPracticeRun,
  targetKey,
} from './practiceSession'
import type { IdentifiedItem } from '../library/topic'

function item(id: string, prompt: string, answer: string): IdentifiedItem {
  return { id, kind: 'bidirectional', prompt, answer }
}

function target(
  id: string,
  direction: PracticeTarget['direction'] = 'prompt-to-answer',
): PracticeTarget {
  return { item: item(id, id.toUpperCase(), `<${id}>`), direction, reason: 'missed' }
}

/** Answer the current target and clear its feedback in one move. */
function answer(state: ReturnType<typeof startPracticeRun>, correct: boolean) {
  return advancePractice(answerPractice(state, correct))
}

describe('asking a target', () => {
  it('shows the prompt and wants the answer, going forward', () => {
    const step = practiceStep(target('a', 'prompt-to-answer'))
    expect(step.question).toBe('A')
    expect(step.answer).toBe('<a>')
  })

  it('shows the answer and wants the prompt, going back', () => {
    const step = practiceStep(target('a', 'answer-to-prompt'))
    expect(step.question).toBe('<a>')
    expect(step.answer).toBe('A')
  })

  it('treats the two directions of one item as different retrievals', () => {
    expect(targetKey(target('a', 'prompt-to-answer'))).not.toBe(
      targetKey(target('a', 'answer-to-prompt')),
    )
  })
})

describe('running the queue', () => {
  it('settles a target answered correctly and moves on', () => {
    let state = startPracticeRun([target('a'), target('b')])
    state = answer(state, true)
    expect(state.settled).toEqual(['a:prompt-to-answer'])
    expect(currentTarget(state)?.item.id).toBe('b')
  })

  it('re-queues a missed target rather than settling it', () => {
    let state = startPracticeRun([target('a'), target('b'), target('c'), target('d')])
    state = answer(state, false)
    expect(state.settled).toEqual([])
    // Asked again, but not immediately: two other targets come first.
    const order = state.queue.map((t) => t.item.id)
    expect(order.slice(0, PRACTICE_REVISIT_GAP)).toEqual(['b', 'c'])
    expect(order[PRACTICE_REVISIT_GAP]).toBe('a')
  })

  it('re-queues at the end when the run is nearly over', () => {
    let state = startPracticeRun([target('a')])
    state = answer(state, false)
    expect(state.queue.map((t) => t.item.id)).toEqual(['a'])
    expect(practiceComplete(state)).toBe(false)
  })

  it('ends only once every target has actually been retrieved', () => {
    let state = startPracticeRun([target('a'), target('b')])
    state = answer(state, false)
    state = answer(state, true)
    expect(practiceComplete(state)).toBe(false)
    state = answer(state, true)
    expect(practiceComplete(state)).toBe(true)
    expect(state.settled).toEqual(['b:prompt-to-answer', 'a:prompt-to-answer'])
  })

  it('counts every answer, including the ones that missed', () => {
    let state = startPracticeRun([target('a')])
    state = answer(state, false)
    state = answer(state, true)
    expect(state.answered).toBe(2)
  })
})

describe('feedback holds the run still, but only where it has something to add', () => {
  it('shows the answer after a miss', () => {
    const state = answerPractice(startPracticeRun([target('a')]), false)
    expect(state.feedback).toEqual({ correct: false, answer: '<a>' })
  })

  /**
   * A correct answer means the learner just produced the answer themselves.
   * Stopping to show it to them would cost a tap and tell them nothing.
   */
  it('moves straight on after a correct answer', () => {
    const state = answerPractice(startPracticeRun([target('a'), target('b')]), true)
    expect(state.feedback).toBeNull()
    expect(currentTarget(state)?.item.id).toBe('b')
  })

  it('ignores a second grade while a miss is being shown', () => {
    const graded = answerPractice(startPracticeRun([target('a'), target('b')]), false)
    expect(answerPractice(graded, true)).toBe(graded)
  })

  it('is complete as soon as the last target is answered correctly', () => {
    const graded = answerPractice(startPracticeRun([target('a')]), true)
    expect(graded.queue).toEqual([])
    expect(practiceComplete(graded)).toBe(true)
  })

  it('is not complete while a miss on the last target is still on screen', () => {
    const graded = answerPractice(startPracticeRun([target('a')]), false)
    expect(practiceComplete(graded)).toBe(false)
    expect(practiceComplete(advancePractice(graded))).toBe(false)
    expect(currentTarget(advancePractice(graded))?.item.id).toBe('a')
  })
})

describe('an empty run', () => {
  it('is complete immediately and grades nothing', () => {
    const state = startPracticeRun([])
    expect(practiceComplete(state)).toBe(true)
    expect(currentTarget(state)).toBeNull()
    expect(answerPractice(state, true)).toBe(state)
  })
})
