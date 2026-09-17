/**
 * The Learn content schema: explanatory support an author may attach to a
 * topic. Content definition throughout — nothing here is learner state, and
 * none of it is scored material unless an author adds equivalent recall items
 * to the deck.
 */
/**
 * A narrow Morse Learn block. These fields are content definition: glyph,
 * canonical notation, mnemonic asset reference and the source text from which
 * the audio engine derives playback. The generated waveform/animation is
 * runtime presentation and is never persisted.
 */
export interface MorseCharacterLearnItem {
  glyph: string
  pattern: string
  mnemonicId: string
  audioText: string
  textLabel: string
}

/**
 * Learn support is deliberately plain structured data. The scored boundary
 * remains `scope` + `items`; none of these blocks are Test material unless an
 * author explicitly adds equivalent finite recall items to the deck.
 */
export type LearnBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'steps'; items: string[] }
  | { type: 'definitions'; items: { term: string; definition: string }[] }
  | { type: 'table'; columns: string[]; rows: string[][] }
  | { type: 'morse-character-packet'; characters: MorseCharacterLearnItem[] }

export interface LearnSection {
  heading: string
  blocks: LearnBlock[]
}

export interface LearnCaseStudy {
  title: string
  scenario: string
  /** Analyse the case as a whole; do not force one toy example per term. */
  analysis: LearnSection[]
  takeaway?: string
}

export interface LearnSource {
  label: string
  url?: string
  note?: string
}

export const LEARN_KINDS = ['concise', 'briefing'] as const
export type LearnKind = (typeof LEARN_KINDS)[number]

export interface LearnContent {
  /** Undefined `Topic.learn` is the third archetype: reference-only. */
  kind: LearnKind
  overview?: string
  sections?: LearnSection[]
  caseStudies?: LearnCaseStudy[]
  limitations?: string[]
  sources?: LearnSource[]
}
