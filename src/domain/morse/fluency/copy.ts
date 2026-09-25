import { isMorseCharacter } from '../code'
import { MORSE_ALPHABET, fluencyWords, seededRandom, weightedSample } from './corpus'
import { fluencyNeed, type MorseFluencyProgress } from './progress'
import { generateMixed, generateNumbers, generatePhrases, generateSentences } from './sentences'

/**
 * Copy: hear it, write it down.
 *
 * Every other Fluency mode asks the learner to key back what they heard, which
 * can be done by echoing a rhythm without ever naming the letter. Copy asks
 * for the text. That is the actual skill between knowing the alphabet and
 * reading Morse, and it is the only mode that scales past single words — a
 * sentence cannot be echoed element by element.
 *
 * The levels are a ladder of material, not of speed. Speed stays the one
 * Farnsworth dial the rest of Fluency shares, so there is still exactly one
 * speed control in the product.
 *
 * Formative, like the rest of Fluency: a level's best is a number the learner
 * keeps for themselves, and "cleared" is an offer about what to try next,
 * never a gate on what they may open.
 */

export const COPY_LEVELS = [
  'letters',
  'common',
  'words',
  'phrases',
  'sentences',
  'numbers',
  'mixed',
] as const
export type CopyLevel = (typeof COPY_LEVELS)[number]

export interface CopyLevelInfo {
  title: string
  purpose: string
  /** Prompts per run. Longer material, fewer prompts, so a run stays a few minutes. */
  length: number
  /** Characters this level introduces beyond A–Z, shown before the first prompt. */
  introduces: 'figures' | 'punctuation' | null
}

export const COPY_LEVEL_INFO: Record<CopyLevel, CopyLevelInfo> = {
  letters: {
    title: 'Letters',
    purpose: 'One letter, heard and named.',
    length: 10,
    introduces: null,
  },
  common: {
    title: 'Common words',
    purpose: 'THE, AND, YOU — the words that make up most of any sentence.',
    length: 10,
    introduces: null,
  },
  words: {
    title: 'Everyday words',
    purpose: 'Three to seven letters, heard as one shape.',
    length: 8,
    introduces: null,
  },
  phrases: {
    title: 'Phrases',
    purpose: 'Two or three words, with the gaps between them.',
    length: 6,
    introduces: null,
  },
  sentences: {
    title: 'Sentences',
    purpose: 'Whole short sentences, as they would be sent.',
    length: 4,
    introduces: null,
  },
  numbers: {
    title: 'Numbers',
    purpose: 'The ten figures, alone and in groups.',
    length: 8,
    introduces: 'figures',
  },
  mixed: {
    title: 'Numbers and punctuation',
    purpose: 'Sentences with figures, full stops, commas, question marks and slashes.',
    length: 4,
    introduces: 'punctuation',
  },
}

/**
 * The most frequent English words, as far as a copy drill needs them.
 *
 * These are the ones a learner meets in every sentence, which is exactly why
 * they are worth recognising as a whole shape rather than spelling out.
 */
const COMMON_WORDS = [
  'THE', 'OF', 'AND', 'TO', 'IN', 'IS', 'YOU', 'THAT', 'IT', 'HE', 'WAS', 'FOR',
  'ON', 'ARE', 'AS', 'WITH', 'HIS', 'THEY', 'AT', 'BE', 'THIS', 'HAVE', 'FROM',
  'OR', 'ONE', 'HAD', 'BY', 'BUT', 'NOT', 'WHAT', 'ALL', 'WERE', 'WE', 'WHEN',
  'YOUR', 'CAN', 'SAID', 'THERE', 'AN', 'EACH', 'WHICH', 'SHE', 'DO', 'HOW',
  'THEIR', 'IF', 'WILL', 'UP', 'OUT', 'MANY', 'THEN', 'THEM', 'SO', 'SOME',
  'HER', 'WOULD', 'MAKE', 'LIKE', 'HIM', 'INTO', 'TIME', 'HAS', 'LOOK', 'TWO',
  'MORE', 'GO', 'SEE', 'NO', 'WAY', 'COULD', 'MY', 'THAN', 'FIRST', 'BEEN',
  'CALL', 'WHO', 'NOW', 'FIND', 'DOWN', 'DAY', 'DID', 'GET', 'COME', 'MAY',
  'HERE', 'OVER', 'WHERE', 'AFTER', 'BACK', 'GOOD', 'WELL', 'ONLY', 'YES',
] as const

export function copyCommonWords(): string[] {
  return [...COMMON_WORDS]
}

/**
 * Build one run's material.
 *
 * Seeded, like every Fluency run, so a re-render cannot reshuffle a queue the
 * learner is halfway through and the tests can assert what a level asks.
 */
