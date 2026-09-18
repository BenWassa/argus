import type { Topic } from '../library/topic'
import { resolveStudy } from '../study/scheduling'
import { MORSE_LETTERS, type MorseLetter } from './code'
import { morseWordCheckpoints } from './curriculum/checkpoints'
import { lessonPackets } from './curriculum/lesson'
import { morseAcquisitionProfile } from './testing/acquisitionProfile'

export type MorsePlacementExperience = 'some' | 'most'

export interface MorsePlacementTarget {
  kind: 'letter' | 'word'
  letter: MorseLetter
  lesson: number
  word?: string
  /** All letters in a word are submitted together and receive one verdict. */
  letters?: MorseLetter[]
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

function wordTarget(word: string, lesson: number): MorsePlacementTarget {
  const letters = Array.from(word) as MorseLetter[]
  return {
    kind: 'word',
    // `letter` preserves the target's stable bridge/retry identity. The
    // complete `letters` array is the grading authority for a word response.
    letter: letters[0],
    letters,
    lesson,
    word,
  }
}

function someTargets(lessons: readonly MorsePlacementLesson[]): MorsePlacementTarget[] {
  const checkpoints = morseWordCheckpoints()
  const targets: MorsePlacementTarget[] = []
  for (const lesson of lessons) {
    for (const letter of lesson.letters) targets.push(letterTarget(letter, lesson.number))
    const checkpoint = checkpoints.find((candidate) => candidate.afterLesson === lesson.number)
    const word = checkpoint?.words[0]
    if (word) targets.push(wordTarget(word, lesson.number))
  }
  return targets
}

function mostTargets(lessons: readonly MorsePlacementLesson[]): MorsePlacementTarget[] {
  const targets: MorsePlacementTarget[] = []
  // Broad first sweep: one character from every lesson, then every partner.
  // This is intentionally different from the sequential `some` route while
  // still verifying every mapping before a full placement can be committed.
  for (const lesson of lessons) targets.push(letterTarget(lesson.letters[0], lesson.number))
  for (const lesson of lessons) targets.push(letterTarget(lesson.letters[1], lesson.number))

  // Experienced learners get one integrated confirmation at the end rather
  // than every milestone, keeping this path materially shorter than `some`.
  const finalCheckpoint = morseWordCheckpoints().at(-1)
  const finalWord = finalCheckpoint?.words.at(-1)
  if (finalCheckpoint && finalWord) {
    targets.push(wordTarget(finalWord, finalCheckpoint.afterLesson))
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

function bridgeTargets(
  run: MorsePlacementRun,
  target: MorsePlacementTarget,
  count: number,
): MorsePlacementTarget[] {
  const chosen: MorsePlacementTarget[] = []
  const seen = new Set<MorseLetter>([target.letter])

  // Prefer material already demonstrated correctly. A tail miss should be
  // separated by genuine retrieval, not by repeating another unresolved item.
  for (let index = run.index - 1; index >= 0 && chosen.length < count; index -= 1) {
    const candidate = run.targets[index]
    if (seen.has(candidate.letter) || run.states[candidate.letter]?.status !== 'pass') continue
    seen.add(candidate.letter)
    chosen.push(letterTarget(candidate.letter, candidate.lesson))
  }

  // The normal runs always have plenty of prior passes by the time this is
  // needed, but keep the state machine total even for synthetic/adversarial
  // traces: fall back to distinct prior material rather than immediate repeat.
  for (let index = run.index - 1; index >= 0 && chosen.length < count; index -= 1) {
    const candidate = run.targets[index]
    if (seen.has(candidate.letter)) continue
    seen.add(candidate.letter)
    chosen.push(letterTarget(candidate.letter, candidate.lesson))
  }

  return chosen.reverse()
}

function insertRetry(
  run: MorsePlacementRun,
  target: MorsePlacementTarget,
): MorsePlacementTarget[] {
  const next = [...run.targets]
  const remaining = Math.max(0, next.length - run.index - 1)
  const bridgeCount = Math.max(0, 2 - remaining)
  if (bridgeCount > 0) next.push(...bridgeTargets(run, target, bridgeCount))

  // Every ordinary first miss returns after two intervening prompts. Near the
  // tail the bridge targets above extend the run so this stays true instead of
  // degrading into an immediate last-question retry.
  const intervening = Math.min(2, next.length - run.index - 1)
  next.splice(run.index + 1 + intervening, 0, {
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

export function answerMorsePlacement(run: MorsePlacementRun, response: string | readonly string[]): MorsePlacementRun {
  const target = currentMorsePlacementTarget(run)
  if (!target) return run

  const responses = typeof response === 'string'
    ? response.trim().split(/\s+/).filter(Boolean)
    : response.map((entry) => entry.replace(/\s+/g, ''))
  const letters = target.kind === 'word' ? target.letters ?? [] : [target.letter]
  let targets = run.targets
  let retries = run.retries
  let states = { ...run.states }

  for (const [index, letter] of letters.entries()) {
    const entryCorrect = responses[index] === MORSE_LETTERS[letter]
    const before = states[letter] ?? { status: 'unknown' as const, attempts: 0, correct: 0 }
    let status: MorsePlacementLetterState['status']

    // A word is one response surface, but it still preserves the established
    // per-letter placement policy: a repeated miss remains sticky and an
    // isolated first miss gets one spaced retry.
    if (before.status === 'fail') {
      status = 'fail'
    } else if (entryCorrect) {
      status = 'pass'
    } else if (before.status === 'uncertain') {
      status = 'fail'
    } else {
      status = 'uncertain'
      const retryTarget = letterTarget(letter, target.lesson)
      targets = insertRetry({ ...run, targets, states }, retryTarget)
      retries += 1
    }

    states = {
      ...states,
      [letter]: {
        status,
        attempts: before.attempts + 1,
        correct: before.correct + (entryCorrect ? 1 : 0),
      },
    }
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

  // `Some` moves in curriculum order, so a repeated miss is enough to stop at
  // that earliest confirmed weakness rather than spending time on later lessons.
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
  if (topic.status !== 'unstarted' || topic.acquisitionReadyAt) return false
  if (Object.keys(topic.lessonProgress ?? {}).length > 0) return false
  if (topic.lessonSitting || topic.morseReview) return false
  if (topic.history.length > 0) return false
  const hasEvidence = Object.values(topic.itemEvidence ?? {}).some((entry) => {
    return Object.values(entry.directions).some((direction) => (direction?.attempts ?? 0) > 0)
  })
  return !hasEvidence && placementLessons(topic) !== null
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

/**
 * Commit a completed placement through the same canonical acquisition fields
 * normal Learn already uses. No ordinary sitting/review history is fabricated:
 * the assessment simply establishes that teaching support is no longer needed
 * for the contiguous verified prefix. Full A–Z placement also records the
 * existing permanent acquisition-ready anchor. Formal Test evidence/history is
 * untouched.
 */
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
  next = { ...next, lessonProgress }
  if (result.throughLesson >= lessonPackets().length && !next.acquisitionReadyAt) {
    next = { ...next, acquisitionReadyAt: now.toISOString() }
  }
  return next
}

export function expectedMorsePlacementPattern(target: MorsePlacementTarget): string {
  if (target.kind === 'word') {
    return (target.letters ?? []).map((letter) => MORSE_LETTERS[letter]).join(' ')
  }
  return MORSE_LETTERS[target.letter]
}
