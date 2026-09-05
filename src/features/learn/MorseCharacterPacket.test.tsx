import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MORSE_LETTERS, morsePattern, type MorseLetter } from '../../lib/morse'
import { morseAcquisitionProfile } from '../../lib/acquisition'
import { mnemonicId, mnemonicTextEquivalent } from '../../lib/morseMnemonics'
import { buildCharacterPackets } from '../../lib/morseOrder'
import { parseLibrary } from '../../lib/storage'
import { seedLibrary } from '../../lib/seed'
import type { LearnContent, MorseCharacterLearnItem } from '../../lib/types'
import { LearnSupport } from './LearnSupport'
import { MorseCharacterPacket } from './MorseCharacterPacket'
import { MorseMnemonic } from './MorseMnemonic'

const letters = Object.keys(MORSE_LETTERS) as MorseLetter[]

/**
 * A `morse-character-packet` character, built the way authored or imported
 * Learn content would supply one. #48 took the shipped A–Z off this block, but
 * the block type stays part of the durable content model, so its rendering is
 * still exercised here against content that carries it.
 */
function morseCharacter(glyph: string): MorseCharacterLearnItem {
  const pattern = morsePattern(glyph)
  return {
    glyph,
    pattern,
    mnemonicId: mnemonicId(glyph),
    audioText: glyph,
    textLabel: mnemonicTextEquivalent(glyph, pattern),
  }
}

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
      expect(html).toContain(`Play ${character.glyph} Morse`)
      expect(html).toContain(character.textLabel)
    }
    expect([...html.matchAll(/class="morse-card[ "]/g)]).toHaveLength(characters.length)
    // One mnemonic SVG per card. Cards also carry a second, smaller SVG for
    // the play/stop icon glyph, so this asserts on the mnemonic specifically
    // rather than on every <svg> in the packet.
    expect([...html.matchAll(/class="morse-mnemonic"/g)]).toHaveLength(characters.length)
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

  it('survives the storage validator, so authored packet content stays importable', () => {
    const library = {
      version: 5,
      topics: [
        {
          id: 'authored-morse-note',
          title: 'A packet someone authored',
          scope: 'One letter, as authored Learn support.',
          track: 'learning',
          items: [{ id: 'x-1', kind: 'forward', prompt: 'E', answer: '.' }],
          learn: {
            kind: 'concise',
            sections: [
              {
                heading: 'Packet',
                blocks: [{ type: 'morse-character-packet', characters: [morseCharacter('E')] }],
              },
            ],
          },
          status: 'unstarted',
          createdAt: '2026-01-01T00:00:00.000Z',
          drilledAt: null,
          learningAt: null,
          completedAt: null,
          lastTestedAt: null,
          spotCheckedAt: null,
          history: [],
        },
      ],
    }
    const parsed = parseLibrary(library)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.library.topics[0].learn?.sections?.[0].blocks[0].type).toBe('morse-character-packet')
  })
})

describe('seeded Morse topic', () => {
  const topic = seedLibrary().topics.find((candidate) => candidate.id === 'international-morse-letters-printed')!

  it('keeps the scored boundary and hands packet presentation to the lesson', () => {
    // The completion claim, the 26 logical scoring units and their typed
    // bidirectional semantics are exactly what they were before #48.
    expect(topic.items).toHaveLength(26)
    expect(topic.items.every((item) => item.kind === 'bidirectional')).toBe(true)
    expect(new Set(topic.items.map((item) => item.prompt)).size).toBe(26)
    expect(topic.scope).toBe('Can independently recall all A–Z printed Morse mappings in both directions.')

    // #48: the 13 packet sections were curriculum to scroll, and the guided
    // lesson replaced them. Packet composition is now derived at run time from
    // the same `buildCharacterPackets` rule, so the durable topic no longer
    // carries a second copy of it that could drift.
    const packetSections = topic.learn?.sections?.filter((section) =>
      section.blocks.some((block) => block.type === 'morse-character-packet'),
    )
    expect(packetSections).toHaveLength(0)
    expect(JSON.stringify(topic.learn)).toContain('guided lesson')
  })

  it('keeps the Test ladder mnemonic cue working without authored packet metadata', () => {
    const parsed = parseLibrary(seedLibrary())
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    const seeded = parsed.library.topics.find((t) => t.id === 'international-morse-letters-printed')!
    const profile = morseAcquisitionProfile(seeded)
    expect(profile).not.toBeNull()
    for (const character of profile!.values()) {
      // Derived from the canonical letter rather than from Learn content, so
      // removing the packets cannot silently remove the Test SVG cue.
      expect(character.mnemonicId).toBe(mnemonicId(character.glyph))
      expect(character.textLabel).toBe(mnemonicTextEquivalent(character.glyph, character.pattern))
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
