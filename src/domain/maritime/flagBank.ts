import type { BankItem } from '../navigation/bearingBanks'
import { SIGNAL_FLAGS, flagAnswer, flagByLetter, type FlagLetter } from './flags'

/**
 * The twelve scored items of Maritime II (#148): a flag is shown, and the
 * learner picks its letter and retained practical meaning. Inputs only — the key
 * is the flag's own entry in `flags.ts`.
 *
 * The distractors are the confusion sets the research note fixes (§3D): D, F and
 * M; U, V and W; B and J; L and M; A and O. Each flag's siblings come first, then
 * the neighbours it is most easily mistaken for, so a wrong option is a real
 * near miss rather than an unrelated meaning.
 */
const CONFUSIONS: Record<FlagLetter, [FlagLetter, FlagLetter, FlagLetter]> = {
  A: ['O', 'D', 'F'],
  B: ['J', 'D', 'U'],
  D: ['F', 'M', 'L'],
  F: ['D', 'M', 'V'],
  J: ['B', 'F', 'D'],
  L: ['M', 'D', 'U'],
  M: ['L', 'D', 'F'],
  O: ['A', 'W', 'V'],
  U: ['V', 'W', 'L'],
  V: ['W', 'U', 'F'],
  W: ['V', 'U', 'O'],
  Y: ['F', 'M', 'D'],
}

export function flagItems(): BankItem[] {
  return SIGNAL_FLAGS.map((flag, index) => {
    const answer = flagAnswer(flag)
    const wrong = CONFUSIONS[flag.letter].map((letter) => flagAnswer(flagByLetter(letter)))
    return {
      prompt: `Flag ${index + 1} of ${SIGNAL_FLAGS.length} — which International Code of Signals flag is this, and what does it mean?`,
      answer,
      choice: { options: [answer, ...wrong].sort() },
      stimulus: {
        source: { kind: 'figure', figure: { kind: 'signal-flag', letter: flag.letter } },
        alt: flag.description,
      },
    }
  })
}

export { CONFUSIONS as FLAG_DISTRACTORS }
