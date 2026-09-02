import { describe, expect, it } from 'vitest'
import { testCardTextClass, testCardTextScale } from './textScale'

describe('Test card text scaling', () => {
  it('keeps short tokens at display scale', () => {
    expect(testCardTextScale('Kilo')).toBe('short')
    expect(testCardTextClass('Kilo')).toBe('')
    expect(testCardTextScale('1234567890123456')).toBe('short')
  })

  it('steps phrases and medium prompts down from display scale', () => {
    expect(testCardTextScale('What does the O in OODA stand for?')).toBe('medium')
    expect(testCardTextClass('What does the O in OODA stand for?')).toBe(' is-medium')
    expect(testCardTextScale('12345678901234567')).toBe('medium')
    expect(testCardTextScale('12345678901234567890123456789012345678901234567890123456')).toBe('medium')
  })

  it('uses reading scale for sentence and paragraph content', () => {
    expect(
      testCardTextScale(
        'Scan for immediate danger, then check responsiveness and breathing before moving on.',
      ),
    ).toBe('long')
    expect(testCardTextScale('123456789012345678901234567890123456789012345678901234567')).toBe('long')
  })

  it('ignores surrounding whitespace when classifying content', () => {
    expect(testCardTextScale('   Kilo   ')).toBe('short')
  })
})
