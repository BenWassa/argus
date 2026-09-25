import {
  isAssistedRung,
  recordAnswer,
  rungFor,
  rungIndexFor,
  withBaselineCue,
} from '../../domain/study/cueLadder'
import type { Item } from '../../domain/library/topic'
import type { CueState, ItemCueEvidence } from '../../domain/study/evidence'

/**
 * What the cue ladder is about to do, said out loud.
 *
 * The ladder is the smartest thing in the product and the least visible. It
 * withdraws scaffolding after two clean answers, puts it back after a miss,
 * and opens the reverse direction the moment forward recall stands on its own
 * — and the learner is told none of it. They answer, the next card is quietly
 * harder or quietly easier, and nothing connects the two. The system is
 * responding to them precisely and invisibly, which reads as arbitrary rather
 * than as intelligent.
 *
 * So this reports the change, once, in the instrument's own register: what
 * moved and what caused it. It is a readout, not praise — there is no "well
 * done" here, and a withdrawal and a restoration are worded with the same
 * weight, because one is not a reward and the other is not a punishment.
 *
 * ## Why it predicts rather than observes
 *
 * The real rung change happens when `TestSession` folds the answer into
 * evidence, which is after this card's feedback window has already closed. So
 * the note is computed ahead of the answer, for both outcomes, by running the
 * genuine ladder functions over the genuine evidence. Nothing here restates a
 * ladder rule: `recordAnswer` and `rungIndexFor` decide, exactly as they will
 * when the answer is really recorded, and this reads the difference.
 */

/**
 * A timestamp for the hypothetical answer.
 *
 * The evidence built here is thrown away — only the resulting rung is read,
 * and `rungIndexFor` depends on cue state and direction counts, never on when
 * anything happened. A fixed value keeps the prediction pure, which is what
 * lets it be tested without a clock.
 */
const PREDICTED_AT = '1970-01-01T00:00:00.000Z'

export interface CueNote {
  onCorrect: string | null
  onIncorrect: string | null
}

function noteFor(
  item: Item,
  evidence: ItemCueEvidence | undefined,
  correct: boolean,
  baseline: CueState,
): string | null {
  const before = rungFor(item, evidence)
  const beforeIndex = rungIndexFor(item, evidence)

  // The same floor `TestSession` applies, so a finished curriculum is never
  // told a cue is coming back when it is not.
  const after = withBaselineCue(
    recordAnswer(evidence, {
      direction: before.direction,
      correct,
      assisted: isAssistedRung(before),
      latencyMs: null,
      at: PREDICTED_AT,
    }),
    baseline,
  )

  const afterIndex = rungIndexFor(item, after)
  if (afterIndex === beforeIndex) return null

  const eased = afterIndex > beforeIndex
  const afterRung = rungFor(item, after)

  // The reverse direction opening is its own event, and the most interesting
  // one: it is the ladder saying forward recall now stands unaided.
  if (eased && afterRung.direction !== before.direction) {
    return 'Forward recall holds on its own, so the reverse direction opens next.'
  }

  // Moving between the two uncued rungs is a change of direction, not of
  // support. Calling it a returning cue would announce help that never shows.
  if (!isAssistedRung(before) && !isAssistedRung(afterRung)) return null

  return eased
    ? 'Two clean in a row, so the cue comes off the next ask.'
    : 'The cue comes back on the next ask.'
}

export function cueNoteFor(
  item: Item,
  evidence: ItemCueEvidence | undefined,
  baseline: CueState = 'rich',
): CueNote {
  return {
    onCorrect: noteFor(item, evidence, true, baseline),
    onIncorrect: noteFor(item, evidence, false, baseline),
  }
}
