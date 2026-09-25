import { describe, expect, it } from 'vitest'
import { addPattern, addSpace, playableText, removeLast, tokensText, type FreeToken } from './freePlay'

function key(...patterns: (string | ' ')[]): FreeToken[] {
  return patterns.reduce<FreeToken[]>(
    (tokens, pattern) => (pattern === ' ' ? addSpace(tokens) : addPattern(tokens, pattern)),
    [],
  )
}

describe('free keying', () => {
  it('spells what was keyed, with word gaps', () => {
    expect(tokensText(key('....', '..', ' ', '-', '....', '.', '.-.', '.'))).toBe('HI THERE')
  })

  it('keeps a pattern that spells nothing, but leaves it out of the text', () => {
    const tokens = key('....', '........', '..')
    expect(tokens[1]).toEqual({ kind: 'character', pattern: '........', character: null })
    expect(tokensText(tokens)).toBe('HI')
  })

  it('decodes figures and punctuation too', () => {
    expect(tokensText(key('..---', '-----', '..--..'))).toBe('20?')
  })

  it('never leads with or doubles a word gap', () => {
    expect(key(' ')).toEqual([])
    expect(key('.', ' ', ' ')).toHaveLength(2)
  })

  it('deletes the last thing keyed, gap or character', () => {
    expect(tokensText(removeLast(key('.', ' ', '-')))).toBe('E')
    expect(removeLast([])).toEqual([])
  })
})

describe('typed text for listening', () => {
  it('plays what it can and names what it cannot', () => {
    expect(playableText('Hello, world! 73 & bye')).toEqual({
      playable: 'HELLO, WORLD 73 BYE',
      unsupported: ['!', '&'],
    })
  })

  it('collapses whitespace', () => {
    expect(playableText('  a   b \n c ').playable).toBe('A B C')
  })
})
