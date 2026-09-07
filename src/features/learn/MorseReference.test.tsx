import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MORSE_LETTERS, type MorseLetter } from '../../lib/morse'
import { canonicalNotation, spokenRhythm } from '../../lib/morseMnemonics'
import { verbalMnemonic } from '../../lib/morseVerbalMnemonics'
import { MorseReference } from './MorseReference'

const letters = Object.keys(MORSE_LETTERS) as MorseLetter[]
const html = renderToStaticMarkup(<MorseReference onExit={() => undefined} />)

function source(file: string): string {
  return readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8')
}

describe('the Morse alphabet is complete and alphabetical', () => {
  it('lists all 26 letters, A to Z, in alphabetical order', () => {
    const shown = [...html.matchAll(/<span class="morse-ref-letter" aria-hidden="true">([A-Z])<\/span>/g)]
      .map((match) => match[1])
    expect(shown).toHaveLength(26)
    expect(shown).toEqual([...letters].sort())
    expect(shown[0]).toBe('A')
    expect(shown[25]).toBe('Z')
  })

  it('gives every letter one card with a large pattern, mnemonic and Play control', () => {
    expect([...html.matchAll(/<li class="morse-ref-card/g)]).toHaveLength(26)

    for (const letter of letters) {
      const pattern = MORSE_LETTERS[letter]
      expect(html).toContain(`aria-label="Play ${letter} Morse"`)
      expect(html).toContain(canonicalNotation(pattern))
      expect(html).toContain(spokenRhythm(pattern))
      expect(html).toContain(verbalMnemonic(letter).phrase)
    }

    expect([...html.matchAll(/aria-label="Play [A-Z] Morse"/g)]).toHaveLength(26)
  })

  it('keeps the reference focused on letter, pattern, phrase and sound rather than duplicating the Learn SVG', () => {
    expect(html).not.toContain('morse-mnemonic')
    expect(html).not.toContain('<svg')
    expect(html).toContain('Letter, pattern, mnemonic, sound')
  })

  it('agrees with the canonical ITU table on every written pattern', () => {
    const alphabetical = [...letters].sort()
    const cards = html.split('<li class="morse-ref-card')
    for (const letter of alphabetical) {
      const card = cards[alphabetical.indexOf(letter) + 1]
      expect(card).toContain(canonicalNotation(MORSE_LETTERS[letter]))
      expect(card).toContain(verbalMnemonic(letter).phrase)
      expect(verbalMnemonic(letter).beats).toHaveLength(MORSE_LETTERS[letter].length)
    }
  })

  it('is never locked, gated or scored', () => {
    expect(html).not.toContain('disabled')
    expect(html).not.toContain('aria-expanded')
    expect(html).not.toContain('lesson-option')
    expect(html).not.toContain('flip-card')
    expect(html).toContain('changes nothing about your progress')
    expect(html).toContain('proved in Test')
  })
})

describe('the reference cannot write progress', () => {
  it('imports no store, scheduler, cue ladder or lesson-writing module', () => {
    const code = source('./MorseReference.tsx')
    const imports = [...code.matchAll(/from '([^']+)'/g)].map((match) => match[1])
    for (const forbidden of ['../../lib/store', '../../lib/scheduling', '../../lib/cueLadder']) {
      expect(imports).not.toContain(forbidden)
    }
    expect(imports.some((path) => path.includes('morseLesson'))).toBe(false)
    expect(code).not.toContain('upsertTopic')
    expect(code).not.toContain('useLibrary')
  })

  it('takes no topic and no mutation callback at all', () => {
    const code = source('./MorseReference.tsx')
    expect(code).toContain('export function MorseReference({ onExit }: { onExit: () => void })')
  })

  it('derives its content from the canonical table rather than from a topic', () => {
    const code = source('./MorseReference.tsx')
    expect(code).toContain('Object.keys(MORSE_LETTERS).sort()')
  })
})

describe('the reference is readable on a phone', () => {
  it('uses the requested two-row card hierarchy', () => {
    const css = source('./MorseReference.css')
    expect(css).toContain('grid-template-rows: auto auto')
    expect(css).toContain('grid-row: 1 / 3')
    expect(css).toContain('.morse-ref-pattern')
    expect(css).toContain('.morse-ref-mnemonic')
    expect(css).toContain('.morse-ref-card > .morse-play')
  })

  it('makes both the letter and canonical notation materially larger than the old compact row', () => {
    const css = source('./MorseReference.css')
    expect(css).toContain('font-size: clamp(3rem, 15vw, 4.6rem)')
    expect(css).toContain('font-size: clamp(2rem, 9vw, 3rem)')
    expect(css).not.toContain('font-size: 1.7rem')
  })

  it('keeps a focusable heading and a reachable close control', () => {
    expect(html).toContain('tabindex="-1"')
    expect(html).toContain('Close')
    expect(html).toContain('aria-live="polite"')
  })

  it('uses relative type sizing and responsive card columns', () => {
    const css = source('./MorseReference.css')
    expect(css).not.toMatch(/font-size:\s*\d+px/)
    expect(css).toContain('@media (min-width: 760px)')
    expect(css).toContain('@media (max-width: 360px)')
    expect(css).toContain('minmax(0, 1fr)')
  })

  it('allows long mnemonic phrases to wrap without shrinking the Morse pattern', () => {
    const css = source('./MorseReference.css')
    expect(css).toContain('overflow-wrap: anywhere')
    expect(css).toContain('white-space: nowrap')
    expect(css).toContain('min-width: 0')
  })
})
