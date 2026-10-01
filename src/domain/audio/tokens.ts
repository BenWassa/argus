import { normalizeWords } from './response'

/**
 * Decoding a token-copy transcript back to the letters and digits it spells
 * (#151). The authoritative token sequence and the drill's answer key must agree;
 * this lets asset QA check that mechanically instead of trusting two hand-typed
 * strings.
 *
 * The tables are the shipped NATO/ITU code words and the ISED RIC-22 radiotelephony
 * number forms. `tokens.test.ts` cross-checks them against the catalog topics, so
 * they cannot drift from what Argus teaches.
 */
export const NATO_CODE_WORDS: Record<string, string> = {
  ALFA: 'A', ALPHA: 'A', BRAVO: 'B', CHARLIE: 'C', DELTA: 'D', ECHO: 'E', FOXTROT: 'F',
  GOLF: 'G', HOTEL: 'H', INDIA: 'I', JULIETT: 'J', JULIET: 'J', KILO: 'K', LIMA: 'L',
  MIKE: 'M', NOVEMBER: 'N', OSCAR: 'O', PAPA: 'P', QUEBEC: 'Q', ROMEO: 'R', SIERRA: 'S',
  TANGO: 'T', UNIFORM: 'U', VICTOR: 'V', WHISKEY: 'W', WHISKY: 'W', XRAY: 'X',
  YANKEE: 'Y', ZULU: 'Z',
}

/** Spoken forms, hyphens removed, as the normalizer yields them. */
export const NUMBER_FORMS: Record<string, string> = {
  ZERO: '0', WUN: '1', TOO: '2', TREE: '3', FOWER: '4', FIFE: '5', SIX: '6',
  SEVEN: '7', AIT: '8', NINER: '9', DAYSEEMAL: '.',
}

export type DecodeResult =
  | { ok: true; text: string }
  | { ok: false; unknown: string[] }

/**
 * Decode spoken tokens to the characters they stand for. A word that is neither a
 * code word nor a number form is reported rather than guessed, and `HUN-dred` and
 * `TOU-SAND` are reported too: they are not one character, so a transcript that
 * uses them is checked some other way.
 */
export function decodeSpokenTokens(transcript: string): DecodeResult {
  // Hyphenated forms are one word: ZE-RO, FOW-er, DAY-SEE-MAL and X-ray.
  const words = transcript
    .normalize('NFKC')
    .toUpperCase()
    .replace(/(?<=\p{L})-(?=\p{L})/gu, '')
  const tokens = normalizeWords(words)
  const out: string[] = []
  const unknown: string[] = []
  for (const token of tokens) {
    if (NATO_CODE_WORDS[token]) out.push(NATO_CODE_WORDS[token])
    else if (NUMBER_FORMS[token]) out.push(NUMBER_FORMS[token])
    else unknown.push(token) // including HUNDRED and THOUSAND, which are not one character
  }
  return unknown.length > 0 ? { ok: false, unknown } : { ok: true, text: out.join('') }
}
