import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MORSE_LETTERS, type MorseLetter } from '../../lib/morse'
import { canonicalNotation, mnemonicTextEquivalent, spokenRhythm } from '../../lib/morseMnemonics'
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
    // Alphabetical, not acquisition order: this is a lookup surface.
    expect(shown[0]).toBe('A')
    expect(shown[25]).toBe('Z')
  })

  it('gives every letter its phrase, canonical notation, drawing and one Play control', () => {
    const rows = html.split('<li class="morse-ref-row')
    expect(rows).toHaveLength(27)

    for (const letter of letters) {
      const pattern = MORSE_LETTERS[letter]
      expect(html).toContain(`aria-label="Play ${letter} Morse"`)
      expect(html).toContain(canonicalNotation(pattern))
      expect(html).toContain(spokenRhythm(pattern))
      expect(html).toContain(mnemonicTextEquivalent(letter, pattern))
    }

    // One mnemonic drawing per row, and one Play control per row.
    expect([...html.matchAll(/class="morse-mnemonic"/g)]).toHaveLength(26)
    expect([...html.matchAll(/aria-label="Play [A-Z] Morse"/g)]).toHaveLength(26)
  })

  it('agrees with the canonical ITU table on every channel, for every letter', () => {
    const alphabetical = [...letters].sort()
    const rows = html.split('<li class="morse-ref-row')
    for (const letter of alphabetical) {
      const pattern = MORSE_LETTERS[letter]
      const row = rows[alphabetical.indexOf(letter) + 1]

      // Phrase beats, drawing elements and written notation are three views of
      // the same canonical sequence, so none of them can drift on its own.
      const marks = [...row.matchAll(/<span class="morse-phrase-mark">([^<]*)<\/span>/g)].map((m) => m[1])
      expect(marks.join(' ')).toBe(canonicalNotation(pattern))

      const shapes = [...row.matchAll(/<(circle|rect) class="morse-mnemonic-element/g)].map((m) => m[1])
      expect(shapes).toEqual(Array.from(pattern).map((mark) => (mark === '.' ? 'circle' : 'rect')))

      expect(verbalMnemonic(letter).beats).toHaveLength(pattern.length)
    }
  })

  it('is never locked, gated or scored', () => {
    expect(html).not.toContain('disabled')
    expect(html).not.toContain('aria-expanded')
    expect(html).not.toContain('lesson-option')
    expect(html).not.toContain('flip-card')
    expect(html).toContain('changes nothing about your progress')
    expect(html).toContain('proved in Test, never here')
  })
})

describe('the reference cannot write progress', () => {
  it('imports no store, scheduler, cue ladder or lesson-writing module', () => {
    const code = source('./MorseReference.tsx')
    const imports = [...code.matchAll(/from '([^']+)'/g)].map((match) => match[1])

    // Structural, not promised: the module has no access to anything that
    // could record retention, cue or completion evidence, however long a
    // learner browses or however many times they press Play.
    for (const forbidden of ['../../lib/store', '../../lib/scheduling', '../../lib/cueLadder']) {
      expect(imports).not.toContain(forbidden)
    }
    expect(imports.some((path) => path.includes('morseLesson'))).toBe(false)
    expect(code).not.toContain('upsertTopic')
    expect(code).not.toContain('useLibrary')
  })

  it('takes no topic and no mutation callback at all', () => {
    // The only prop is how to leave. There is no library, no topic and no
    // writer for a future edit to reach for by accident.
    const code = source('./MorseReference.tsx')
    expect(code).toContain('export function MorseReference({ onExit }: { onExit: () => void })')
  })

  it('derives its content from the canonical table rather than from a topic', () => {
    const code = source('./MorseReference.tsx')
    expect(code).toContain("Object.keys(MORSE_LETTERS).sort()")
  })
})

describe('the reference is readable on a phone', () => {
  it('explains the mnemonic grammar and its deliberate repetition once', () => {
    expect([...html.matchAll(/One word is one Morse signal/g)]).toHaveLength(1)
    expect(html).toContain('repeated word is a deliberately repeated beat')
  })

  it('carries the timing on explicit marks rather than on casing', () => {
    const words = [...html.matchAll(/<span class="morse-phrase-word">([^<]*)<\/span>/g)].map((m) => m[1])
    const marks = [...html.matchAll(/<span class="morse-phrase-mark">([^<]*)<\/span>/g)].map((m) => m[1])

    const totalBeats = letters.reduce((sum, letter) => sum + MORSE_LETTERS[letter].length, 0)
    expect(words).toHaveLength(totalBeats)
    expect(marks).toHaveLength(totalBeats)
    for (const word of words) expect(word).toBe(word.toUpperCase())
    for (const mark of marks) expect(['·', '—']).toContain(mark)
  })

  it('keeps a focusable heading and a reachable close control', () => {
    expect(html).toContain('tabindex="-1"')
    expect(html).toContain('Close')
    expect(html).toContain('aria-live="polite"')
  })

  it('sizes rows and marks in relative units so 200% text still fits', () => {
    const css = source('./MorseReference.css')
    // No fixed pixel type sizes on the row: everything scales with the reader's
    // text size, and the wide/narrow behaviour is a media query rather than a
    // horizontal scroll.
    expect(css).not.toMatch(/font-size:\s*\d+px/)
    expect(css).toContain('@media (max-width: 460px)')
    expect(source('./MorseCharacterPacket.css')).not.toMatch(/\.morse-phrase-mark[^}]*font-size:\s*\d+px/)
  })

  it('never lets a row scroll the page sideways', () => {
    const css = source('./MorseReference.css')
    expect(css).toContain('min-width: 0')
    expect(css).toContain('flex-wrap: wrap')
  })
})
