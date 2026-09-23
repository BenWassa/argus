import { MORSE_LETTERS, type MorseLetter } from '../code'
import {
  MORSE_ALPHABET,
  allFluencyWords,
  buildGroup,
  fluencyWords,
  seededRandom,
  weightedSample,
  type WordTier,
} from './corpus'
import { fluencyNeed, median, type MorseFluencyProgress } from './progress'
import type { FluencyRung } from './timing'

/**
 * One Fluency run, as pure data.
 *
 * Every mode is the same loop — play something, key it back, judge it, move on
 * — so they share one state machine and differ only in what a prompt contains
 * and what counts as best. That is deliberate: four bespoke runners would be
 * four places to get the answer gate wrong, and the answer gate is the thing
 * that took #87 to get right once.
 *
 * Nothing here touches React, audio, storage or the clock. A run is built from
 * a seed, advanced by answers, and finished; the surface owns playback and the
 * surface owns what to persist.
 */

export const FLUENCY_MODES = ['sprint', 'ladder', 'words', 'groups'] as const
export type FluencyMode = (typeof FLUENCY_MODES)[number]

/** Ten, matching the lesson sitting and the practice run, so the pace is familiar. */
export const FLUENCY_RUN_LENGTH = 10
/** Words and groups are slower per prompt, so their runs are shorter. */
export const FLUENCY_WORD_RUN_LENGTH = 6
export const FLUENCY_GROUP_RUN_LENGTH = 6

export interface FluencyPrompt {
  /** What gets played and what must be keyed back. One or more letters. */
  text: string
  /** The Morse patterns, in order, that a correct answer produces. */
  patterns: string[]
}

export interface FluencyAnswer {
  prompt: FluencyPrompt
  response: string[]
  correct: boolean
  /** Per-character correctness, so a word miss can show where it broke. */
  marks: boolean[]
  /** Null when the caller judged the latency unusable. */
  latencyMs: number | null
  /** The learner asked to hear it again before answering. */
  replayed: boolean
}

export interface FluencyRun {
  mode: FluencyMode
  rung: FluencyRung
  prompts: FluencyPrompt[]
  at: number
  answers: FluencyAnswer[]
}

function promptFor(text: string): FluencyPrompt {
  const letters = Array.from(text) as MorseLetter[]
  return { text, patterns: letters.map((letter) => MORSE_LETTERS[letter]) }
}

/**
 * How long a group is at this rung.
 *
 * Grows 2 → 3 → 4 → 5, following the code-group progression CW Academy's
 * post-alphabet course uses. Length is tied to the rung rather than offered as
 * a separate control so the learner has one dial, not two.
 */
export function groupLengthForRung(rung: FluencyRung): number {
  if (rung <= 7) return 2
  if (rung <= 9) return 3
  if (rung <= 11) return 4
  return 5
}

/** Which word tier this rung draws from. Same reasoning as group length. */
export function wordTierForRung(rung: FluencyRung): WordTier {
  if (rung <= 7) return 'short'
  if (rung <= 10) return 'medium'
  return 'long'
}

/**
 * Build a run.
 *
 * `seed` makes the whole run reproducible, which is what lets the tests assert
 * selection behaviour and what stops a React re-render reshuffling a queue the
 * learner is halfway through.
 */
export function startFluencyRun(
  mode: FluencyMode,
  rung: FluencyRung,
  progress: MorseFluencyProgress,
  seed: number,
): FluencyRun {
  const random = seededRandom(seed)
  const needOrdered = [...MORSE_ALPHABET].sort(
    (a, b) => fluencyNeed(progress, b) - fluencyNeed(progress, a) || a.localeCompare(b),
  )

  let prompts: FluencyPrompt[]

  if (mode === 'words') {
    const tier = wordTierForRung(rung)
    // Draw from the tier first and top up from everything, so a short tier can
    // never produce a run that repeats the same word twice.
    const pool = [...fluencyWords(tier)]
    const shuffled = weightedSample(pool, pool.length, random)
    const chosen = shuffled.slice(0, FLUENCY_WORD_RUN_LENGTH)
    if (chosen.length < FLUENCY_WORD_RUN_LENGTH) {
      const extra = weightedSample(
        allFluencyWords().filter((word) => !chosen.includes(word)),
        FLUENCY_WORD_RUN_LENGTH - chosen.length,
        random,
      )
      chosen.push(...extra)
    }
    prompts = chosen.map(promptFor)
  } else if (mode === 'groups') {
    const length = groupLengthForRung(rung)
    prompts = Array.from({ length: FLUENCY_GROUP_RUN_LENGTH }, () =>
      promptFor(buildGroup(needOrdered, length, random)),
    )
  } else {
    // Sprint and Ladder are the same material — single characters, need
    // weighted. They differ in what happens at the end, not in what is asked.
    const letters = weightedSample(needOrdered, FLUENCY_RUN_LENGTH, random)
    while (letters.length < FLUENCY_RUN_LENGTH) {
      letters.push(needOrdered[letters.length % needOrdered.length])
    }
    prompts = letters.map((letter) => promptFor(letter))
  }

  return { mode, rung, prompts, at: 0, answers: [] }
}

