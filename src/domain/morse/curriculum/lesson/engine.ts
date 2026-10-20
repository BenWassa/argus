// Formative lesson steps, answer feedback and supported-check presentation.
import { isConfusable } from '../../../study/confusion'
import { MORSE_LETTERS, morsePattern, type MorseLetter } from '../../code'
import { complexityOrderedLetters } from '../packetOrder'
import {
  WEAK_ITEM_DELAY_STEPS,
  LESSON_CHOICE_OPTIONS,
  checkFormat,
  fadedSupport,
  restoredSupport,
  type LessonEntry,
  type LessonFeedback,
  type LessonRun,
  type LessonStep,
} from './support'

function isDone(entry: LessonEntry): boolean {
  return entry.support === 'settled' && entry.asked
}

/**
 * Least recently asked first, so retrieval alternates across the roster instead
 * of drilling one character. Never-asked material leads; ties fall back to the
 * roster order, so the sequence is fully determined by the answers given.
 */
function byStaleness(a: LessonEntry, b: LessonEntry): number {
  return (
    (a.lastAskedAt ?? -1) - (b.lastAskedAt ?? -1) ||
    a.notBefore - b.notBefore ||
    // Among characters nobody has retrieved yet, the ones this packet just
    // introduced go first: that is what makes the first retrieval follow its
    // introduction rather than trail three returning characters.
    Number(b.novel) - Number(a.novel) ||
    a.order - b.order
  )
}

/**
 * Which unfinished entry belongs to the next step. Returns `null` when the
 * lesson is complete. A completed entry is never reopened as a spacer.
 */
function nextStepIndex(run: LessonRun): number | null {
  const pending = run.entries.filter((entry) => !entry.done)
  if (pending.length === 0) return null

  const eligible = pending.filter((entry) => entry.notBefore <= run.step)
  if (eligible.length > 0) {
    const chosen = [...eligible].sort(byStaleness)[0]
    return run.entries.indexOf(chosen)
  }

  // No other unfinished item can provide spacing. Revisit the earliest pending
  // correction rather than reopening a character the learner already completed.
  const chosen = [...pending].sort((a, b) => a.notBefore - b.notBefore || byStaleness(a, b))[0]
  return run.entries.indexOf(chosen)
}

/**
 * The one dominant task on screen. An entry that has never been introduced is
 * introduced first, in roster order; everything after that is retrieval. A
 * post-miss confirmation is always solo, even while its stored support keeps
 * the repair level for a resumed lesson.
 */
export function currentStep(run: LessonRun): LessonStep | null {
  if (run.complete) return null

  const uninitiated = run.entries
    .filter((entry) => !entry.introduced)
    .sort((a, b) => a.order - b.order)
  if (uninitiated.length > 0) return { kind: 'introduce', entry: uninitiated[0] }

  const next = nextStepIndex(run)
  if (next === null) return null
  const entry = run.entries[next]
  return { kind: 'check', entry, format: entry.recovery ? 'solo' : checkFormat(entry.support) }
}

function replaceEntry(run: LessonRun, itemId: string, next: LessonEntry): LessonEntry[] {
  return run.entries.map((entry) => (entry.itemId === itemId ? next : entry))
}

function settle(run: LessonRun, entries: LessonEntry[]): LessonRun {
  return { ...run, entries, complete: entries.every(isDone) }
}

/** Acknowledge an introduction. Nothing is scored and no support level moves. */
export function introduceLesson(run: LessonRun, itemId: string): LessonRun {
  const entry = run.entries.find((candidate) => candidate.itemId === itemId)
  if (!entry || entry.introduced) return run
  const next: LessonEntry = { ...entry, introduced: true }
  return settle({ ...run, step: run.step + 1, feedback: null }, replaceEntry(run, itemId, next))
}

/**
 * Fold one formative retrieval into the lesson.
 *
 * Takes and returns a `LessonRun`. It never receives a `Topic`, so — exactly
 * like `recordAnswer` in the Test ladder — it *cannot* touch status, history,
 * retention timestamps, cue evidence or directional coverage.
 */
export function answerLesson(run: LessonRun, itemId: string, response: string): LessonRun {
  const entry = run.entries.find((candidate) => candidate.itemId === itemId)
  if (!entry || run.feedback) return run

  const normalised = response.replace(/\s+/g, '')
  const correct = normalised.length > 0 && normalised === entry.pattern
  // A correction is an unaided check for a fluke: one success after any miss
  // settles the item, while another miss leaves it awaiting that same check.
  const support = correct && entry.recovery ? 'settled' : correct ? fadedSupport(entry.support) : restoredSupport(entry.support)
  const step = run.step + 1

  const next: LessonEntry = {
    ...entry,
    support,
    asked: true,
    recovery: correct ? undefined : true,
    lastAskedAt: run.step,
    // A correct answer needs one item of intervening material before it returns;
    // a miss needs the full weak-item delay so the correction is not an echo.
    notBefore: step + (correct ? 1 : WEAK_ITEM_DELAY_STEPS),
  }
  next.done = isDone(next)

  const feedback: LessonFeedback = {
    glyph: entry.glyph,
    pattern: entry.pattern,
    correct,
    response: normalised,
    supportBefore: entry.support,
    supportAfter: support,
    reteach: !correct,
  }

  return settle({ ...run, step, feedback }, replaceEntry(run, itemId, next))
}

/**
 * Dismiss feedback and expose the next unfinished step.
 */
export function advanceLesson(run: LessonRun): LessonRun {
  const cleared: LessonRun = { ...run, feedback: null }
  return cleared
}

/**
 * Alternatives for a supported check.
 *
 * Deterministic rather than random, so the sequence a learner sees is a
 * property of their own answers and can be asserted. Distractors are drawn from
 * characters the learner has actually met, never from a final-element
 * confusable of the target: during acquisition those are kept apart (Rothkopf
 * 1958), and contrasting them is the Test ladder's job once both are
 * established, not the introduction lesson's.
 */
export function lessonOptions(run: LessonRun, entry: LessonEntry): string[] {
  const target = entry.pattern
  const admissible = (glyph: MorseLetter) =>
    glyph !== entry.glyph && !isConfusable(target, morsePattern(glyph))

  const met = run.entries
    .filter((candidate) => candidate.introduced && admissible(candidate.glyph))
    .sort((a, b) => a.order - b.order)
    .map((candidate) => candidate.pattern)

  const padding = complexityOrderedLetters()
    .filter(admissible)
    .map((glyph) => MORSE_LETTERS[glyph] as string)

  // Same length first. The `cued` check discloses how many signals the answer
  // has, so alternatives of a different length would let the learner solve it
  // off the count rather than off the rhythm.
  const candidates = [...met, ...padding]
  const ranked = [
    ...candidates.filter((pattern) => pattern.length === target.length),
    ...candidates.filter((pattern) => pattern.length !== target.length),
  ]

  const options: string[] = []
  for (const pattern of ranked) {
    if (options.length >= LESSON_CHOICE_OPTIONS - 1) break
    if (pattern !== target && !options.includes(pattern)) options.push(pattern)
  }

  // The answer's position rotates with the step so it is neither fixed nor
  // random: the same lesson replayed answers-for-answers looks identical.
  const at = run.step % LESSON_CHOICE_OPTIONS
  const ordered = [...options]
  ordered.splice(Math.min(at, ordered.length), 0, target)
  return ordered
}

/** Roster characters settled this lesson, for the progress indicator. */
export function lessonProgressCount(run: LessonRun): { done: number; total: number } {
  return {
    done: run.entries.filter(isDone).length,
    total: run.entries.length,
  }
}
