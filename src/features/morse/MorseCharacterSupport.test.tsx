import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import { MORSE_LETTERS } from '../../domain/morse/code'
import { MorseCharacterSupport } from './MorseCharacterSupport'

/** The drawn marks for a pattern, as MorseMarks renders them (#263). */
function drawn(pattern: string): string {
  return Array.from(pattern).map((mark) => mark === '.' ? '<span class="morse-mark is-dit">·</span>' : '<span class="morse-mark is-dah">—</span>').join('')
}

describe('MorseCharacterSupport', () => {
  it('presents a character with canonical notation, rhythmic phrase, and sound control', () => {
    const html = renderToStaticMarkup(<MorseCharacterSupport glyph="A" />)
    expect(html).toContain('morse-character-support-glyph')
    expect(html).toContain(drawn(MORSE_LETTERS.A))
    expect(html).toContain('A LONG')
    expect(html).toContain('Play A Morse')
    expect(html).toContain('A: dit dah')
  })

  it('uses a supplied audio owner and supports rule captions for figures', () => {
    const onToggle = vi.fn()
    const html = renderToStaticMarkup(
      <MorseCharacterSupport glyph="5" pattern="....." mnemonic="five dits" playing onToggle={onToggle} />,
    )
    expect(html).toContain('five dits')
    expect(html).toContain('Stop 5 Morse')
    expect(html).toContain('aria-pressed="true"')
  })
})
