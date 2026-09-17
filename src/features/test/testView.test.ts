import { describe, expect, it } from 'vitest'
import { nextView, type TestView } from './testView'

/**
 * The confidentiality rule, stated directly rather than inferred from a
 * rendered tree: no transition ever produces a view that pairs a new index
 * with a state that mounts an answer.
 */
describe('the Test view machine', () => {
  const asking: TestView = { kind: 'asking', index: 0 }
  const revealed: TestView = { kind: 'revealed', index: 0 }
  const exiting: TestView = { kind: 'exiting', index: 0, grade: 'correct' }

  it('reveals only a card that is being asked', () => {
    expect(nextView(asking, { kind: 'reveal' }, 3)).toEqual({ kind: 'revealed', index: 0 })
    expect(nextView(revealed, { kind: 'reveal' }, 3)).toBeNull()
    expect(nextView(exiting, { kind: 'reveal' }, 3)).toBeNull()
    expect(nextView({ kind: 'done' }, { kind: 'reveal' }, 3)).toBeNull()
  })

  it('takes one grade per card, and holds the index through the exit', () => {
    const graded = nextView(revealed, { kind: 'grade', grade: 'incorrect' }, 3)
    expect(graded).toEqual({ kind: 'exiting', index: 0, grade: 'incorrect' })
    // The second grade of a single batch finds a view that is no longer revealed.
    expect(nextView(graded as TestView, { kind: 'grade', grade: 'correct' }, 3)).toBeNull()
    expect(nextView(asking, { kind: 'grade', grade: 'correct' }, 3)).toBeNull()
  })

  it('moves to the next index only by way of asking', () => {
    expect(nextView(exiting, { kind: 'advance' }, 3)).toEqual({ kind: 'asking', index: 1 })
    expect(nextView(revealed, { kind: 'advance' }, 3)).toBeNull()
  })

  it('finishes rather than running off the end of the deck', () => {
    const last: TestView = { kind: 'exiting', index: 2, grade: 'correct' }
    expect(nextView(last, { kind: 'advance' }, 3)).toEqual({ kind: 'done' })
    expect(nextView({ kind: 'asking', index: 2 }, { kind: 'answer' }, 3)).toEqual({ kind: 'done' })
  })

  it('never reaches a new index in a state that mounts an answer', () => {
    const events = [
      { kind: 'reveal' },
      { kind: 'grade', grade: 'correct' },
      { kind: 'advance' },
      { kind: 'answer' },
    ] as const
    const views: TestView[] = [asking, revealed, exiting, { kind: 'done' }]

    for (const view of views) {
      for (const event of events) {
        const next = nextView(view, event, 3)
        if (!next || next.kind === 'done') continue
        const movedOn = view.kind !== 'done' && next.index !== view.index
        if (movedOn) expect(next.kind).toBe('asking')
      }
    }
  })

  it('scores a ladder card and moves on in one step', () => {
    expect(nextView(asking, { kind: 'answer' }, 3)).toEqual({ kind: 'asking', index: 1 })
    expect(nextView({ kind: 'done' }, { kind: 'answer' }, 3)).toBeNull()
  })
})
