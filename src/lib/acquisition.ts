import { revealedElementCount, type CueRung } from './cueLadder'
import { MORSE_LETTERS, type MorseLetter } from './morse'
import { verbalMnemonic, type MorseVerbalBeat } from './morseVerbalMnemonics'
import type { Item, LearnBlock, Topic } from './types'

/**
 * What the Test ladder needs to know about one scored item to build cues for
 * it. Everything here is derived from content the topic already declares; none
 * of it is learning state and none of it is persisted.
 */
export interface AcquisitionCharacter {
  itemId: string
  /** The character. This is the item's prompt. */
  glyph: string
  /** Canonical dit/dah notation. This is the item's answer. */
  pattern: string
  /** Semantic reading of the pattern, e.g. "dit dah dit". */
  reading: string
  /** Mnemonic asset id, when the topic's Learn content supplies one. */
  mnemonicId?: string
  /** Authored semantic equivalent, when the topic's Learn content supplies one. */
  textLabel?: string
}

export type AcquisitionProfile = Map<string, AcquisitionCharacter>

/** The non-visual reading of a pattern. Deliberately not an SVG concern. */
export function patternReading(pattern: string): string {
  return Array.from(pattern)
    .map((mark) => (mark === '.' ? 'dit' : 'dah'))
    .join(' ')
}

export function canonicalPattern(pattern: string): string {
  return Array.from(pattern)
    .map((mark) => (mark === '.' ? '·' : '—'))
    .join(' ')
}

function packetMetadata(topic: Topic): Map<string, { mnemonicId: string; textLabel: string }> {
  const found = new Map<string, { mnemonicId: string; textLabel: string }>()
  const visit = (blocks: LearnBlock[]) => {
    for (const block of blocks) {
      if (block.type !== 'morse-character-packet') continue
      for (const character of block.characters) {
        found.set(character.glyph, {
          mnemonicId: character.mnemonicId,
          textLabel: character.textLabel,
        })
      }
    }
  }
  for (const section of topic.learn?.sections ?? []) visit(section.blocks)
  for (const study of topic.learn?.caseStudies ?? []) {
    for (const section of study.analysis) visit(section.blocks)
  }
  return found
}

function canonicalMorseItem(item: Item): { glyph: MorseLetter; pattern: string } | null {
  const glyph = item.prompt.trim().toUpperCase()
  if (glyph.length !== 1 || !(glyph in MORSE_LETTERS)) return null
  const pattern = item.answer.trim()
  if (MORSE_LETTERS[glyph as MorseLetter] !== pattern) return null
  return { glyph: glyph as MorseLetter, pattern }
}

/**
 * Recognise a topic the acquisition ladder can drive.
 *
 * A topic qualifies only when *every* scored item is a canonical
 * ITU-R M.1677-1 `letter → pattern` mapping. Anything else — a partial deck, a
 * mapping that disagrees with the standard, a topic that merely mentions Morse
 * — falls through to the existing reveal-and-self-score card unchanged. This is
 * derived from the standard rather than from the presence of Learn artwork, so
 * the ladder does not depend on which workstream supplied the Learn content.
 */
export function morseAcquisitionProfile(topic: Topic): AcquisitionProfile | null {
  if (topic.items.length === 0) return null
  const metadata = packetMetadata(topic)
  const profile: AcquisitionProfile = new Map()

  for (const item of topic.items) {
    if (!item.id) return null
    const canonical = canonicalMorseItem(item)
    if (!canonical) return null
    const extra = metadata.get(canonical.glyph)
    profile.set(item.id, {
      itemId: item.id,
      glyph: canonical.glyph,
      pattern: canonical.pattern,
      reading: patternReading(canonical.pattern),
      ...(extra ? { mnemonicId: extra.mnemonicId, textLabel: extra.textLabel } : {}),
    })
  }

  return profile
}

/**
 * Everything a rung is allowed to put in front of the learner besides the
 * prompt itself.
 *
 * Deliberately a plain object built by one function rather than a set of
 * conditions spread through a component: whether a cue can reach an uncued rung
 * is then a property of this value, and can be asserted mechanically for every
 * character and every rung rather than checked by reading JSX.
 *
 * A visual/verbal cue never contains the whole answer. `revealedRawPattern`
 * and `verbalBeats` are the same strict prefix. Canonical audio is deliberately
 * available only at the final supported rung, where it is a cue, never at the
 * uncued production/reverse-recall rungs that prove the completion claim.
 */
export interface CuePayload {
  rungId: string
  elementCount?: number
  revealedRawPattern?: string
  revealedPattern?: string
  revealedReading?: string
  verbalBeats?: MorseVerbalBeat[]
  hiddenCount?: number
  mnemonicId?: string
  audioText?: string
}

export function buildCuePayload(rung: CueRung, character: AcquisitionCharacter): CuePayload {
  const payload: CuePayload = { rungId: rung.id }
  const revealed = revealedElementCount(rung, character.pattern.length)

  if (rung.showsLength) payload.elementCount = character.pattern.length
  if (revealed > 0) {
    const prefix = character.pattern.slice(0, revealed)
    payload.revealedRawPattern = prefix
    payload.revealedPattern = canonicalPattern(prefix)
    payload.revealedReading = patternReading(prefix)
    payload.hiddenCount = character.pattern.length - revealed
    if (rung.allowsArtwork && character.mnemonicId) payload.mnemonicId = character.mnemonicId
    if (rung.allowsVerbalCue) {
      payload.verbalBeats = verbalMnemonic(character.glyph).beats.slice(0, revealed).map((beat) => ({ ...beat }))
    }
  }
  if (rung.allowsAudio) payload.audioText = character.glyph

  return payload
}

/** The prompt a rung actually shows. The answer side is never part of it. */
export function promptFor(rung: CueRung, character: AcquisitionCharacter): string {
  return rung.direction === 'prompt-to-answer' ? character.glyph : canonicalPattern(character.pattern)
}

/** The value a correct response has to match, before normalisation. */
export function expectedAnswer(rung: CueRung, character: AcquisitionCharacter): string {
  return rung.direction === 'prompt-to-answer' ? character.pattern : character.glyph
}

export function normaliseResponse(rung: CueRung, response: string): string {
  return rung.direction === 'prompt-to-answer'
    ? response.replace(/\s+/g, '')
    : response.trim().toUpperCase()
}

export function isCorrectResponse(
  rung: CueRung,
  character: AcquisitionCharacter,
  response: string,
): boolean {
  const normalised = normaliseResponse(rung, response)
  return normalised.length > 0 && normalised === expectedAnswer(rung, character)
}
