import { MORSE_LETTERS, type MorseLetter } from './code'

export const PRACTICE_DIRECTIONS = ['key', 'read', 'listen'] as const
export type PracticeDirection = (typeof PRACTICE_DIRECTIONS)[number]

export interface CharacterPractice {
  /** Independently graded outcomes, oldest first, capped at eight. */
  outcomes: boolean[]
  shown: number
  /** Event order only; this is never a date or elapsed-time value. */
  lastShownSequence: number
}

export interface MorsePractice {
  schemaVersion: 1
  sequence: Record<PracticeDirection, number>
  characters: Record<PracticeDirection, Partial<Record<MorseLetter, CharacterPractice>>>
}

const COUNTER_MAX = 1_000_000_000
const WEIGHT_MIN = 0.35
const WEIGHT_MAX = 10
const OUTCOME_WINDOW = 8

export function newMorsePractice(): MorsePractice {
  return {
    schemaVersion: 1,
    sequence: { key: 0, read: 0, listen: 0 },
    characters: { key: {}, read: {}, listen: {} },
  }
}

function boundedCounter(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.min(COUNTER_MAX, Math.floor(value))
    : 0
}

/** Parse untrusted/legacy persisted state into the current formative schema. */
export function sanitizeMorsePractice(value: unknown): MorsePractice {
  const clean = newMorsePractice()
  if (!value || typeof value !== 'object' || Array.isArray(value)) return clean
  const input = value as Record<string, unknown>
  if (input.schemaVersion !== 1) return clean
  const rawSequence = input.sequence && typeof input.sequence === 'object' ? input.sequence as Record<string, unknown> : {}
  const rawCharacters = input.characters && typeof input.characters === 'object' ? input.characters as Record<string, unknown> : {}

  for (const direction of PRACTICE_DIRECTIONS) {
    clean.sequence[direction] = boundedCounter(rawSequence[direction])
    const rawByLetter = rawCharacters[direction]
    if (!rawByLetter || typeof rawByLetter !== 'object' || Array.isArray(rawByLetter)) continue
    const records = rawByLetter as Record<string, unknown>
    for (const glyph of Object.keys(MORSE_LETTERS) as MorseLetter[]) {
      const raw = records[glyph]
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue
      const record = raw as Record<string, unknown>
      const outcomes = Array.isArray(record.outcomes)
        ? record.outcomes.filter((outcome): outcome is boolean => typeof outcome === 'boolean').slice(-OUTCOME_WINDOW)
        : []
      const shown = boundedCounter(record.shown)
      const lastShownSequence = boundedCounter(record.lastShownSequence)
      if (outcomes.length || shown || lastShownSequence) {
        clean.characters[direction][glyph] = { outcomes, shown, lastShownSequence }
      }
    }
  }
  return clean
}

export type MorsePracticeParseResult =
  | { ok: true; value: MorsePractice }
  | { ok: false; error: string }