export function copyPrompts(
  level: CopyLevel,
  progress: MorseFluencyProgress,
  seed: number,
): string[] {
  const random = seededRandom(seed)
  const { length } = COPY_LEVEL_INFO[level]

  let prompts: string[]
  switch (level) {
    case 'letters': {
      const needOrdered = [...MORSE_ALPHABET].sort(
        (a, b) => fluencyNeed(progress, b) - fluencyNeed(progress, a) || a.localeCompare(b),
      )
      prompts = weightedSample(needOrdered, length, random)
      break
    }
    case 'common':
      prompts = weightedSample(shuffled(COMMON_WORDS, random), length, random)
      break
    case 'words': {
      const pool = [...fluencyWords('short'), ...fluencyWords('medium')]
      prompts = weightedSample(shuffled(pool, random), length, random)
      break
    }
    case 'phrases':
      prompts = generatePhrases(length, random)
      break
    case 'sentences':
      prompts = generateSentences(length, random)
      break
    case 'numbers':
      prompts = generateNumbers(length, random)
      break
    case 'mixed':
      prompts = generateMixed(length, random)
      break
  }

  return prompts.map((prompt) => {
    for (const character of prompt) {
      if (character !== ' ' && !isMorseCharacter(character)) {
        throw new Error(`Copy material "${prompt}" contains unsupported character "${character}".`)
      }
    }
    return prompt
  })
}

function shuffled<T>(list: readonly T[], random: () => number): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * What the learner typed, in the form it is judged in.
 *
 * Case and spacing are not what is being tested. A phone keyboard puts a space
 * after a full stop, lowercases the first letter, or leaves a trailing space,
 * and none of that is a copying error. So: upper case, single spaces, and no
 * space either side of punctuation — "is it 5 ?" and "IS IT 5?" are the same
 * answer.
 */
export function normalizeCopy(text: string): string {
  return text
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/\s*([.,?/])\s*/g, '$1')
    .replace(/([.,?])(?=[^\s.,?/])/g, '$1 ')
    .trim()
}

function editDistance(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index)
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = row[0]
    row[0] = i
    for (let j = 1; j <= b.length; j += 1) {
      const above = row[j]
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1))
      diagonal = above
    }
  }
  return row[b.length]
}

export interface CopyJudgement {
  /** The target as it is displayed and judged. */
  expected: string
  /** The learner's text, normalised. */
  given: string
  correct: boolean
  /** 0–1: the share of the target's characters that came through. */
  accuracy: number
  /** Per target word: true when it appears, in order, in what was typed. */
  words: { text: string; ok: boolean }[]
}

/**
 * Judge one copied prompt.
 *
 * Accuracy is character-level edit distance against the target, so one wrong
 * letter in a sentence costs one character rather than the whole sentence —
 * the way copy is scored everywhere it is scored. The word marks are for the
 * feedback: they come from the longest common subsequence of words, so a
 * dropped word does not mark every later word wrong.
 */
export function judgeCopy(target: string, typed: string): CopyJudgement {
  const expected = normalizeCopy(target)
  const given = normalizeCopy(typed)
  const distance = editDistance(expected, given)
  const accuracy = expected.length === 0 ? 0 : Math.max(0, 1 - distance / expected.length)

  const want = expected.split(' ')
  const got = given ? given.split(' ') : []
  const table = Array.from({ length: want.length + 1 }, () => new Array<number>(got.length + 1).fill(0))
  for (let i = want.length - 1; i >= 0; i -= 1) {
    for (let j = got.length - 1; j >= 0; j -= 1) {
      table[i][j] = want[i] === got[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1])
    }
  }
  const words: { text: string; ok: boolean }[] = []
  let i = 0
  let j = 0
  while (i < want.length) {
    if (j < got.length && want[i] === got[j]) {
      words.push({ text: want[i], ok: true })
      i += 1
      j += 1
    } else if (j < got.length && table[i][j + 1] >= table[i + 1][j]) {
      j += 1
    } else {
      words.push({ text: want[i], ok: false })
      i += 1
    }
  }

  return { expected, given, correct: expected === given, accuracy, words }
}

/**
 * The bar for calling a level cleared and suggesting the next one.
 *
 * 90%, the same accuracy bar the rest of Fluency and every Koch-style trainer
 * use before adding difficulty. An offer threshold, never a gate.
 */
export const COPY_CLEAR_ACCURACY = 0.9

/** The key a level's best is stored under in `MorseFluencyProgress.bests`. */
export function copyBestKey(level: CopyLevel): string {
  return `copy:${level}`
}

/** A run's accuracy, 0–100, as a whole number: the unit `bests` stores. */
export function copyRunScore(judgements: readonly CopyJudgement[]): number {
  const characters = judgements.reduce((sum, judgement) => sum + judgement.expected.length, 0)
  if (characters === 0) return 0
  const through = judgements.reduce(
    (sum, judgement) => sum + judgement.accuracy * judgement.expected.length,
    0,
  )
  return Math.round((through / characters) * 100)
}

export function copyLevelCleared(progress: MorseFluencyProgress | undefined, level: CopyLevel): boolean {
  const best = progress?.bests[copyBestKey(level)]
  return best !== undefined && best >= COPY_CLEAR_ACCURACY * 100
}

/** The first level not yet cleared: what "keep going" means. Null once all are. */
export function nextCopyLevel(progress: MorseFluencyProgress | undefined): CopyLevel | null {
  return COPY_LEVELS.find((level) => !copyLevelCleared(progress, level)) ?? null
}

/** How many times a prompt may be heard before answering. Copy is heard once, then once more. */
export const COPY_PLAYS_PER_PROMPT = 2
