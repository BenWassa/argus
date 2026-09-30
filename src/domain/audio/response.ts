import type { Item } from '../library/topic'
import type { CopyNormalizer, ItemResponse, ResponseField } from './audio'

/**
 * Deterministic grading for audio response modes (#151). Correctness is decided
 * here and nowhere else, from the item's own content.
 *
 * Normalization may ignore case and non-semantic punctuation and spacing, and
 * only that. It never ignores a wrong letter, digit, word, field or order — the
 * rule `docs/open/ISSUE_139_RADIO_COMMUNICATIONS_AUDIO.md` §7 sets for audio.
 */
const PUNCTUATION = /[.,;:!?'"“”‘’()[\]{}<>/\\|*_~`^—–-]/g

/** Upper-case, punctuation removed, words separated by single spaces. */
export function normalizeWords(text: string): string[] {
  return text
    .normalize('NFKC')
    .toUpperCase()
    .replace(PUNCTUATION, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

/** Upper-case with every space and punctuation mark removed. */
export function normalizeCompact(text: string): string {
  return normalizeWords(text).join('')
}

export function isCopyCorrect(expected: string, response: string, normalizer: CopyNormalizer): boolean {
  if (normalizer === 'compact') return normalizeCompact(expected) === normalizeCompact(response)
  const a = normalizeWords(expected)
  const b = normalizeWords(response)
  return a.length === b.length && a.every((word, index) => word === b[index])
}

export interface FieldsResult {
  /** True only when every field is right. */
  correct: boolean
  /** Per field, in order, so feedback can name what was wrong. */
  fields: { label: string; expected: string; response: string; correct: boolean }[]
}

export function gradeFields(fields: ResponseField[], responses: string[]): FieldsResult {
  const graded = fields.map((field, index) => {
    const response = responses[index] ?? ''
    return {
      label: field.label,
      expected: field.expected,
      response,
      correct: isCopyCorrect(field.expected, response, 'words'),
    }
  })
  return { correct: graded.every((field) => field.correct), fields: graded }
}

/** The text a learner is shown as the answer, for an item with an audio response. */
export function responseAnswerText(response: ItemResponse, answer: string): string {
  return response.mode === 'fields'
    ? response.fields.map((field) => `${field.label}: ${field.expected}`).join(' · ')
    : answer
}

/**
 * An item the app can grade by itself: a choice, or an audio response mode. Only
 * these are free of self-scoring, which the topic page says.
 */
export function isObjectiveItem(item: Item): boolean {
  return item.choice !== undefined || item.response !== undefined
}

export function hasAudio(item: Item): item is Item & { audio: NonNullable<Item['audio']> } {
  return item.audio !== undefined
}
