import { owedLetters } from '../curriculum/lesson'
import { practiceTargets } from '../../study/practiceTargets'
import type { MorseLetter } from '../code'
import { MORSE_ALPHABET } from './corpus'
import type { Topic } from '../../library/topic'

/**
 * The letters this learner is currently missing, from either place they show:
 * a lesson miss not yet repaired or a letter the course has not yet confirmed
 * (`owedLetters`), and a Test direction whose last answer was wrong
 * (`practiceTargets`). In alphabet order, without repeats.
 *
 * Fluency uses the set to weight what it asks (`fluencyNeed`), and the keyed
 * practise-missed run asks only these. Both are formative: reading this set
 * writes nothing, and practising it moves no rung.
 */
export function morseFocusLetters(topic: Topic): MorseLetter[] {
  const letters = new Set<string>(owedLetters(topic))
  for (const target of practiceTargets(topic)) {
    if (target.reason === 'missed') letters.add(target.item.prompt.trim().toUpperCase())
  }
  return MORSE_ALPHABET.filter((letter) => letters.has(letter))
}
