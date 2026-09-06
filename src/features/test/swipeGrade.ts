import { testCardTextScale } from './textScale'

/**
 * Self-score grading by horizontal swipe.
 *
 * The gesture itself is owned by `motion` — this module holds only the pure
 * decision it needs: given where a release happened and how fast, is that a
 * deliberate grade, and which one? Keeping it here means the thresholds are
 * testable without a pointer, and the component never re-derives them.
 *
 * Direction is the existing semantic, unchanged: left is incorrect, right is
 * correct.
 */
export type SwipeGrade = 'incorrect' | 'correct'

export interface SwipeRelease {
  /** Horizontal travel from where the drag started, in CSS pixels. */
  offsetX: number
  /** Vertical travel over the same drag. */
  offsetY: number
  /** Horizontal velocity at release, in pixels per second. */
  velocityX: number
  /** Vertical velocity at release, over the same release. */
  velocityY: number
  /** Card width, so the commit distance scales with the viewport. */
  width: number
}

/** Commit distance as a share of the card, so a 320px phone is not asked for a 1280px throw. */
export const SWIPE_COMMIT_FRACTION = 0.26
/** Floor and ceiling on that share: never trivially short, never a full-arm reach. */
export const SWIPE_COMMIT_MIN_PX = 64
export const SWIPE_COMMIT_MAX_PX = 150
/** A release faster than this reads as a deliberate flick. */
export const SWIPE_FLICK_VELOCITY = 480
/** A flick still has to travel far enough to be a gesture rather than a tap. */
export const SWIPE_FLICK_MIN_PX = 28
/** How far horizontal has to beat vertical before the movement counts as a swipe. */
export const SWIPE_AXIS_RATIO = 1.2
/** Travel at which the drag cue reaches full strength. Visual only. */
export const SWIPE_CUE_FULL_PX = 96

function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value))
}

/** How far this card has to travel before a slow, deliberate drag commits. */
export function swipeCommitDistance(width: number): number {
  const scaled = (Number.isFinite(width) && width > 0 ? width : SWIPE_COMMIT_MAX_PX) * SWIPE_COMMIT_FRACTION
  return clamp(scaled, SWIPE_COMMIT_MIN_PX, SWIPE_COMMIT_MAX_PX)
}

function sameDirection(a: number, b: number): boolean {
  return a > 0 === b > 0
}

/**
 * The grade a release commits to, or `null` for anything ambiguous.
 *
 * Ambiguous covers the three ways a card must come back untouched: it barely
 * moved, it moved mostly vertically because the page was being scrolled, or it
 * was dragged out and let go on the way back.
 */
export function swipeIntent(release: SwipeRelease): SwipeGrade | null {
  const { offsetX, offsetY, velocityX, velocityY, width } = release
  const travel = Math.abs(offsetX)
  if (travel === 0) return null
  // Vertical intent is page intent. It never grades, whatever the horizontal
  // component happened to be.
  if (travel < Math.abs(offsetY) * SWIPE_AXIS_RATIO) return null

  const committedByDistance = travel >= swipeCommitDistance(width)
  const committedByFlick =
    Math.abs(velocityX) >= SWIPE_FLICK_VELOCITY &&
    Math.abs(velocityX) >= Math.abs(velocityY) * SWIPE_AXIS_RATIO &&
    travel >= SWIPE_FLICK_MIN_PX &&
    sameDirection(velocityX, offsetX)

  if (!committedByDistance && !committedByFlick) return null
  return offsetX > 0 ? 'correct' : 'incorrect'
}

/** Signed drag strength, -1 (fully incorrect) to 1 (fully correct). Visual only. */
export function swipeCueStrength(offsetX: number): number {
  return clamp(offsetX / SWIPE_CUE_FULL_PX, -1, 1)
}

/**
 * Whether a deck should grade by swipe alone instead of a visible button row.
 *
 * Derived from the content, not from a topic id. A token-recall deck — NATO
 * letter → code word, the ABCDE headings, cardinal bearings — is a card you
 * glance at and flick. A deck whose prompts or answers are sentences renders a
 * tall, left-aligned reading block, and hiding its grading controls behind a
 * gesture would be a regression, so those keep the explicit buttons.
 */
export function isTokenRecallDeck(items: { prompt: string; answer: string }[]): boolean {
  if (items.length === 0) return false
  return items.every(
    (item) =>
      testCardTextScale(item.prompt) === 'short' && testCardTextScale(item.answer) === 'short',
  )
}
