import type { Item } from '../library/topic'

/**
 * Objective grading for a choice item (#146). Correctness is decided here and
 * nowhere else: a selection is right when it is exactly the item's answer, so
 * shuffling the display can never disturb the answer key.
 */
export function isChoiceItem(item: Item): item is Item & { choice: NonNullable<Item['choice']> } {
  return item.choice !== undefined
}

export function isCorrectChoice(item: Item, selection: string): boolean {
  return selection === item.answer
}

/**
 * The options in a random display order. Injectable randomness keeps it
 * deterministic under test; the returned list always holds exactly the authored
 * options.
 */
export function shuffledOptions(item: Item, random: () => number = Math.random): string[] {
  const out = [...(item.choice?.options ?? [])]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
