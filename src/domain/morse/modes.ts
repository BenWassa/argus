import type { Topic } from '../library/topic'
import { journeyFor } from '../study/journey'
import type { MorseLetter } from './code'
import { morseAcquisitionProfile } from './testing/acquisitionProfile'
import type { PracticeDirection } from './practice'
import { lessonPackets } from './curriculum/lesson'
import { COPY_LEVELS, COPY_LEVEL_INFO, copyLevelCleared, copyPrompts, type CopyLevel } from './fluency/copy'
import { allFluencyWords, materialFits } from './fluency/corpus'
import { newFluencyProgress } from './fluency/progress'
import { SEND_STAGES, SEND_STAGE_INFO, recommendedSendStage, sendPrompts, sendStageCleared, type SendStage } from './fluency/send'
import { FLUENCY_ADVANCE_ACCURACY, fluencyRunLength, groupLengthForRung } from './fluency/session'
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

/**
 * Every mode is open (#257: no forced path). Free play needs no letters, and
 * Key, Listen and Read start on Lesson 1's letters before any are settled.
 * Kept as a function so callers still ask rather than assume.
 */
export function modeAvailability(_topic: Topic, _mode: MorseMode): 'locked' | 'available' {
  return 'available'
}

/** The letters a Letters run asks: the taught roster, or Lesson 1's letters before there is one. */
export function modePlayLetters(topic: Topic): MorseLetter[] {
  if (!morseAcquisitionProfile(topic)) return []
  const eligible = modeEligibleLetters(topic)
  return eligible.length ? eligible : [...lessonPackets()[0].characters] as MorseLetter[]
}

/**
 * The characters multi-letter material may contain, or `null` for no limit.
 *
 * Before acquisition is ready it is exactly the taught letters. The course
 * teaches A–Z only, and figures and punctuation are introduced by the Numbers
 * levels themselves once the alphabet is done (`COPY_LEVEL_INFO.introduces`),
 * so they become eligible with acquisition, never before it. That is why a
 * part-way learner's Numbers level cannot start.
 */
export function modeMaterialCharacters(topic: Topic): ReadonlySet<string> | null {
  if (journeyFor(topic).acquisition.ready) return null
  return new Set(modeEligibleLetters(topic))
}

/**
 * The fewest distinct prompts a word, phrase, sentence, message, number or
 * group level must be able to draw from the taught letters before it can
 * start. Below six a run would circle the same two or three words, which
 * drills the list rather than the code.
 */
export const SAFE_LEVEL_MINIMUM = 6

export const LEVEL_REASON_LETTERS = 'Learn a few more letters first'
export const LEVEL_REASON_ALPHABET = 'Numbers come after all 26 letters'

export type LevelReadiness = { startable: true } | { startable: false; reason: string }

const poolCache = new Map<string, number>()

/** Distinct prompts this level can draw from `allowed`, counted up to `SAFE_LEVEL_MINIMUM`. */
function restrictedPool(level: MorseLevel, allowed: ReadonlySet<string>, rung: FluencyRung): number {
  const key = `${level.id}|${rung}|${[...allowed].sort().join('')}`
  const cached = poolCache.get(key)
  if (cached !== undefined) return cached
  let size: number
  if (level.kind === 'practice') size = SAFE_LEVEL_MINIMUM
  else if (level.kind === 'send') size = sendPrompts(level.stage, 0, allowed, SAFE_LEVEL_MINIMUM).length
  else if (level.kind === 'copy') size = copyPrompts(level.level, newFluencyProgress(), 0, new Set(), allowed, SAFE_LEVEL_MINIMUM).length
  else if (level.challenge === 'words') size = allFluencyWords().filter((word) => materialFits(word, allowed)).length
  else size = allowed.size ** groupLengthForRung(rung)
  poolCache.set(key, size)
  return size
}

/**
 * Whether a level can start for this learner, and if not, one line saying why.
 * Letters always can. Anything longer draws only on taught letters, and must
 * find `SAFE_LEVEL_MINIMUM` distinct prompts that way.
 */
export function levelReadiness(topic: Topic, level: MorseLevel): LevelReadiness {
  if (level.kind === 'practice') return { startable: true }
  const allowed = modeMaterialCharacters(topic)
  if (!allowed) return { startable: true }
  if (restrictedPool(level, allowed, topic.morseFluency?.rung ?? FIRST_FLUENCY_RUNG) >= SAFE_LEVEL_MINIMUM) return { startable: true }
  return { startable: false, reason: level.tier === 'numbers' ? LEVEL_REASON_ALPHABET : LEVEL_REASON_LETTERS }
}

const LETTER_STABILITY_ANSWERS = 3

/**
 * Letters are stable when all 26 are eligible and each has three latest
 * independently graded correct outcomes in this direction, oldest to newest;
 * no dates, elapsed time, other direction or helped answer can satisfy it.
 */
export function lettersStable(topic: Topic, direction: PracticeDirection): boolean {
  const eligible = modeEligibleLetters(topic)
  return new Set(eligible).size === 26 && eligible.every((glyph) => {
    const outcomes = topic.morsePractice?.characters[direction][glyph]?.outcomes ?? []
    return outcomes.length >= LETTER_STABILITY_ANSWERS && outcomes.slice(-LETTER_STABILITY_ANSWERS).every(Boolean)
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
  const next = levels.find((level) => !modeLevelCleared(topic, mode, level))
  if (next) return next
  if (mode === 'key') return levels.find((level) => level.id === `send:${recommendedSendStage(topic.morseFluency)}`)!
  return levels.at(-1)!
}

export type MorseModeEntry =
  | { mode: 'free'; levelId: null; kind: 'free' }
  | (LevelActivity & { mode: Exclude<MorseMode, 'free'>; levelId: string; eligibleLetters: MorseLetter[]; rung: FluencyRung })

/**
 * A descriptor only. Every startable level is open; clears only guide
 * suggestions. A named level that cannot start yet has no entry
 * (`levelReadiness` says why), and a mode's own suggestion falls back to
 * Letters when its current level cannot start.
 */
export function modeEntry(topic: Topic, mode: MorseMode, levelId?: string): MorseModeEntry | null {
  if (mode === 'free') return levelId === undefined ? { mode, levelId: null, kind: 'free' } : null
  const suggested = currentLevel(topic, mode)
  const level = levelId !== undefined ? levelsFor(mode).find((candidate) => candidate.id === levelId)
    : suggested && levelReadiness(topic, suggested).startable ? suggested : levelsFor(mode)[0]
  if (!level || !levelReadiness(topic, level).startable) return null
  const eligibleLetters = modePlayLetters(topic)
  return { ...level, mode, levelId: level.id, eligibleLetters, rung: topic.morseFluency?.rung ?? FIRST_FLUENCY_RUNG }
}
