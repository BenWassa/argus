import type { Topic } from '../library/topic'
import { journeyFor } from '../study/journey'
import type { MorseLetter } from './code'
import { morseAcquisitionProfile } from './testing/acquisitionProfile'
import type { PracticeDirection } from './practice'
import { COPY_LEVELS, COPY_LEVEL_INFO, copyLevelCleared, type CopyLevel } from './fluency/copy'
import { SEND_STAGES, SEND_STAGE_INFO, recommendedSendStage, sendStageCleared, type SendStage } from './fluency/send'
import { FLUENCY_ADVANCE_ACCURACY, fluencyRunLength } from './fluency/session'
import { FIRST_FLUENCY_RUNG, type FluencyRung } from './fluency/timing'

export type MorseMode = 'key' | 'listen' | 'read' | 'free'

export const MORSE_MODES = [
  { id: 'key', label: 'Key' },
  { id: 'listen', label: 'Listen' },
  { id: 'read', label: 'Read' },
  { id: 'free', label: 'Free play' },
] as const satisfies readonly { id: MorseMode; label: string }[]

export const MORSE_TIERS = ['letters', 'words', 'phrases', 'sentences', 'messages', 'numbers', 'groups'] as const
export type MorseTier = (typeof MORSE_TIERS)[number]

type LevelActivity =
  | { kind: 'practice'; direction: PracticeDirection }
  | { kind: 'send'; stage: SendStage }
  | { kind: 'copy'; level: CopyLevel }
  | { kind: 'fluency'; challenge: 'words' | 'groups' }

export type MorseLevel = LevelActivity & { id: string; label: string; tier: MorseTier }

const SEND_TIERS: Record<SendStage, MorseTier> = {
  words: 'words', flow: 'words', phrases: 'phrases', messages: 'sentences', dispatch: 'messages',
}
const COPY_TIERS: Record<CopyLevel, MorseTier> = {
  letters: 'letters', common: 'words', words: 'words', phrases: 'phrases',
  sentences: 'sentences', numbers: 'numbers', mixed: 'numbers',
}

/** Real runner ids, in recommendation order; Free play has no finite ladder. */
export function levelsFor(mode: MorseMode): MorseLevel[] {
  if (mode === 'free') return []
  const letters: MorseLevel = { id: 'letters', label: 'Letters', tier: 'letters', kind: 'practice', direction: mode }
  if (mode === 'read') return [letters]
  if (mode === 'key') return [letters, ...SEND_STAGES.map((stage): MorseLevel => ({
    id: `send:${stage}`, label: SEND_STAGE_INFO[stage].title, tier: SEND_TIERS[stage], kind: 'send', stage,
  }))]
  const levels: MorseLevel[] = [letters]
  for (const level of COPY_LEVELS) {
    if (level === 'letters') continue
    levels.push({ id: `copy:${level}`, label: COPY_LEVEL_INFO[level].title, tier: COPY_TIERS[level], kind: 'copy', level })
    if (level === 'words') levels.push({ id: 'fluency:words', label: 'Word recognition', tier: 'words', kind: 'fluency', challenge: 'words' })
  }
  levels.push({ id: 'fluency:groups', label: 'Groups', tier: 'groups', kind: 'fluency', challenge: 'groups' })
  return levels
}

/** The #221 eligibility rule, shared by every direction including Free play. */
export function modeEligibleLetters(topic: Topic): MorseLetter[] {
  const ready = journeyFor(topic).acquisition.ready
  return [...(morseAcquisitionProfile(topic)?.values() ?? [])]
    .filter((character) => ready || topic.lessonProgress?.[character.itemId] === 'settled')
    .map((character) => character.glyph as MorseLetter)
}

export function modeAvailability(topic: Topic, _mode: MorseMode): 'locked' | 'available' {
  return modeEligibleLetters(topic).length ? 'available' : 'locked'
}

/**
 * Letters are stable when all 26 are eligible and each has five latest
 * independently graded correct outcomes in this direction, oldest to newest;
 * no dates, elapsed time, other direction or helped answer can satisfy it.
 */
export function lettersStable(topic: Topic, direction: PracticeDirection): boolean {
  const eligible = modeEligibleLetters(topic)
  return new Set(eligible).size === 26 && eligible.every((glyph) => {
    const outcomes = topic.morsePractice?.characters[direction][glyph]?.outcomes ?? []
    return outcomes.length >= 5 && outcomes.slice(-5).every(Boolean)
  })
}

/** Historical same-direction clears preserve suggestions without inventing practice history. */
export function modeLevelCleared(topic: Topic, mode: MorseMode, level: MorseLevel): boolean {
  if (level.kind === 'practice') {
    if (lettersStable(topic, level.direction)) return true
    if (mode === 'listen') return COPY_LEVELS.some((id) => copyLevelCleared(topic.morseFluency, id))
    if (mode === 'key') return SEND_STAGES.some((id) => sendStageCleared(topic.morseFluency, id))
    return false
  }
  if (level.kind === 'send') return sendStageCleared(topic.morseFluency, level.stage)
  if (level.kind === 'copy') return copyLevelCleared(topic.morseFluency, level.level)
  // These bests count consecutive correct prompts, not percentages or speed.
  return (topic.morseFluency?.bests[level.challenge] ?? 0) >=
    Math.ceil(fluencyRunLength(level.challenge) * FLUENCY_ADVANCE_ACCURACY)
}

/** First uncleared level; after Send is cleared retain its existing weakest-best suggestion. */
export function currentLevel(topic: Topic, mode: MorseMode): MorseLevel | null {
  const levels = levelsFor(mode)
  if (!levels.length) return null
  if (modeEligibleLetters(topic).length < 26) return levels[0]
  const next = levels.find((level) => !modeLevelCleared(topic, mode, level))
  if (next) return next
  if (mode === 'key') return levels.find((level) => level.id === `send:${recommendedSendStage(topic.morseFluency)}`)!
  return levels.at(-1)!
}

export type MorseModeEntry =
  | { mode: 'free'; levelId: null; kind: 'free' }
  | (LevelActivity & { mode: Exclude<MorseMode, 'free'>; levelId: string; eligibleLetters: MorseLetter[]; rung: FluencyRung })

/** A descriptor only. Explicit level entry keeps cleared stages replayable, not gated by bests. */
export function modeEntry(topic: Topic, mode: MorseMode, levelId?: string): MorseModeEntry | null {
  if (modeAvailability(topic, mode) === 'locked') return null
  if (mode === 'free') return levelId === undefined ? { mode, levelId: null, kind: 'free' } : null
  const level = levelId === undefined ? currentLevel(topic, mode) : levelsFor(mode).find((candidate) => candidate.id === levelId)
  if (!level) return null
  const eligibleLetters = modeEligibleLetters(topic)
  if (level.kind !== 'practice' && eligibleLetters.length < 26) return null
  return { ...level, mode, levelId: level.id, eligibleLetters, rung: topic.morseFluency?.rung ?? FIRST_FLUENCY_RUNG }
}
