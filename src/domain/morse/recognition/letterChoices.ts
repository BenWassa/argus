import { MORSE_LETTERS, type MorseLetter } from '../code'

export interface LetterChoiceSet {
  /** In visual and keyboard focus order. The target appears exactly once. */
  choices: MorseLetter[]
  answerIndex: number
  /** A full four-way independent recognition question is needed for speed scoring. */
  speedEligible: boolean
  /** One taught letter cannot form a meaningful recognition question. */
  teachingOnly: boolean
}

function unit(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(0.999999999, value)) : 0
}

function drawIndex(length: number, rng: () => number): number {
  return Math.floor(unit(rng()) * length)
}

function editDistance(left: string, right: string): number {
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let i = 1; i <= left.length; i += 1) {
    const next = [i]
    for (let j = 1; j <= right.length; j += 1) {
      next.push(Math.min(
        next[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1),
      ))
    }
    previous = next
  }
  return previous[right.length]
}

/**
 * A seedable four-choice recognizer, never a formal Test or free-recall item.
 *
 * Only taught letters are eligible. Distractors prefer nearby Morse patterns;
 * ties are randomized, and the correct position is drawn independently of
 * glyph ordering or distance. Never use the option list to label the stimulus.
 */
export function letterChoices(
  target: MorseLetter,
  eligible: readonly MorseLetter[],
  rng: () => number = Math.random,
): LetterChoiceSet | null {
  const roster = [...new Set(eligible)].filter((glyph) =>
    Object.prototype.hasOwnProperty.call(MORSE_LETTERS, glyph),
  )
  if (!roster.includes(target)) return null
  const alternatives = roster.filter((glyph) => glyph !== target)
    .map((glyph) => ({
      glyph,
      distance: editDistance(MORSE_LETTERS[target], MORSE_LETTERS[glyph]),
      tie: unit(rng()),
    }))
    .sort((a, b) => a.distance - b.distance || a.tie - b.tie || a.glyph.localeCompare(b.glyph))
    .slice(0, 3)
    .map(({ glyph }) => glyph)

  // Shuffle the alternatives so that their ordering cannot encode the answer.
  for (let index = alternatives.length - 1; index > 0; index -= 1) {
    const other = drawIndex(index + 1, rng)
    ;[alternatives[index], alternatives[other]] = [alternatives[other], alternatives[index]]
  }
  const answerIndex = drawIndex(alternatives.length + 1, rng)
  const choices = [...alternatives]
  choices.splice(answerIndex, 0, target)
  return {
    choices,
    answerIndex,
    speedEligible: choices.length === 4,
    teachingOnly: choices.length === 1,
  }
}
