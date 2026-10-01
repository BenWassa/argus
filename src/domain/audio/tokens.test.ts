import { describe, expect, it } from 'vitest'
import { decodeSpokenTokens, NATO_CODE_WORDS, NUMBER_FORMS } from './tokens'
import { seedLibrary } from '../library/catalogSeed'

describe('decoding spoken tokens', () => {
  it('turns code words and number forms into the characters they spell', () => {
    expect(decodeSpokenTokens('Alfa WUN TOO')).toEqual({ ok: true, text: 'A12' })
    expect(decodeSpokenTokens('Whiskey ZE-RO NIN-er X-ray')).toEqual({ ok: true, text: 'W09X' })
    expect(decodeSpokenTokens('FOW-er DAY-SEE-MAL FIFE')).toEqual({ ok: true, text: '4.5' })
  })

  it('reports a word it cannot decode rather than guessing', () => {
    expect(decodeSpokenTokens('Alfa Banana')).toEqual({ ok: false, unknown: ['BANANA'] })
    expect(decodeSpokenTokens('WUN HUN-dred')).toEqual({ ok: false, unknown: ['HUNDRED'] })
    expect(decodeSpokenTokens('TOU-SAND')).toMatchObject({ ok: false })
  })
})

describe('the tables match what Argus teaches', () => {
  const topic = (id: string) => seedLibrary().topics.find((t) => t.id === id)!

  it('has every NATO code word the catalog ships, mapped to its letter', () => {
    for (const item of topic('nato-phonetic').items) {
      const word = item.answer.toUpperCase().replace(/-/g, '')
      expect(NATO_CODE_WORDS[word], `${item.answer}`).toBe(item.prompt)
    }
  })

  it('has every single-character radiotelephony number form the catalog ships', () => {
    for (const item of topic('radiotelephony-numbers').items) {
      const form = item.answer.toUpperCase().replace(/-/g, '')
      if (item.prompt === 'Hundred' || item.prompt === 'Thousand') continue // not one character
      const expected = item.prompt === 'Decimal' ? '.' : item.prompt
      expect(NUMBER_FORMS[form], `${item.answer}`).toBe(expected)
    }
  })
})
