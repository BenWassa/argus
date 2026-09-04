import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MORSE_LETTERS, morsePattern, type MorseLetter } from '../../lib/morse'
import { mnemonicTextEquivalent } from '../../lib/morseMnemonics'
import { buildCharacterPackets } from '../../lib/morseOrder'
import { morseCharacter, morsePacketSections } from '../../lib/morsePacketContent'
import { parseLibrary } from '../../lib/storage'
import { seedLibrary } from '../../lib/seed'
import type { LearnContent } from '../../lib/types'
import { LearnSupport } from './LearnSupport'
import { MorseCharacterPacket } from './MorseCharacterPacket'
import { MorseMnemonic } from './MorseMnemonic'

const letters = Object.keys(MORSE_LETTERS) as MorseLetter[]

describe('Morse mnemonic rendering', () => {
  it('draws a dit as a circle and a dah as a bar, in transmission order', () => {
    const html = renderToStaticMarkup(
      <MorseMnemonic glyph="R" pattern=".-." textLabel={mnemonicTextEquivalent('R', '.-.')} />,
    )
    // .-. is circle, bar, circle — and the x coordinates ascend with the order.
    const shapes = [...html.matchAll(/<(circle|rect)[^>]*?(?:cx|x)="([\d.]+)"/g)].map((match) => ({
      shape: match[1],
      x: Number(match[2]),
    }))
    expect(shapes.map((entry) => entry.shape)).toEqual(['circle', 'rect', 'circle'])
    expect(shapes[0].x).toBeLessThan(shapes[1].x)
    expect(shapes[1].x).toBeLessThan(shapes[2].x)
  })

  it('carries a semantic equivalent for the drawing', () => {
    const html = renderToStaticMarkup(
      <MorseMnemonic glyph="R" pattern=".-." textLabel={mnemonicTextEquivalent('R', '.-.')} />,
    )
    expect(html).toContain('role="img"')
    expect(html).toContain('aria-labelledby=')
    expect(html).toContain('<title')
    expect(html).toContain('R is dit dah dit')
    expect(html).toContain('<desc')
    expect(html).toContain('Canonical notation · — ·')
  })

  it('illuminates only the element that is sounding, without moving anything', () => {
    const quiet = renderToStaticMarkup(
      <MorseMnemonic glyph="S" pattern="..." textLabel={mnemonicTextEquivalent('S', '...')} />,
    )
    const sounding = renderToStaticMarkup(
      <MorseMnemonic
        glyph="S"
        pattern="..."
        textLabel={mnemonicTextEquivalent('S', '...')}
        activeIndex={1}
      />,
    )
    expect(quiet).not.toContain('is-sounding')
    expect([...sounding.matchAll(/is-sounding/g)]).toHaveLength(1)
    // Same geometry in both states: illumination never re-positions an element,
    // so suppressing motion cannot remove sequence information.
    expect(sounding.replace(/ is-sounding/g, '')).toBe(quiet)
  })

  it('renders every letter of the alphabet through the one grammar', () => {
    for (const letter of letters) {
      const pattern = morsePattern(letter)
      const html = renderToStaticMarkup(
        <MorseMnemonic glyph={letter} pattern={pattern} textLabel={mnemonicTextEquivalent(letter, pattern)} />,
      )
      const shapes = [...html.matchAll(/<(circle|rect)\s/g)].map((match) => match[1])
      expect(shapes).toEqual(Array.from(pattern).map((mark) => (mark === '.' ? 'circle' : 'rect')))
    }
  })
})

describe('Morse character packet', () => {
  const packet = buildCharacterPackets()[4]
  const characters = packet.characters.map(morseCharacter)
  const html = renderToStaticMarkup(<MorseCharacterPacket characters={characters} />)

  it('shows the glyph, the canonical notation, the mnemonic and audio for each card', () => {
    for (const character of characters) {
      expect(html).toContain(`Play ${character.glyph}`)
      expect(html).toContain(character.textLabel)
    }
    expect([...html.matchAll(/class="morse-card[ "]/g)]).toHaveLength(characters.length)
    expect([...html.matchAll(/<svg/g)]).toHaveLength(characters.length)
    expect(html).toContain('morse-notation')
  })

  it('gives a non-visual reader the whole pattern without the drawing', () => {
    const stripped = html.replace(/<svg[\s\S]*?<\/svg>/g, '')
    for (const character of characters) {
      // The spoken rhythm is visible text, not only an SVG label, so the
      // mnemonic is never the only path to the mapping.
      expect(stripped).toContain(`class="morse-rhythm"`)
      expect(stripped).toContain(character.glyph)
    }
  })

  it('stays a reading surface: nothing is scored, hidden or locked', () => {
    expect(html).not.toContain('flip-card')
    expect(html).not.toContain('Got it')
    expect(html).not.toContain('aria-expanded')
    expect(html).not.toContain('disabled')
    expect(/\shidden[=>\s]/.test(html)).toBe(false)
  })
})

describe('packet content in Learn', () => {
  it('replaces the placeholder list with the acquisition surface', () => {
    const content: LearnContent = {
      kind: 'concise',
      sections: [
        {
          heading: 'Packet 1',
          blocks: [{ type: 'morse-character-packet', characters: [morseCharacter('E'), morseCharacter('I')] }],
        },
      ],
    }
    const html = renderToStaticMarkup(<LearnSupport content={content} />)
    expect(html).toContain('morse-packet')
    expect(html).toContain('E is dit')
    expect(html).toContain('I is dit dit')
    expect(html).toContain('Play E')
  })

  it('names the novel and returning characters in every packet heading', () => {
    const sections = morsePacketSections()
    expect(sections).toHaveLength(13)
    expect(sections[0].heading).toBe('Packet 1 of 13 — new: E, I')
    expect(sections[4].heading).toContain('returning:')
    for (const section of sections) {
      expect(section.blocks).toHaveLength(1)
      expect(section.blocks[0].type).toBe('morse-character-packet')
    }
  })

  it('covers all 26 characters across the seeded packets, once each as novel', () => {
    const introduced = morsePacketSections().flatMap((section) => {
      const block = section.blocks[0]
      return block.type === 'morse-character-packet' ? block.characters.map((character) => character.glyph) : []
    })
    expect(new Set(introduced).size).toBe(26)
  })
})

describe('seeded Morse topic', () => {
  const topic = seedLibrary().topics.find((candidate) => candidate.id === 'international-morse-letters-printed')!

  it('adds Learn packets without touching the scored boundary', () => {
    expect(topic.items).toHaveLength(26)
    expect(topic.scope).toBe('Can independently recall all A–Z printed Morse mappings in both directions.')
    const packetSections = topic.learn?.sections?.filter((section) =>
      section.blocks.some((block) => block.type === 'morse-character-packet'),
    )
    expect(packetSections).toHaveLength(13)
  })

  it('draws every packet character from the ITU mapping the deck scores', () => {
    const deck = new Map(topic.items.map((item) => [item.prompt, item.answer]))
    for (const section of topic.learn?.sections ?? []) {
      for (const block of section.blocks) {
        if (block.type !== 'morse-character-packet') continue
        for (const character of block.characters) {
          expect(deck.get(character.glyph)).toBe(character.pattern)
        }
      }
    }
  })

  it('survives the storage validator and the export/import round trip', () => {
    const parsed = parseLibrary(seedLibrary())
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const round = parseLibrary(JSON.parse(JSON.stringify(parsed.library)))
    expect(round.ok).toBe(true)
    if (!round.ok) return
    expect(round.library).toEqual(parsed.library)
  })
})
