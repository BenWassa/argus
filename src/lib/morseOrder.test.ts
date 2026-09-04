import { describe, expect, it } from 'vitest'
import { morsePattern, type MorseLetter } from './morse'
import {
  ACQUISITION_ORDER,
  ALL_MORSE_LETTERS,
  buildAcquisitionOrder,
  buildCharacterPackets,
  complexityOrderedLetters,
  confusableWith,
  DEFAULT_PACKET_PLAN,
  differsOnlyInFinalElement,
  patternRank,
} from './morseOrder'
import { patternExtentUnits } from './morseMnemonics'

function pairs<T>(list: readonly T[]): [T, T][] {
  const out: [T, T][] = []
  for (let i = 0; i < list.length; i += 1) {
    for (let j = i + 1; j < list.length; j += 1) out.push([list[i], list[j]])
  }
  return out
}

describe('final-element confusability', () => {
  it('is exactly the same-length, same-prefix relation', () => {
    expect(differsOnlyInFinalElement('...', '..-')).toBe(true)
    expect(differsOnlyInFinalElement('.', '-')).toBe(true)
    expect(differsOnlyInFinalElement('-.-', '-..')).toBe(true)
    // A pattern that merely extends another is a different family.
    expect(differsOnlyInFinalElement('.-', '.--')).toBe(false)
    expect(differsOnlyInFinalElement('.-.', '-..')).toBe(false)
    expect(differsOnlyInFinalElement('...', '...')).toBe(false)
  })

  it('is symmetric across the alphabet', () => {
    for (const letter of ALL_MORSE_LETTERS) {
      for (const partner of confusableWith(letter)) {
        expect(confusableWith(partner)).toContain(letter)
      }
    }
  })

  it('finds the pairs the order has to separate', () => {
    expect(confusableWith('E')).toEqual(['T'])
    expect(confusableWith('S')).toEqual(['U'])
    expect(confusableWith('G')).toEqual(['O'])
  })
})

describe('acquisition order', () => {
  it('covers all 26 letters exactly once', () => {
    expect([...ACQUISITION_ORDER].sort()).toEqual([...ALL_MORSE_LETTERS].sort())
  })

  it('is the sequence recorded in docs/MORSE_CHARACTER_ORDER.md', () => {
    // Pinned deliberately: the documented sequence and the shipped sequence are
    // the same artefact, and a silent re-ordering would invalidate the record.
    expect(ACQUISITION_ORDER.join('')).toBe('EITANSMURDWKGHOVFLBPXCZJYQ')
  })

  it('ascends in complexity, deferring only where confusability forces it', () => {
    const complexity = complexityOrderedLetters()
    expect(complexity.join('')).toBe('ETIANMSURDWKGOHVFLBPXCZJYQ')
    // Every character still sits within one novel pair of its complexity slot;
    // deferral is a nudge, not a reshuffle.
    for (const letter of ALL_MORSE_LETTERS) {
      const drift = ACQUISITION_ORDER.indexOf(letter) - complexity.indexOf(letter)
      expect(Math.abs(drift)).toBeLessThanOrEqual(DEFAULT_PACKET_PLAN.novel)
    }
  })

  it('never introduces a final-element confusable pair together', () => {
    for (let i = 0; i < ACQUISITION_ORDER.length; i += DEFAULT_PACKET_PLAN.novel) {
      const novel = ACQUISITION_ORDER.slice(i, i + DEFAULT_PACKET_PLAN.novel)
      for (const [a, b] of pairs(novel)) {
        expect(differsOnlyInFinalElement(morsePattern(a), morsePattern(b))).toBe(false)
      }
    }
  })

  it('ranks patterns by element count first and keying time second', () => {
    const order = complexityOrderedLetters()
    for (let i = 1; i < order.length; i += 1) {
      const previous = morsePattern(order[i - 1])
      const current = morsePattern(order[i])
      expect(previous.length).toBeLessThanOrEqual(current.length)
      if (previous.length === current.length) {
        expect(patternExtentUnits(previous)).toBeLessThanOrEqual(patternExtentUnits(current))
      }
    }
    expect(patternRank('...')).toBe(0)
    expect(patternRank('---')).toBe(7)
  })

  it('re-derives the same sequence for a different novel-per-packet setting', () => {
    const wide = buildAcquisitionOrder(3)
    expect([...wide].sort()).toEqual([...ALL_MORSE_LETTERS].sort())
    for (let i = 0; i < wide.length; i += 3) {
      for (const [a, b] of pairs(wide.slice(i, i + 3))) {
        expect(differsOnlyInFinalElement(morsePattern(a), morsePattern(b))).toBe(false)
      }
    }
  })
})

