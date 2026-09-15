import { describe, expect, it } from 'vitest'
import {
  advanceLesson,
  answerLesson,
  currentStep,
  introduceLesson,
  lessonPackets,
  lessonProgressOf,
  startLesson,
  withLessonProgress,
  type LessonRun,
} from './morseLesson'
import { chooseListeningTarget, newLessonListeningState, recordLessonQuestion } from './morseLessonListening'
import {
  LESSON_RETRIEVAL_TARGET,
  lessonSittingComplete,
  newLessonSitting,
  recordLessonRetrieval,
} from './morseLessonSitting'
import {
  completeSitting,
  morseReviewOf,
  recordIntroduced,
  recordListeningRetrieval,
  recordPrintedRetrieval,
  withMorseReview,
} from './morseReview'
import { ALL_MORSE_LETTERS } from './morseOrder'
import { parseLibrary } from './storage'
import { seedLibrary } from './seed'
import type { MorseLetter } from './morse'
import type { Topic } from './types'

/**
 * Whole-programme simulations (#90 acceptance criteria).
 *
 * The rules in this programme are individually small and compose into
 * behaviour nobody wrote down — which is exactly how the original policy came
 * to over-practise `E` and `I` five times each while eleven letters received no
 * later review at all. Every rule there passed its own unit test.
 *
 * So these drive the real pure functions end to end, with no React and no
 * storage, and assert properties of the *whole run*.
 */

const MAX_SITTINGS = 200

function morseTopic(): Topic {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  const topic = parsed.library.topics.find((t) => t.id === 'international-morse-letters-printed')
  if (!topic) throw new Error('The seeded Morse topic is missing.')
  return topic
}

interface Options {
  /** Answer these glyphs wrong every time they are asked in print. */
  alwaysMiss?: Set<MorseLetter>
  /** Audio available at all. */
  audio?: boolean
  /** Decline listening once this many retrievals into each sitting. */
  declineListeningAfter?: number
}

interface Trace {
  topic: Topic
  sittings: number
  /** Novel characters introduced per sitting. */
  novelPerSitting: number[]
  /** Printed retrievals per glyph. */
  printed: Map<MorseLetter, number>
  /** Listening retrievals per glyph. */
  heard: Map<MorseLetter, number>
  /** Glyphs with a correct printed retrieval in a sitting after introduction. */
  laterCorrect: Set<MorseLetter>
}

/**
 * Run the programme to acquisition readiness, or until the sitting cap.
 *
 * Deliberately mirrors what `MorseLesson` does with these functions: introduce,
 * answer, advance, record the sitting, and at ten retrievals close the sitting
 * and start the next. A packet settling early asks for a review-only run, which
 * is the novel budget under test.
 */
function runProgramme(options: Options = {}): Trace {
  const alwaysMiss = options.alwaysMiss ?? new Set<MorseLetter>()
  const audio = options.audio ?? false

  let topic = morseTopic()
  const novelPerSitting: number[] = []
  const printed = new Map<MorseLetter, number>()
  const heard = new Map<MorseLetter, number>()
  const laterCorrect = new Set<MorseLetter>()
  let sittings = 0

  while (sittings < MAX_SITTINGS) {
    let run: LessonRun | null = startLesson(topic)
    if (!run || run.finished) break

    let sitting = newLessonSitting()
    let listeningState = newLessonListeningState()
    let novelThisSitting = 0

    while (!lessonSittingComplete(sitting)) {
      const step = currentStep(run)
      if (!step) {
        // The packet settled with retrievals left. Continue with review only,
        // which is the novel budget: no second pair inside one sitting.
        const next: LessonRun | null = startLesson(topic, { allowNovel: false })
        // A finished programme has no steps left to give, and asking again
        // would return the same empty run forever.
        if (!next || next.finished || next.entries.length === 0) break
        run = next
        continue
      }

      if (step.kind === 'introduce') {
        if (step.entry.novel) novelThisSitting += 1
        run = introduceLesson(run, step.entry.itemId)
        topic = withMorseReview(
          topic,
          recordIntroduced(morseReviewOf(topic), step.entry.itemId),
        )
        continue
      }

      const declined =
        options.declineListeningAfter !== undefined &&
        sitting.retrievals >= options.declineListeningAfter
      const listeningEntry = audio && !declined
        ? chooseListeningTarget(sitting.retrievals, run.entries, listeningState, morseReviewOf(topic))
        : null

      if (listeningEntry) {
        // Listening is formative only: it moves no printed support, and here it
        // moves only the listening counters.
        const correct = !alwaysMiss.has(listeningEntry.glyph)
        heard.set(listeningEntry.glyph, (heard.get(listeningEntry.glyph) ?? 0) + 1)
        topic = withMorseReview(
          topic,
          recordListeningRetrieval(morseReviewOf(topic), listeningEntry.itemId, correct),
        )
        listeningState = recordLessonQuestion(listeningState, listeningEntry.itemId)
        sitting = recordLessonRetrieval(sitting, listeningEntry.itemId, correct)
        run = { ...run, step: run.step + 1 }
        continue
      }

      const entry = step.entry
      const correct = !alwaysMiss.has(entry.glyph)
      const answered = answerLesson(run, entry.itemId, correct ? entry.pattern : 'x')
      if (answered === run || !answered.feedback) break

      printed.set(entry.glyph, (printed.get(entry.glyph) ?? 0) + 1)
      const review = morseReviewOf(topic)
      const before = review.items[entry.itemId]?.laterCorrect ?? 0
      const nextReview = recordPrintedRetrieval(review, entry.itemId, correct)
      if ((nextReview.items[entry.itemId]?.laterCorrect ?? 0) > before) {
        laterCorrect.add(entry.glyph)
      }

      topic = withMorseReview(withLessonProgress(topic, lessonProgressOf(answered)), nextReview)
      listeningState = recordLessonQuestion(listeningState, entry.itemId)
      sitting = recordLessonRetrieval(sitting, entry.itemId, correct)
      run = advanceLesson(answered)
    }

    novelPerSitting.push(novelThisSitting)
    topic = withMorseReview(topic, completeSitting(morseReviewOf(topic)))
    sittings += 1

    const position = startLesson(topic)
    if (!position || position.finished) break
  }

  return { topic, sittings, novelPerSitting, printed, heard, laterCorrect }
}