/** Strict persistence boundary: reject corrupt/future records instead of erasing them. */
export function parseMorsePractice(value: unknown): MorsePracticeParseResult {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { ok: false, error: 'Practice state must be an object.' }
  const input = value as Record<string, unknown>
  if (input.schemaVersion !== 1) return { ok: false, error: 'Unsupported practice schema version.' }
  if (!input.sequence || typeof input.sequence !== 'object' || Array.isArray(input.sequence) ||
      !input.characters || typeof input.characters !== 'object' || Array.isArray(input.characters)) {
    return { ok: false, error: 'Practice state is missing direction records.' }
  }
  const sequence = input.sequence as Record<string, unknown>
  const characters = input.characters as Record<string, unknown>
  for (const direction of PRACTICE_DIRECTIONS) {
    if (typeof sequence[direction] !== 'number' || !Number.isSafeInteger(sequence[direction]) || (sequence[direction] as number) < 0 || (sequence[direction] as number) > COUNTER_MAX) {
      return { ok: false, error: `Invalid ${direction} sequence.` }
    }
    const byLetter = characters[direction]
    if (!byLetter || typeof byLetter !== 'object' || Array.isArray(byLetter)) return { ok: false, error: `Invalid ${direction} records.` }
    for (const [glyph, raw] of Object.entries(byLetter as Record<string, unknown>)) {
      if (!Object.prototype.hasOwnProperty.call(MORSE_LETTERS, glyph) || !raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return { ok: false, error: `Invalid ${direction} character record.` }
      }
      const record = raw as Record<string, unknown>
      if (!Array.isArray(record.outcomes) || record.outcomes.length > OUTCOME_WINDOW || record.outcomes.some((outcome) => typeof outcome !== 'boolean') ||
          typeof record.shown !== 'number' || !Number.isSafeInteger(record.shown) || record.shown < 0 || record.shown > COUNTER_MAX ||
          typeof record.lastShownSequence !== 'number' || !Number.isSafeInteger(record.lastShownSequence) || record.lastShownSequence < 0 || record.lastShownSequence > COUNTER_MAX ||
          (record.lastShownSequence as number) > (sequence[direction] as number) ||
          record.outcomes.length > Math.min(record.shown as number, OUTCOME_WINDOW) ||
          (record.shown === 0) !== (record.lastShownSequence === 0)) {
        return { ok: false, error: `Invalid ${direction} character values.` }
      }
    }
  }
  return { ok: true, value: sanitizeMorsePractice(value) }
}

function streak(outcomes: readonly boolean[], result: boolean): number {
  let count = 0
  for (let i = outcomes.length - 1; i >= 0 && outcomes[i] === result; i -= 1) count += 1
  return count
}

/** Need weight for one letter in one response direction. */
export function practiceWeight(progress: MorsePractice, direction: PracticeDirection, glyph: MorseLetter): number {
  const outcomes = progress.characters[direction][glyph]?.outcomes ?? []
  const missesInFive = outcomes.slice(-5).filter((outcome) => !outcome).length
  const wrongStreak = Math.min(streak(outcomes, false), 4)
  const correctStreak = Math.min(streak(outcomes, true), 5)
  const raw = (1 + 1.5 * missesInFive + wrongStreak) / (1 + 0.5 * correctStreak)
  return Math.max(WEIGHT_MIN, Math.min(WEIGHT_MAX, raw))
}

/** Record only independent grades. Helped/interrupted attempts leave state untouched. */
export function recordPracticeOutcome(
  progress: MorsePractice,
  direction: PracticeDirection,
  glyph: MorseLetter,
  correct: boolean,
  independentlyGraded = true,
): MorsePractice {
  if (!independentlyGraded) return progress
  const existing = progress.characters[direction][glyph] ?? { outcomes: [], shown: 0, lastShownSequence: 0 }
  return {
    ...progress,
    characters: {
      ...progress.characters,
      [direction]: {
        ...progress.characters[direction],
        [glyph]: { ...existing, outcomes: [...existing.outcomes, correct].slice(-OUTCOME_WINDOW) },
      },
    },
  }
}

export interface PracticeScheduleOptions {
  count?: number
  /** Injected unit-interval random source for reproducible simulations/tests. */
  rng?: () => number
}