describe('packet composition', () => {
  const packets = buildCharacterPackets()

  it('introduces every character exactly once, in sequence order', () => {
    expect(packets.flatMap((packet) => packet.novel).join('')).toBe(ACQUISITION_ORDER.join(''))
  })

  it('shows at most the configured number of cards', () => {
    for (const packet of packets) {
      expect(packet.characters.length).toBeLessThanOrEqual(DEFAULT_PACKET_PLAN.visible)
      expect(packet.novel.length).toBeLessThanOrEqual(DEFAULT_PACKET_PLAN.novel)
      expect(packet.characters).toEqual([...packet.novel, ...packet.review])
    }
  })

  it('never puts a final-element confusable pair on screen together', () => {
    for (const packet of packets) {
      for (const [a, b] of pairs(packet.characters)) {
        expect(differsOnlyInFinalElement(morsePattern(a), morsePattern(b))).toBe(false)
      }
    }
  })

  it('only reviews characters that have already been encoded', () => {
    const encoded = new Set<MorseLetter>()
    for (const packet of packets) {
      for (const letter of packet.review) expect(encoded.has(letter)).toBe(true)
      for (const letter of packet.novel) encoded.add(letter)
    }
    expect(encoded.size).toBe(26)
  })

  it('holds packet size and acquisition load as independent settings', () => {
    // P2's whole point: changing the layout must not change how many new
    // characters a learner meets, and vice versa.
    const wider = buildCharacterPackets({ visible: 7 })
    const denser = buildCharacterPackets({ novel: 3 })

    expect(wider.flatMap((packet) => packet.novel)).toEqual(packets.flatMap((packet) => packet.novel))
    expect(wider.length).toBe(packets.length)
    expect(Math.max(...wider.map((packet) => packet.characters.length))).toBeGreaterThan(
      Math.max(...packets.map((packet) => packet.characters.length)),
    )

    expect(denser.length).toBeLessThan(packets.length)
    for (const packet of denser) {
      expect(packet.characters.length).toBeLessThanOrEqual(DEFAULT_PACKET_PLAN.visible)
    }
  })

  it('rejects incoherent packet configuration rather than guessing', () => {
    expect(() => buildCharacterPackets({ visible: 0 })).toThrow(RangeError)
    expect(() => buildCharacterPackets({ novel: 0 })).toThrow(RangeError)
    expect(() => buildCharacterPackets({ visible: 2, novel: 3 })).toThrow(RangeError)
  })

  it('brings the least recently seen characters back for retrieval first', () => {
    const seenAt = new Map<MorseLetter, number>()
    for (const packet of packets) {
      const eligible = [...seenAt.keys()]
      for (const reviewed of packet.review) {
        const staler = eligible.filter(
          (candidate) =>
            !packet.review.includes(candidate) &&
            (seenAt.get(candidate) ?? -1) < (seenAt.get(reviewed) ?? -1),
        )
        // Anything staler than a chosen card was skipped only because it would
        // have collided with something already on screen.
        for (const skipped of staler) {
          const collides = packet.characters.some((member) =>
            differsOnlyInFinalElement(morsePattern(skipped), morsePattern(member)),
          )
          expect(collides).toBe(true)
        }
      }
      packet.characters.forEach((letter) => seenAt.set(letter, packet.index))
    }
  })
})
