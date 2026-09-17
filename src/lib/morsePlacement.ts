import { morseAcquisitionProfile } from './acquisition'
import { MORSE_LETTERS, type MorseLetter } from './morse'
import { lessonPackets } from './morseLesson'
import { morseWordCheckpoints } from './morseWordCheckpoints'
import { resolveStudy } from './scheduling'
import type { MorsePlacementProgress, Topic } from './types'

export type MorsePlacementExperience = 'some' | 'most'

export interface MorsePlacementTarget {
  kind: 'letter' | 'word'
  letter: MorseLetter
  lesson: number
  word?: string
  characterIndex?: number
  retry?: boolean
}

export interface MorsePlacementLetterState {
  status: 'unknown' | 'pass' | 'uncertain' | 'fail'
  attempts: number
  correct: number
}

export interface MorsePlacementLesson {
  number: number
  letters: MorseLetter[]
}

export interface MorsePlacementResult {
  throughLesson: number
  nextLesson: number | null
  verifiedLetters: MorseLetter[]
  promptCount: number
  retries: number
  wordConfirmations: number
}

export interface MorsePlacementRun {
  experience: MorsePlacementExperience
  lessons: MorsePlacementLesson[]
  targets: MorsePlacementTarget[]
  index: number
  states: Partial<Record<MorseLetter, MorsePlacementLetterState>>
  promptCount: number
  retries: number
  wordConfirmations: number
  complete: boolean
  result: MorsePlacementResult | null
}

function lessonOfLetter(lessons: readonly MorsePlacementLesson[], letter: MorseLetter): number {
  return lessons.find((lesson) => lesson.letters.includes(letter))?.number ?? 1
}

function placementLessons(topic: Topic): MorsePlacementLesson[] | null {
  const profile = morseAcquisitionProfile(topic)
  if (!profile || profile.size !== 26) return null
  const available = new Set([...profile.values()].map((character) => character.glyph as MorseLetter))
  const lessons = lessonPackets().map((packet) => ({
    number: packet.index + 1,
    letters: packet.novel.filter((letter) => available.has(letter)),
  }))
  return lessons.every((lesson) => lesson.letters.length === 2) ? lessons : null
}

function letterTarget(letter: MorseLetter, lesson: number): MorsePlacementTarget {
  return { kind: 'letter', letter, lesson }
}

function wordTargets(word: string, lesson: number): MorsePlacementTarget[] {
  return Array.from(word).map((letter, characterIndex) => ({
    kind: 'word' as const,
    letter: letter as MorseLetter,
    lesson,
    word,
    characterIndex,
  }))
}

function someTargets(lessons: readonly MorsePlacementLesson[]): MorsePlacementTarget[] {
  const checkpointByLesson = new Map(
    morseWordCheckpoints().map((checkpoint) => [checkpoint.afterLesson, checkpoint]),
  )
  const targets: MorsePlacementTarget[] = []
  for (const lesson of lessons) {
    for (const letter of lesson.letters) targets.push(letterTarget(letter, lesson.number))
    const checkpoint = checkpointByLesson.get(lesson.number)
    const word = checkpoint?.words[0]
    if (word) targets.push(...wordTargets(word, lesson.number))
  }
  return targets
}

function mostTargets(lessons: readonly MorsePlacementLesson[]): MorsePlacementTarget[] {
  const targets: MorsePlacementTarget[] = []
  // A broad first sweep samples one mapping from every lesson before returning
  // for each lesson's partner. The run still verifies every placed-out mapping;
  // it simply finds widely distributed uncertainty earlier than the sequential
  // `some` path does.
  for (const lesson of lessons) targets.push(letterTarget(lesson.letters[0], lesson.number))
  for (const lesson of lessons) targets.push(letterTarget(lesson.letters[1], lesson.number))

  const finalCheckpoint = morseWordCheckpoints().at(-1)
  const finalWord = finalCheckpoint?.words.at(-1)
  if (finalCheckpoint && finalWord) {
    targets.push(...wordTargets(finalWord, finalCheckpoint.afterLesson))
  }
  return targets
}

export function startMorsePlacement(
  topic: Topic,
  experience: MorsePlacementExperience,
): MorsePlacementRun | null {
  const lessons = placementLessons(topic)
  if (!lessons) return null
  return {
    experience,
    lessons,
    targets: experience === 'some' ? someTargets(lessons) : mostTargets(lessons),
    index: 0,
    states: {},
    promptCount: 0,
    retries: 0,
    wordConfirmations: 0,
    complete: false,
    result: null,
  }
}

export function currentMorsePlacementTarget(run: MorsePlacementRun): MorsePlacementTarget | null {
  if (run.complete) return null
  return run.targets[run.index] ?? null
}

function insertRetry(
  targets: readonly MorsePlacementTarget[],
  index: number,
  target: MorsePlacementTarget,
): MorsePlacementTarget[] {
  const next = [...targets]
  const remaining = Math.max(0, next.length - index - 1)
  const intervening = Math.min(2, remaining)
  next.splice(index + 1 + intervening, 0, {
    kind: 'letter',
    letter: target.letter,
    lesson: target.lesson,
    retry: true,
  })
  return next
}

