import { decodePattern, isMorseCharacter, type MorseCharacter } from '../code'

/**
 * Free play: key anything, see what it spells, hear anything typed.
 *
 * No target, no score and no storage. It exists so the learner can try
 * building their own words and sentences — the sending half of the skill,
 * which nothing else in Argus asks for except letter by letter.
 */

/** A keyed character, kept with its pattern so a mis-key can show what was sent. */
export type FreeToken =
  | { kind: 'character'; pattern: string; character: MorseCharacter | null }
  | { kind: 'space' }

/** How long a pause finishes a letter. Generous: this is a beginner's hand. */
export const FREE_LETTER_PAUSE_MS = 900

export function addPattern(tokens: readonly FreeToken[], pattern: string): FreeToken[] {
  if (!pattern) return [...tokens]
  return [...tokens, { kind: 'character', pattern, character: decodePattern(pattern) }]
}

/** A word gap. Never leading, never doubled, because neither sends anything. */
export function addSpace(tokens: readonly FreeToken[]): FreeToken[] {
  const last = tokens[tokens.length - 1]
  if (!last || last.kind === 'space') return [...tokens]
  return [...tokens, { kind: 'space' }]
}

export function removeLast(tokens: readonly FreeToken[]): FreeToken[] {
  return tokens.slice(0, -1)
}

/** What was keyed, as text. A pattern that spells nothing is left out. */
export function tokensText(tokens: readonly FreeToken[]): string {
  return tokens
    .map((token) => (token.kind === 'space' ? ' ' : token.character ?? ''))
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Typed text split into what can be played and what cannot.
 *
 * The Hear side accepts anything the learner types and says plainly which
 * characters Argus has no Morse for, rather than refusing the whole line.
 */
export function playableText(text: string): { playable: string; unsupported: string[] } {
  const unsupported = new Set<string>()
  let playable = ''
  for (const raw of text.toUpperCase()) {
    if (/\s/.test(raw)) playable += ' '
    else if (isMorseCharacter(raw)) playable += raw
    else unsupported.add(raw)
  }
  return { playable: playable.replace(/\s+/g, ' ').trim(), unsupported: [...unsupported] }
}
