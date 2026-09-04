import { morsePattern } from './morse'
import { mnemonicId, mnemonicTextEquivalent } from './morseMnemonics'
import { buildCharacterPackets, type PacketPlanConfig } from './morseOrder'
import type { LearnSection, MorseCharacterLearnItem } from './types'

/**
 * Turn the packet plan into Learn content.
 *
 * These are Learn blocks, not Test items: adding them changes what a learner
 * can read, never what the topic scores. The scored boundary stays exactly the
 * `items` deck it was before.
 */
export function morseCharacter(glyph: string): MorseCharacterLearnItem {
  const pattern = morsePattern(glyph)
  return {
    glyph,
    pattern,
    mnemonicId: mnemonicId(glyph),
    audioText: glyph,
    textLabel: mnemonicTextEquivalent(glyph, pattern),
  }
}

export function morsePacketSections(config: PacketPlanConfig = {}): LearnSection[] {
  const packets = buildCharacterPackets(config)
  return packets.map((packet) => {
    const returning = packet.review.length > 0 ? ` · returning: ${packet.review.join(', ')}` : ''
    return {
      heading: `Packet ${packet.index + 1} of ${packets.length} — new: ${packet.novel.join(', ')}${returning}`,
      blocks: [
        {
          type: 'morse-character-packet',
          characters: packet.characters.map(morseCharacter),
        },
      ],
    }
  })
}