function placementResult(run: MorsePlacementRun): MorsePlacementResult {
  let firstWeakLesson: number | null = null
  for (const lesson of run.lessons) {
    if (lesson.letters.some((letter) => run.states[letter]?.status !== 'pass')) {
      firstWeakLesson = lesson.number
      break
    }
  }
  const throughLesson = firstWeakLesson === null ? run.lessons.length : firstWeakLesson - 1
  const verifiedLetters = run.lessons
    .filter((lesson) => lesson.number <= throughLesson)
    .flatMap((lesson) => lesson.letters)
  return {
    throughLesson,
    nextLesson: throughLesson < run.lessons.length ? throughLesson + 1 : null,
    verifiedLetters,
    promptCount: run.promptCount,
    retries: run.retries,
    wordConfirmations: run.wordConfirmations,
  }
}

function earliestFailedLesson(run: MorsePlacementRun): number | null {
  for (const lesson of run.lessons) {
    if (lesson.letters.some((letter) => run.states[letter]?.status === 'fail')) return lesson.number
  }
  return null
}

export function answerMorsePlacement(run: MorsePlacementRun, response: string): MorsePlacementRun {
  const target = currentMorsePlacementTarget(run)
  if (!target) return run

  const correct = response.replace(/\s+/g, '') === MORSE_LETTERS[target.letter]
  const before = run.states[target.letter] ?? { status: 'unknown' as const, attempts: 0, correct: 0 }
  let targets = run.targets
  let retries = run.retries
  let status: MorsePlacementLetterState['status']

  if (correct) {
    status = 'pass'
  } else if (before.status === 'uncertain') {
    status = 'fail'
  } else {
    status = 'uncertain'
    targets = insertRetry(run.targets, run.index, target)
    retries += 1
  }

  const states = {
    ...run.states,
    [target.letter]: {
      status,
      attempts: before.attempts + 1,
      correct: before.correct + (correct ? 1 : 0),
    },
  }

  let next: MorsePlacementRun = {
    ...run,
    targets,
    states,
    index: run.index + 1,
    promptCount: run.promptCount + 1,
    retries,
    wordConfirmations: run.wordConfirmations + (target.kind === 'word' ? 1 : 0),
  }

  // The sequential `some` path can finish as soon as a character has failed
  // twice. Everything before it has already been traversed in curriculum order.
  if (run.experience === 'some' && earliestFailedLesson(next) !== null) {
    next = { ...next, complete: true }
    return { ...next, result: placementResult(next) }
  }

  if (next.index >= next.targets.length) {
    next = { ...next, complete: true }
    return { ...next, result: placementResult(next) }
  }

  return next
}

export function canOfferMorsePlacement(topic: Topic): boolean {
  if (topic.status !== 'unstarted' || topic.acquisitionReadyAt || topic.morsePlacement) return false
  if (Object.keys(topic.lessonProgress ?? {}).length > 0) return false
  if (topic.lessonSitting || topic.morseReview) return false
  if (topic.history.length > 0) return false
  const hasEvidence = Object.values(topic.itemEvidence ?? {}).some((entry) => {
    return Object.values(entry.directions).some((direction) => (direction?.attempts ?? 0) > 0)
  })
  return !hasEvidence && placementLessons(topic) !== null
}

export function placementVerifiedItem(
  topic: Pick<Topic, 'morsePlacement'>,
  itemId: string,
): boolean {
  return topic.morsePlacement?.verifiedItemIds.includes(itemId) ?? false
}

function itemIdByLetter(topic: Topic): Map<MorseLetter, string> | null {
  const profile = morseAcquisitionProfile(topic)
  if (!profile || profile.size !== 26) return null
  const found = new Map<MorseLetter, string>()
  for (const character of profile.values()) {
    found.set(character.glyph as MorseLetter, character.itemId)
  }
  return found.size === 26 ? found : null
}

export function applyMorsePlacement(
  topic: Topic,
  result: MorsePlacementResult,
  now: Date = new Date(),
): Topic {
  const byLetter = itemIdByLetter(topic)
  if (!byLetter) return topic

  const verifiedItemIds = result.verifiedLetters.flatMap((letter) => {
    const itemId = byLetter.get(letter)
    return itemId ? [itemId] : []
  })
  const lessonProgress = { ...(topic.lessonProgress ?? {}) }
  for (const itemId of verifiedItemIds) lessonProgress[itemId] = 'settled'

  let next = resolveStudy(topic, now)
  next = {
    ...next,
    lessonProgress,
    ...(verifiedItemIds.length > 0
      ? {
          morsePlacement: {
            version: 1,
            assessedAt: now.toISOString(),
            verifiedItemIds,
          } satisfies MorsePlacementProgress,
        }
      : {}),
  }

  if (result.throughLesson >= lessonPackets().length && !next.acquisitionReadyAt) {
    next = { ...next, acquisitionReadyAt: now.toISOString() }
  }
  return next
}

export function pruneMorsePlacement(
  placement: MorsePlacementProgress | undefined,
  items: { id?: string }[],
): MorsePlacementProgress | undefined {
  if (!placement) return undefined
  const live = new Set(items.flatMap((item) => (item.id ? [item.id] : [])))
  const verifiedItemIds = placement.verifiedItemIds.filter((itemId) => live.has(itemId))
  return verifiedItemIds.length > 0 ? { ...placement, verifiedItemIds } : undefined
}

export function expectedMorsePlacementPattern(target: MorsePlacementTarget): string {
  return MORSE_LETTERS[target.letter]
}
