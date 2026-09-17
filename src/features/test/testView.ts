import type { SwipeGrade } from './swipeGrade'

/**
 * What is on screen, as one indivisible value.
 *
 * Answer confidentiality is a property of this shape, not of a transition
 * duration. `index` and the reveal state are the same atom, so no render —
 * batched, interrupted, re-entered or replayed — can pair the next card's
 * index with a state that mounts an answer. A graded card holds `index` for
 * the whole of its exit; the only move to the next index is to `asking`, and
 * `asking` mounts no answer text at all.
 */
export type TestView =
  | { kind: 'asking'; index: number }
  | { kind: 'revealed'; index: number }
  | { kind: 'exiting'; index: number; grade: SwipeGrade }
  | { kind: 'done' }

export type TestPhase = TestView['kind']

/**
 * What the learner just did. `answer` is the objectively graded ladder card,
 * which is scored and moves on in one step; `grade` is the self-scored card,
 * whose exit is a separate, animated step ending in `advance`.
 */
export type TestEvent =
  | { kind: 'reveal' }
  | { kind: 'grade'; grade: SwipeGrade }
  | { kind: 'advance' }
  | { kind: 'answer' }

/**
 * The only way the view moves.
 *
 * `null` means the event is not legal from here and nothing happens — a second
 * grade in one React batch, a reveal on an already-revealed card, an advance
 * for a card that never left. Returning a value rather than mutating is what
 * lets the confidentiality rule above be checked directly rather than inferred
 * from a rendered tree.
 */
export function nextView(view: TestView, event: TestEvent, deckLength: number): TestView | null {
  const following = (at: number): TestView =>
    at + 1 < deckLength ? { kind: 'asking', index: at + 1 } : { kind: 'done' }

  switch (event.kind) {
    case 'reveal':
      return view.kind === 'asking' ? { kind: 'revealed', index: view.index } : null
    case 'grade':
      return view.kind === 'revealed'
        ? { kind: 'exiting', index: view.index, grade: event.grade }
        : null
    case 'advance':
      return view.kind === 'exiting' ? following(view.index) : null
    case 'answer':
      return view.kind === 'done' ? null : following(view.index)
  }
}
