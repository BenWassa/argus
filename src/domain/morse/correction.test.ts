import { expect, it } from 'vitest'
import { correctionLetter } from './correction'

it.each([
  ['E', 'E', null], ['E', '', 'E'], ['E', 'TE', 'E'],
  ['CAT', 'COT', 'A'], ['CAT', 'CA', null], ['CAT', 'CATS', null],
  ['ABC', 'BCA', null], ['CAT.', 'CAT?', null],
])('selects only unambiguous character support for %s / %s', (expected, given, glyph) => {
  expect(correctionLetter(expected, given)).toBe(glyph)
})
