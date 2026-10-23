import { MORSE_LETTERS, type MorseLetter } from '../code'
import {
  newMorsePractice, practiceWeight, selectPracticeLetter,
  type MorsePractice, type PracticeDirection,
} from '../practice'
import { median } from '../fluency/progressMeasures'
import { cappedLatencyMs, RECOGNITION_SPEED } from './speed'

/** Playback rate is part of the key: unlike letter accuracy, latency is not
 * comparable across different Listen stimuli or between Speed and ordinary play. */
export type RecognitionStream =
  | 'read/practice' | 'read/speed'
  | `listen/practice@${number}` | `listen/speed@${number}`

export interface RecognitionCharacter {
  outcomes: boolean[]
  shown: number
  lastShownSequence: number
  /** Prevent duplicate/stale grading for the same presented prompt. */
  lastGradedSequence: number
  /** Correct, independent, full-MC4 Speed response times only; oldest first. */
  recentCorrectMs: number[]
}

export interface RecognitionTrack {
  sequence: number
  characters: Partial<Record<MorseLetter, RecognitionCharacter>>
}

/** Optional formative-only record; must never be substituted for morsePractice,
 * morseFluency, Test or learning-completion evidence. */
export interface MorseRecognition {
  schemaVersion: 1
  streams: Partial<Record<RecognitionStream, RecognitionTrack>>
}

const COUNTER_MAX = 1_000_000_000
const validGlyph = (glyph: string): glyph is MorseLetter =>
  Object.prototype.hasOwnProperty.call(MORSE_LETTERS, glyph)

export function validRecognitionStream(key: string): key is RecognitionStream {
  if (key === 'read/practice' || key === 'read/speed') return true
  const match = /^listen\/(practice|speed)@([1-9][0-9]?)$/.exec(key)
  return match !== null && Number(match[2]) >= 5 && Number(match[2]) <= 60
}

function streamDirection(key: RecognitionStream): PracticeDirection {
  return key.startsWith('read/') ? 'read' : 'listen'
}
function isSpeed(key: RecognitionStream): boolean {
  return key.startsWith('read/speed') || key.startsWith('listen/speed@')
}

export function newMorseRecognition(): MorseRecognition {
  return { schemaVersion: 1, streams: {} }
}

/** Reject rather than silently reset untrusted, corrupt or future evidence. */
export function parseMorseRecognition(value: unknown):
  | { ok: true; value: MorseRecognition }
  | { ok: false; error: string } {
  const fail = (error: string): { ok: false; error: string } => ({ ok: false, error })
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail('Recognition must be an object.')
  const root = value as Record<string, unknown>
  if (root.schemaVersion !== 1) return fail('Unsupported recognition schema.')
  if (Object.keys(root).some((key) => key !== 'schemaVersion' && key !== 'streams') ||
      !root.streams || typeof root.streams !== 'object' || Array.isArray(root.streams)) {
    return fail('Invalid recognition streams.')
  }
  for (const [key, rawTrack] of Object.entries(root.streams)) {
    if (!validRecognitionStream(key) || !rawTrack || typeof rawTrack !== 'object' || Array.isArray(rawTrack)) {
      return fail('Invalid recognition stream.')
    }
    const track = rawTrack as Record<string, unknown>
    if (Object.keys(track).some((k) => k !== 'sequence' && k !== 'characters') ||
        !Number.isSafeInteger(track.sequence) || (track.sequence as number) < 0 ||
        (track.sequence as number) > COUNTER_MAX || !track.characters ||
        typeof track.characters !== 'object' || Array.isArray(track.characters)) {
      return fail('Invalid recognition sequence.')
    }
    for (const [glyph, rawCharacter] of Object.entries(track.characters)) {
      if (!validGlyph(glyph) || !rawCharacter || typeof rawCharacter !== 'object' || Array.isArray(rawCharacter)) {
        return fail('Invalid recognition letter.')
      }
      const item = rawCharacter as Record<string, unknown>
      if (Object.keys(item).some((k) => !['outcomes', 'shown', 'lastShownSequence', 'lastGradedSequence', 'recentCorrectMs'].includes(k)) ||
          !Array.isArray(item.outcomes) || item.outcomes.length > 8 ||
          item.outcomes.some((outcome) => typeof outcome !== 'boolean') ||
          !Number.isSafeInteger(item.shown) || (item.shown as number) < 0 || (item.shown as number) > COUNTER_MAX ||
          !Number.isSafeInteger(item.lastShownSequence) || (item.lastShownSequence as number) < 0 ||
          (item.lastShownSequence as number) > (track.sequence as number) ||
          !Number.isSafeInteger(item.lastGradedSequence) || (item.lastGradedSequence as number) < 0 ||
          (item.lastGradedSequence as number) > (item.lastShownSequence as number) ||
          (item.outcomes.length > 0 && (item.lastGradedSequence as number) === 0) ||
          ((item.shown as number) === 0) !== ((item.lastShownSequence as number) === 0) ||
          item.outcomes.length > Math.min(item.shown as number, 8) ||
          !Array.isArray(item.recentCorrectMs) || item.recentCorrectMs.length > 8 ||
          item.recentCorrectMs.length > (item.shown as number) ||
          (!isSpeed(key) && item.recentCorrectMs.length > 0) ||
          item.recentCorrectMs.some((ms) => !Number.isSafeInteger(ms) || ms < 0 || ms > RECOGNITION_SPEED.capMs)) {
        return fail('Invalid recognition outcomes or timing.')
      }
    }
  }
  // JSON-derived, schema-validated input. Reconstruct to discard exotic prototypes.
  const streams: MorseRecognition['streams'] = {}
  for (const [key, rawTrack] of Object.entries(root.streams)) {
    const track = rawTrack as RecognitionTrack
    const characters: RecognitionTrack['characters'] = {}
    for (const [glyph, raw] of Object.entries(track.characters)) {
      const item = raw as RecognitionCharacter
      characters[glyph as MorseLetter] = {
        outcomes: [...item.outcomes], shown: item.shown, lastShownSequence: item.lastShownSequence,
        lastGradedSequence: item.lastGradedSequence,
        recentCorrectMs: [...item.recentCorrectMs],
      }
    }
    streams[key as RecognitionStream] = { sequence: track.sequence, characters }
  }
  return { ok: true, value: { schemaVersion: 1, streams } }
}

