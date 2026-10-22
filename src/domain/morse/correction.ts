import type { MorseLetter } from './code'

/** Reveal a target letter only when the response identifies an unambiguous miss. */
export function correctionLetter(expected: string, given: string): MorseLetter | null {
  if (expected === given) return null
  if (/^[A-Z]$/.test(expected)) return expected as MorseLetter
  if (expected.length !== given.length) return null
  const differences = Array.from(expected).filter((letter, at) => letter !== given[at])
  return differences.length === 1 && /^[A-Z]$/.test(differences[0])
    ? differences[0] as MorseLetter : null
}
