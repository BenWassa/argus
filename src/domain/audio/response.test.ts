import { describe, expect, it } from 'vitest'
import {
  gradeFields,
  isCopyCorrect,
  isObjectiveItem,
  normalizeCompact,
  normalizeWords,
  responseAnswerText,
} from './response'

describe('normalization ignores only case, spacing and punctuation', () => {
  it('words: upper-cases, strips punctuation and collapses spacing', () => {
    expect(normalizeWords('  Charlie,  ZE-RO  tree! ')).toEqual(['CHARLIE', 'ZE', 'RO', 'TREE'])
    expect(normalizeWords('MAYDAY. MAYDAY; MAYDAY')).toEqual(['MAYDAY', 'MAYDAY', 'MAYDAY'])
  })

  it('compact: removes every space and punctuation mark', () => {
    expect(normalizeCompact('A 1 2')).toBe('A12')
    expect(normalizeCompact('a-1, 2.')).toBe('A12')
    expect(normalizeCompact('X-ray')).toBe('XRAY')
  })
})

describe('copy grading never forgives a wrong letter, digit, word or order', () => {
  it('compact accepts spacing and case differences and nothing else', () => {
    expect(isCopyCorrect('A12', 'a 1 2', 'compact')).toBe(true)
    expect(isCopyCorrect('A12', 'A-1-2', 'compact')).toBe(true)
    expect(isCopyCorrect('A12', 'A13', 'compact')).toBe(false) // a wrong digit
    expect(isCopyCorrect('A12', 'B12', 'compact')).toBe(false) // a wrong letter
    expect(isCopyCorrect('A12', '21A', 'compact')).toBe(false) // wrong order
    expect(isCopyCorrect('A12', 'A1', 'compact')).toBe(false) // omission
    expect(isCopyCorrect('A12', 'A122', 'compact')).toBe(false) // duplication
    expect(isCopyCorrect('A12', '', 'compact')).toBe(false)
  })

  it('words compares whole words in order', () => {
    const call = 'Halifax Coast Guard Radio this is Sea Breeze'
    expect(isCopyCorrect(call, 'HALIFAX COAST GUARD RADIO, THIS IS SEA BREEZE.', 'words')).toBe(true)
    expect(isCopyCorrect(call, 'Halifax Coast Guard Radio this is Sea Breezy', 'words')).toBe(false)
    expect(isCopyCorrect(call, 'Coast Guard Halifax Radio this is Sea Breeze', 'words')).toBe(false)
    expect(isCopyCorrect(call, 'Halifax Coast Guard this is Sea Breeze', 'words')).toBe(false)
  })

  it('words does not treat a split word as the same word', () => {
    // Spacing is only forgiven where it cannot change which words were said.
    expect(isCopyCorrect('SEA BREEZE', 'SEABREEZE', 'words')).toBe(false)
    expect(isCopyCorrect('SEABREEZE', 'SEA BREEZE', 'words')).toBe(false)
  })
})

describe('fields grading', () => {
  const fields = [
    { label: 'Position', expected: 'North of Cape Sable' },
    { label: 'Nature of distress', expected: 'Taking on water' },
    { label: 'Assistance needed', expected: 'Pumps and a tow' },
  ]

  it('is correct only when every field is', () => {
    expect(gradeFields(fields, ['north of cape sable', 'TAKING ON WATER.', 'pumps and a tow']).correct).toBe(true)
    const miss = gradeFields(fields, ['north of cape sable', 'taking on water', 'a tow'])
    expect(miss.correct).toBe(false)
    expect(miss.fields.map((f) => f.correct)).toEqual([true, true, false])
  })

  it('treats a missing or blank field as wrong, and never shifts answers between fields', () => {
    expect(gradeFields(fields, ['north of cape sable']).correct).toBe(false)
    expect(gradeFields(fields, ['taking on water', 'north of cape sable', 'pumps and a tow']).correct).toBe(false)
    expect(gradeFields(fields, ['', '', '']).fields.every((f) => !f.correct)).toBe(true)
  })

  it('shows the expected values labelled, in order, as the answer', () => {
    expect(responseAnswerText({ mode: 'fields', fields }, 'ignored')).toBe(
      'Position: North of Cape Sable · Nature of distress: Taking on water · Assistance needed: Pumps and a tow',
    )
    expect(responseAnswerText({ mode: 'copy', normalizer: 'compact' }, 'A12')).toBe('A12')
  })
})

describe('objective items', () => {
  it('are those with a choice or an audio response, and nothing else', () => {
    expect(isObjectiveItem({ prompt: 'p', answer: 'a' })).toBe(false)
    expect(isObjectiveItem({ prompt: 'p', answer: 'a', choice: { options: ['a', 'b'] } })).toBe(true)
    expect(
      isObjectiveItem({ prompt: 'p', answer: 'a', response: { mode: 'copy', normalizer: 'words' } }),
    ).toBe(true)
  })
})