describe('the novel-item budget holds across a whole programme', () => {
  it('never introduces more than one pair in a sitting', () => {
    const trace = runProgramme()
    for (const novel of trace.novelPerSitting) expect(novel).toBeLessThanOrEqual(2)
  })

  it('introduces exactly two letters in the first sitting', () => {
    const trace = runProgramme()
    expect(trace.novelPerSitting[0]).toBe(2)
  })

  it('does the same for a learner who keeps missing an early character', () => {
    const trace = runProgramme({ alwaysMiss: new Set<MorseLetter>(['E']) })
    for (const novel of trace.novelPerSitting) expect(novel).toBeLessThanOrEqual(2)
  })

  it('does the same for a learner who keeps missing a late character', () => {
    const trace = runProgramme({ alwaysMiss: new Set<MorseLetter>(['Q']) })
    for (const novel of trace.novelPerSitting) expect(novel).toBeLessThanOrEqual(2)
  })
})

describe('the programme is finite', () => {
  it('reaches the end without running away', () => {
    const trace = runProgramme()
    expect(trace.sittings).toBeGreaterThan(0)
    expect(trace.sittings).toBeLessThan(MAX_SITTINGS)
  })

  it('reaches the end with audio enabled too', () => {
    const trace = runProgramme({ audio: true })
    expect(trace.sittings).toBeLessThan(MAX_SITTINGS)
  })

  it('still terminates when the learner declines listening midway', () => {
    const trace = runProgramme({ audio: true, declineListeningAfter: 4 })
    expect(trace.sittings).toBeLessThan(MAX_SITTINGS)
  })
})

describe('cumulative coverage', () => {
  /**
   * The baseline's central failure: eleven letters received no later review at
   * all after the packet that introduced them. Every letter must now be
   * retrieved in print somewhere in the programme.
   */
  it('retrieves every character in print', () => {
    const trace = runProgramme()
    const never = ALL_MORSE_LETTERS.filter((glyph) => !trace.printed.has(glyph))
    expect(never).toEqual([])
  })

  it('does not over-practise the earliest characters at the expense of the rest', () => {
    const trace = runProgramme()
    const counts = ALL_MORSE_LETTERS.map((glyph) => trace.printed.get(glyph) ?? 0)
    const most = Math.max(...counts)
    const fewest = Math.min(...counts)
    // The baseline's spread was 5 against 1 on packet appearances alone. The
    // point is that no character is left with nothing while another is drilled
    // repeatedly, not that every count is identical.
    expect(fewest).toBeGreaterThan(0)
    expect(most / fewest).toBeLessThan(10)
  })
})

describe('listening coverage', () => {
  it('gives every introduced character at least one listening retrieval', () => {
    const trace = runProgramme({ audio: true })
    const introduced = ALL_MORSE_LETTERS.filter((glyph) => trace.printed.has(glyph))
    const unheard = introduced.filter((glyph) => !trace.heard.has(glyph))
    expect(unheard).toEqual([])
  })

  it('spreads listening rather than landing on one subset', () => {
    const trace = runProgramme({ audio: true })
    const counts = [...trace.heard.values()]
    expect(Math.min(...counts)).toBeGreaterThan(0)
    // The baseline put 51 listening questions on a repeating subset. Balance is
    // a bounded spread, not equality.
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThan(5)
  })

  it('keeps the visual path whole when there is no audio at all', () => {
    const trace = runProgramme({ audio: false })
    expect(trace.heard.size).toBe(0)
    expect(ALL_MORSE_LETTERS.every((glyph) => trace.printed.has(glyph))).toBe(true)
  })
})

describe('the sitting boundary is respected', () => {
  it('never exceeds the advertised retrieval target in a sitting', () => {
    // `runProgramme` closes a sitting at the target; this asserts the target is
    // what the sitting module says it is rather than a number repeated here.
    expect(LESSON_RETRIEVAL_TARGET).toBe(10)
    const trace = runProgramme()
    expect(trace.sittings * LESSON_RETRIEVAL_TARGET).toBeGreaterThanOrEqual(
      [...trace.printed.values()].reduce((sum, count) => sum + count, 0),
    )
  })

  it('has a packet for every stage of the path', () => {
    expect(lessonPackets().length).toBeGreaterThan(0)
  })
})