/** Select and record one presentation, suitable for updating after every answer. */
export function selectPracticeLetter(
  progress: MorsePractice,
  direction: PracticeDirection,
  eligible: readonly MorseLetter[],
  options: { recent?: readonly MorseLetter[]; rng?: () => number } = {},
): { letter: MorseLetter | null; progress: MorsePractice } {
  const rng = options.rng ?? Math.random
  const roster = [...new Set(eligible)].filter((glyph) => Object.prototype.hasOwnProperty.call(MORSE_LETTERS, glyph))
  if (!roster.length) return { letter: null, progress }
  const normalized = progress.sequence[direction] >= COUNTER_MAX
    ? renormalizeDirectionSequence(progress, direction)
    : progress
  const nextSequence = normalized.sequence[direction] + 1
  const lastShown = (glyph: MorseLetter) => normalized.characters[direction][glyph]?.lastShownSequence ?? 0
  const mostRecent = options.recent?.at(-1) ?? [...roster].sort((a, b) => lastShown(b) - lastShown(a))[0]
  const spaced = roster.filter((glyph) => lastShown(glyph) === 0 || nextSequence - lastShown(glyph) > 2)
  const spacedNonImmediate = spaced.filter((glyph) => glyph !== mostRecent)
  const allNonImmediate = roster.filter((glyph) => glyph !== mostRecent)
  const candidates = spacedNonImmediate.length ? spacedNonImmediate : allNonImmediate.length ? allNonImmediate : roster
  const exploration = nextSequence % 4 === 0
  let chosen: MorseLetter
  if (exploration) {
    const oldest = Math.min(...candidates.map(lastShown))
    const ties = candidates.filter((glyph) => lastShown(glyph) === oldest)
    chosen = ties[Math.min(ties.length - 1, Math.floor(clampRandom(rng()) * ties.length))]
  } else {
    const weights = candidates.map((glyph) => practiceWeight(normalized, direction, glyph))
    const total = weights.reduce((sum, weight) => sum + weight, 0)
    let point = clampRandom(rng()) * total
    let position = weights.findIndex((weight) => (point -= weight) < 0)
    if (position < 0) position = weights.length - 1
    chosen = candidates[position]
  }
  const existing = normalized.characters[direction][chosen] ?? { outcomes: [], shown: 0, lastShownSequence: 0 }
  return {
    letter: chosen,
    progress: {
      ...normalized,
      sequence: { ...normalized.sequence, [direction]: nextSequence },
      characters: {
        ...normalized.characters,
        [direction]: {
          ...normalized.characters[direction],
          [chosen]: { ...existing, shown: Math.min(COUNTER_MAX, existing.shown + 1), lastShownSequence: nextSequence },
        },
      },
    },
  }
}

/** Preserve event order while making room for another sequence increment. */
function renormalizeDirectionSequence(progress: MorsePractice, direction: PracticeDirection): MorsePractice {
  const records = progress.characters[direction]
  const orderedSequences = [...new Set(Object.values(records).map((record) => record?.lastShownSequence ?? 0).filter((value) => value > 0))]
    .sort((a, b) => a - b)
  const rank = new Map(orderedSequences.map((value, index) => [value, index + 1]))
  const characters = Object.fromEntries(Object.entries(records).map(([glyph, record]) => [
    glyph,
    record ? { ...record, lastShownSequence: record.lastShownSequence ? rank.get(record.lastShownSequence) ?? 0 : 0 } : record,
  ])) as Partial<Record<MorseLetter, CharacterPractice>>
  return {
    ...progress,
    sequence: { ...progress.sequence, [direction]: orderedSequences.length },
    characters: { ...progress.characters, [direction]: characters },
  }
}

/**
 * Make a deterministic-when-seeded queue and return the updated presentation
 * state. The queue uses 75% need-weighted draws and 25% oldest-coverage draws.
 */
export function schedulePracticeLetters(
  progress: MorsePractice,
  direction: PracticeDirection,
  eligible: readonly MorseLetter[],
  options: PracticeScheduleOptions = {},
): { letters: MorseLetter[]; progress: MorsePractice } {
  const count = Math.max(0, Math.min(100, Math.floor(options.count ?? 10)))
  const rng = options.rng ?? Math.random
  const roster = [...new Set(eligible)].filter((glyph) => Object.prototype.hasOwnProperty.call(MORSE_LETTERS, glyph))
  if (!roster.length || !count) return { letters: [], progress }

  let next = progress
  const letters: MorseLetter[] = []
  for (let index = 0; index < count; index += 1) {
    const selected = selectPracticeLetter(next, direction, roster, { rng })
    if (!selected.letter) break
    letters.push(selected.letter)
    next = selected.progress
  }
  return { letters, progress: next }
}

function clampRandom(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.min(0.999999999, value)) : 0
}
