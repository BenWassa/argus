import { isMorseCharacter } from '../code'
import { fluencyWords, seededRandom, weightedSample } from './corpus'
import { COPY_CLEAR_ACCURACY, copyRunScore, type CopyJudgement } from './copy'
import { generatePhrases, generateSentences } from './sentences'
import type { MorseFluencyProgress } from './progress'

/**
 * Guided sending: the learner sees text and produces it with the shared Morse
 * key. This is the complement of Copy, which starts with sound and asks for
 * text. Everything here is formative; a best is a private practice number, not
 * Test evidence or a sending-speed claim.
 */
export const SEND_STAGES = ['words', 'flow', 'phrases', 'messages', 'dispatch'] as const
export type SendStage = (typeof SEND_STAGES)[number]

export interface SendStageInfo {
  title: string
  purpose: string
  length: number
  interaction: 'spotlight' | 'flow'
}

export const SEND_STAGE_INFO: Record<SendStage, SendStageInfo> = {
  words: {
    title: 'Spotlight words',
    purpose: 'Key short words one highlighted letter at a time.',
    length: 5,
    interaction: 'spotlight',
  },
  flow: {
    title: 'Word flow',
    purpose: 'Send a whole word without per-letter grading getting in the way.',
    length: 5,
    interaction: 'flow',
  },
  phrases: {
    title: 'Phrases',
    purpose: 'Two or three familiar words, with deliberate word gaps.',
    length: 3,
    interaction: 'flow',
  },
  messages: {
    title: 'Short messages',
    purpose: 'Send a complete plain-English message and review what arrived.',
    length: 2,
    interaction: 'flow',
  },
  dispatch: {
    title: 'Dispatch',
    purpose: 'Fictional field-communications messages for contextual practice.',
    length: 3,
    interaction: 'flow',
  },
}

/**
 * Themed practice only. These are newly authored plain-English strings, not
 * official CAF/NATO procedure, Q-codes, prosigns or operating instructions.
 */
const DISPATCH_PROMPTS = [
  'CHECK IN',
  'SEND STATUS',
  'REPORT POSITION',
  'MESSAGE RECEIVED',
  'RETURN TO BASE',
  'ALL CLEAR',
  'WAIT FOR SIGNAL',
  'CHECK ROUTE',
  'MEET AT BRIDGE',
  'WE ARE READY',
] as const

function shuffled<T>(list: readonly T[], random: () => number): T[] {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function validated(prompt: string): string {
  const normalized = prompt.toUpperCase().replace(/\s+/g, ' ').trim()
  if (!normalized) throw new Error('Send material cannot be empty.')
  for (const character of normalized) {
    if (character !== ' ' && !isMorseCharacter(character)) {
      throw new Error(`Send material "${prompt}" contains unsupported character "${character}".`)
    }
  }
  return normalized
}

/** Build one finite, reproducible sending round. */
export function sendPrompts(stage: SendStage, seed: number): string[] {
  const random = seededRandom(seed)
  const length = SEND_STAGE_INFO[stage].length
  let prompts: string[]

  switch (stage) {
    case 'words': {
      const pool = fluencyWords('short').filter((word) => word.length >= 3 && word.length <= 5)
      prompts = weightedSample(shuffled(pool, random), length, random)
      break
    }
    case 'flow': {
      const pool = [...fluencyWords('medium'), ...fluencyWords('long')]
        .filter((word) => word.length >= 4 && word.length <= 7)
      prompts = weightedSample(shuffled(pool, random), length, random)
      break
    }
    case 'phrases':
      prompts = generatePhrases(length, random)
      break
    case 'messages':
      prompts = generateSentences(length, random)
      break
    case 'dispatch':
      prompts = weightedSample(shuffled(DISPATCH_PROMPTS, random), length, random)
      break
  }

  return prompts.map(validated)
}

export function sendBestKey(stage: SendStage): string {
  return `send:${stage}`
}

export function sendRunScore(judgements: readonly CopyJudgement[]): number {
  return copyRunScore(judgements)
}

export function sendStageCleared(
  progress: MorseFluencyProgress | undefined,
  stage: SendStage,
): boolean {
  const best = progress?.bests[sendBestKey(stage)]
  return best !== undefined && best >= COPY_CLEAR_ACCURACY * 100
}

export function nextSendStage(
  progress: MorseFluencyProgress | undefined,
  current?: SendStage,
): SendStage | null {
  if (current) {
    const index = SEND_STAGES.indexOf(current)
    return index >= 0 && index < SEND_STAGES.length - 1 ? SEND_STAGES[index + 1] : null
  }
  return SEND_STAGES.find((stage) => !sendStageCleared(progress, stage)) ?? null
}