export function currentPrompt(run: FluencyRun): FluencyPrompt | null {
  return run.prompts[run.at] ?? null
}

export function fluencyComplete(run: FluencyRun): boolean {
  return run.at >= run.prompts.length
}

/**
 * Judge one response and advance.
 *
 * A run never re-queues a miss. Fluency is a measurement of how fast a known
 * mapping comes back, and re-asking a character the learner has just been
 * shown measures the echo instead. Practice already owns repair; this owns
 * pace.
 */
export function answerFluency(
  run: FluencyRun,
  response: readonly string[],
  latencyMs: number | null,
  replayed: boolean,
): FluencyRun {
  const prompt = currentPrompt(run)
  if (!prompt) return run

  const marks = prompt.patterns.map((pattern, index) => response[index] === pattern)
  const correct = marks.length === response.length && marks.every(Boolean)

  return {
    ...run,
    at: run.at + 1,
    answers: [
      ...run.answers,
      {
        prompt,
        response: [...response],
        correct,
        marks,
        // A replayed prompt is a different task, so its latency is not
        // comparable with a first-hearing one and is discarded rather than
        // quietly widening the distribution.
        latencyMs: replayed ? null : latencyMs,
        replayed,
      },
    ],
  }
}

export interface FluencyOutcome {
  prompts: number
  correct: number
  /** Characters answered correctly, across every prompt. */
  charactersCorrect: number
  charactersTotal: number
  /** Median latency of usable correct answers, or null. */
  medianLatencyMs: number | null
  /** Longest unbroken run of correct prompts. */
  longestStreak: number
  /** Whether the run was clean enough to offer the next rung. */
  cleanForAdvance: boolean
}

/**
 * The threshold for offering a harder rung.
 *
 * 90% of prompts, which is the accuracy bar every Koch-style trainer uses
 * before adding difficulty. It is an *offer* threshold, never a gate: the
 * learner sets their own rung and this only decides what the end screen
 * suggests.
 */
export const FLUENCY_ADVANCE_ACCURACY = 0.9

export function fluencyOutcome(run: FluencyRun): FluencyOutcome {
  const prompts = run.answers.length
  const correct = run.answers.filter((answer) => answer.correct).length
  const charactersTotal = run.answers.reduce((sum, answer) => sum + answer.marks.length, 0)
  const charactersCorrect = run.answers.reduce(
    (sum, answer) => sum + answer.marks.filter(Boolean).length,
    0,
  )

  // The one median in `./progress`, not a second copy of it. The end screen
  // and the stored per-character statistics answer the same question — how
  // long does this usually take — so they must never be able to round or
  // tie-break it differently.
  const medianLatencyMs = median(
    run.answers.flatMap((answer) =>
      answer.correct && answer.latencyMs !== null ? [answer.latencyMs] : [],
    ),
  )

  let longestStreak = 0
  let streak = 0
  for (const answer of run.answers) {
    streak = answer.correct ? streak + 1 : 0
    longestStreak = Math.max(longestStreak, streak)
  }

  return {
    prompts,
    correct,
    charactersCorrect,
    charactersTotal,
    medianLatencyMs,
    longestStreak,
    cleanForAdvance: prompts > 0 && correct / prompts >= FLUENCY_ADVANCE_ACCURACY,
  }
}

/**
 * What this mode calls a personal best, higher being better.
 *
 * A best is a statement about the learner's own record, which is why it is
 * defensible where a badge is not. Each mode measures the thing it is actually
 * training:
 *
 *  - sprint: characters per minute, from median latency. Speed is the point.
 *  - ladder: the rung itself, cleared cleanly. Spacing is the point.
 *  - words/groups: the longest unbroken run. Holding a whole unit is the point.
 *
 * `null` when the run produced nothing worth recording, so an abandoned or
 * unusable run cannot overwrite a real result.
 */
export function fluencyBest(run: FluencyRun, outcome: FluencyOutcome): number | null {
  if (outcome.prompts === 0) return null
  if (run.mode === 'sprint') {
    if (!outcome.medianLatencyMs || outcome.medianLatencyMs <= 0) return null
    return Math.round(60000 / outcome.medianLatencyMs)
  }
  if (run.mode === 'ladder') return outcome.cleanForAdvance ? run.rung : null
  return outcome.longestStreak > 0 ? outcome.longestStreak : null
}

/** The stable key a mode's best is stored under. */
export function fluencyBestKey(mode: FluencyMode): string {
  return mode
}

export function fluencyRunLength(mode: FluencyMode): number {
  if (mode === 'words') return FLUENCY_WORD_RUN_LENGTH
  if (mode === 'groups') return FLUENCY_GROUP_RUN_LENGTH
  return FLUENCY_RUN_LENGTH
}