/** Only a genuinely independent four-way answer contributes recognition accuracy.
 * Correct Speed timings are eligible for the median; wrong answers never
 * masquerade as fast successes. Fewer choices remain entirely unscored. */
export function recordRecognitionOutcome(
  state: MorseRecognition,
  stream: RecognitionStream,
  glyph: MorseLetter,
  correct: boolean,
  options: { independent: boolean; choices: number; presentedSequence: number; elapsedMs?: number | null },
): MorseRecognition {
  if (!validRecognitionStream(stream) || !validGlyph(glyph)) throw new RangeError('Invalid recognition stream or glyph.')
  if (!options.independent || options.choices !== 4) return state
  // Only the current presented question may be graded. A different next
  // glyph leaves the older character sequence intact, so check the stream too.
  const presented = state.streams[stream]?.characters[glyph]
  if (state.streams[stream]?.sequence !== options.presentedSequence ||
      !presented || presented.shown < 1 || presented.lastShownSequence < 1 ||
      presented.lastShownSequence !== options.presentedSequence ||
      presented.lastGradedSequence === options.presentedSequence) return state
  const track: RecognitionTrack = state.streams[stream] ?? { sequence: 0, characters: {} }
  const previous = track.characters[glyph]!
  const elapsed = isSpeed(stream) && correct ? cappedLatencyMs(options.elapsedMs ?? null) : null
  const next: RecognitionCharacter = {
    ...previous,
    lastGradedSequence: options.presentedSequence,
    outcomes: [...previous.outcomes, correct].slice(-8),
    recentCorrectMs: elapsed === null ? previous.recentCorrectMs :
      [...previous.recentCorrectMs, elapsed].slice(-RECOGNITION_SPEED.typicalWindow),
  }
  return {
    ...state,
    streams: { ...state.streams, [stream]: {
      ...track, characters: { ...track.characters, [glyph]: next },
    } },
  }
}

/** Adapt MC4 history to #221's proven accuracy-weight and 3:1 scheduler.
 * No outcome is written to the free-response morsePractice store. */
function schedulerView(track: RecognitionTrack, direction: PracticeDirection): MorsePractice {
  const view = newMorsePractice()
  view.sequence[direction] = track.sequence
  for (const [glyph, record] of Object.entries(track.characters)) {
    if (!record) continue
    view.characters[direction][glyph as MorseLetter] = {
      outcomes: record.outcomes,
      shown: record.shown,
      lastShownSequence: record.lastShownSequence,
    }
  }
  return view
}

export function recognitionPriority(state: MorseRecognition, stream: RecognitionStream, glyph: MorseLetter): number {
  const track: RecognitionTrack = state.streams[stream] ?? { sequence: 0, characters: {} }
  const base = practiceWeight(schedulerView(track, streamDirection(stream)), streamDirection(stream), glyph)
  const correctSamples = track.characters[glyph]?.recentCorrectMs ?? []
  const typical = correctSamples.length >= RECOGNITION_SPEED.minSpeedSamples ? median(correctSamples) : null
  const speedFactor = typical === null ? 1 : 1 + 0.5 * Math.max(0, Math.min(1, (typical / 1000 - 2) / 8))
  return Math.max(0.35, Math.min(10, base * speedFactor))
}

export function selectRecognitionLetter(
  state: MorseRecognition,
  stream: RecognitionStream,
  eligible: readonly MorseLetter[],
  options: { recent?: readonly MorseLetter[]; rng?: () => number } = {},
): { letter: MorseLetter | null; progress: MorseRecognition } {
  if (!validRecognitionStream(stream)) throw new RangeError('Invalid recognition stream.')
  const track: RecognitionTrack = state.streams[stream] ?? { sequence: 0, characters: {} }
  const direction = streamDirection(stream)
  const selected = selectPracticeLetter(schedulerView(track, direction), direction, eligible, {
    ...options,
    weight: (_practice, _direction, glyph) => recognitionPriority(state, stream, glyph),
  })
  if (!selected.letter) return { letter: null, progress: state }
  const characters = { ...track.characters }
  for (const [glyph, value] of Object.entries(selected.progress.characters[direction])) {
    if (!value) continue
    const previous = characters[glyph as MorseLetter]
    characters[glyph as MorseLetter] = {
      outcomes: [...value.outcomes], shown: value.shown, lastShownSequence: value.lastShownSequence,
      lastGradedSequence: previous?.lastGradedSequence ?? 0,
      recentCorrectMs: previous?.recentCorrectMs ?? [],
    }
  }
  return {
    letter: selected.letter,
    progress: {
      ...state,
      streams: { ...state.streams, [stream]: { sequence: selected.progress.sequence[direction], characters } },
    },
  }
}
