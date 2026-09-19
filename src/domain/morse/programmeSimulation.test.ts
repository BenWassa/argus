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
  type LessonStep,
  type LessonEntry,
} from './curriculum/lesson'
import {
  answerListeningQuestion,
  chooseListeningTarget,
  lessonListeningOptions,
  newLessonListeningState,
  recordLessonQuestion,
  recordListeningAnswer,
} from './curriculum/listening'
import { introducedGlyphs } from './curriculum/lesson'
import {
  newLessonSitting,
  recordLessonRetrieval,
} from './curriculum/lessonSitting'
import {
  completeSitting,
  morseReviewOf,
  recordIntroduced,
  recordListeningRetrieval,
  recordPrintedRetrieval,
  withMorseReview,
} from './curriculum/review'
import { ALL_MORSE_LETTERS } from './curriculum/packetOrder'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'
import { seedLibrary } from '../library/catalogSeed'
import type { MorseLetter } from './code'
import type { Topic } from '../library/topic'

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
  /**
   * Answer these glyphs wrong the first time each is asked in print, and
   * correctly every time after. A learner who stumbles on a letter and then
   * recovers — the case the programme has to notice and come back to.
   */
  missOnce?: Set<MorseLetter>
  /** Audio available at all. */
  audio?: boolean
  /** Decline listening once this many retrievals into each sitting. */
  declineListeningAfter?: number
}

interface Trace {
  topic: Topic
  promptsPerSitting: Map<MorseLetter, number>[]
  sittings: number
  /** Novel characters introduced per sitting. */
  novelPerSitting: number[]
  /** Printed retrievals per glyph. */
  printed: Map<MorseLetter, number>
  /** Listening retrievals per glyph. */
  heard: Map<MorseLetter, number>
  /** Correct-answer positions for full three-choice listening prompts. */
  listeningPositions: number[]
  /** Glyphs with a correct printed retrieval in a sitting after introduction. */
  laterCorrect: Set<MorseLetter>
}

/**
 * Run the programme to acquisition readiness, or until the sitting cap.
 *
 * Deliberately mirrors what `MorseLesson` does with these functions: introduce,
 * answer, advance, and finish as soon as the roster is settled. No filler
 * rounds are created to reach an arbitrary answer count.
 */
function runProgramme(options: Options = {}): Trace {
  const alwaysMiss = options.alwaysMiss ?? new Set<MorseLetter>()
  const missOnce = new Set(options.missOnce ?? [])
  const audio = options.audio ?? false

  let topic = morseTopic()
  const novelPerSitting: number[] = []
  const promptsPerSitting: Map<MorseLetter, number>[] = []
  const printed = new Map<MorseLetter, number>()
  const heard = new Map<MorseLetter, number>()
  const listeningPositions: number[] = []
  const laterCorrect = new Set<MorseLetter>()
  let sittings = 0

  while (sittings < MAX_SITTINGS) {
    let run: LessonRun | null = startLesson(topic)
    if (!run || run.finished) break

    let sitting = newLessonSitting()
    let listeningState = newLessonListeningState()
    let novelThisSitting = 0
    const prompts = new Map<MorseLetter, number>()

    // The UI ends when the roster is done. This guard models a learner leaving
    // after persistent errors, so an always-wrong mock cannot run forever.
    for (let guard = 0; guard < 100; guard += 1) {
      const step: LessonStep | null = currentStep(run)
      if (!step) break

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
      const listeningEntry: LessonEntry | null = audio && !declined
        ? chooseListeningTarget(sitting.retrievals, run.entries, listeningState, morseReviewOf(topic))
        : null

      if (listeningEntry) {
        // Listening is formative only: it moves no printed support, and here it
        // moves only the listening counters.
        const correct: boolean = !alwaysMiss.has(listeningEntry.glyph)
        heard.set(listeningEntry.glyph, (heard.get(listeningEntry.glyph) ?? 0) + 1)
        const options = lessonListeningOptions(
          run,
          listeningEntry,
          introducedGlyphs(topic),
          sitting.retrievals,
          morseReviewOf(topic),
        )
        if (options.length === 3) listeningPositions.push(options.indexOf(listeningEntry.glyph))
        topic = withMorseReview(
          topic,
          recordListeningRetrieval(morseReviewOf(topic), listeningEntry.itemId, correct),
        )
        listeningState = recordListeningAnswer(listeningState, listeningEntry.itemId, correct)
        prompts.set(listeningEntry.glyph, (prompts.get(listeningEntry.glyph) ?? 0) + 1)
        sitting = recordLessonRetrieval(sitting, listeningEntry.itemId, correct)
        run = answerListeningQuestion(run, listeningEntry.itemId, correct ? listeningEntry.glyph : '?')!.run
        continue
      }

      const entry = step.entry
      const stumbles = missOnce.delete(entry.glyph)
      const correct: boolean = !alwaysMiss.has(entry.glyph) && !stumbles
      const answered = answerLesson(run, entry.itemId, correct ? entry.pattern : 'x')
      if (answered === run || !answered.feedback) break

      prompts.set(entry.glyph, (prompts.get(entry.glyph) ?? 0) + 1)
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

    promptsPerSitting.push(prompts)
    novelPerSitting.push(novelThisSitting)
    topic = withMorseReview(topic, completeSitting(morseReviewOf(topic)))
    sittings += 1

    const position = startLesson(topic)
    if (!position || position.finished) break
  }

  return { topic, sittings, promptsPerSitting, novelPerSitting, printed, heard, listeningPositions, laterCorrect }
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
    // Static packet returns gave E/I five appearances while late Q had one.
    // A perfect learner supplies no item-specific reason for that skew.
    expect(fewest).toBeGreaterThan(0)
    // The opening sittings honestly have only E/I available, so whole-programme
    // totals need not be equal. The separate equal-need roster simulation
    // proves that acquisition order stops deciding once broad review exists.
    expect(most - fewest).toBeLessThanOrEqual(3)
  })
})

describe('listening coverage', () => {
  it('uses listening for returning material without extending a completed lesson', () => {
    const trace = runProgramme({ audio: true })
    expect(trace.heard.size).toBeGreaterThan(0)
    expect(trace.promptsPerSitting[0].size).toBe(2)
    expect([...trace.promptsPerSitting[0].values()]).toEqual([2, 2])
  })

  it('spreads listening rather than landing on one subset', () => {
    const trace = runProgramme({ audio: true })
    const counts = [...trace.heard.values()]
    expect(Math.min(...counts)).toBeGreaterThan(0)
    // The baseline put 51 listening questions on a repeating subset. Balance is
    // a bounded spread, not equality.
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThan(5)
  })

  it('balances three-choice answer positions independently of the listening cadence', () => {
    const trace = runProgramme({ audio: true })
    const positions = [0, 1, 2].map((at) => trace.listeningPositions.filter((position) => position === at).length)
    expect(Math.min(...positions)).toBeGreaterThan(0)
    expect(Math.max(...positions) - Math.min(...positions)).toBeLessThanOrEqual(1)
  })

  it('keeps the visual path whole when there is no audio at all', () => {
    const trace = runProgramme({ audio: false })
    expect(trace.heard.size).toBe(0)
    expect(ALL_MORSE_LETTERS.every((glyph) => trace.printed.has(glyph))).toBe(true)
  })
})

describe('the sitting boundary is respected', () => {
  it('asks successful characters at most twice per lesson, including listening', () => {
    for (const audio of [false, true]) {
      const trace = runProgramme({ audio })
      for (const prompts of trace.promptsPerSitting) {
        expect(Math.max(...prompts.values())).toBeLessThanOrEqual(2)
      }
      expect([...trace.promptsPerSitting[0].values()].reduce((sum, count) => sum + count, 0)).toBe(4)
    }
  })

  it('has a packet for every stage of the path', () => {
    expect(lessonPackets().length).toBeGreaterThan(0)
  })
})


/**
 * #90 gave review a need function. What it had no term for was the learner's
 * own errors: `lessonProgress` records the support a character currently gets,
 * and a miss restores support only until the next correct answer puts it back,
 * after which nothing remembered it had ever happened. So review was chosen by
 * staleness and acquisition order alone, and — as the first test here proves
 * by construction — two learners with opposite error histories were handed the
 * identical thirteen rosters.
 */
describe('review is chosen by what the learner actually missed', () => {
  function reviewedIn(glyph: MorseLetter, options: Options = {}): number[] {
    return runProgramme(options).promptsPerSitting.flatMap((prompts, at) =>
      prompts.has(glyph) ? [at + 1] : [],
    )
  }

  function stumbling(glyph: MorseLetter): Options {
    return { missOnce: new Set<MorseLetter>([glyph]) }
  }

  /**
   * `C` is introduced in lesson 11 and, for a learner who gets it right, is
   * never asked again — there are two lessons left and three review slots in
   * each, all of which routine staleness spends elsewhere. Getting it wrong
   * once is what buys it one of them.
   */
  it('adds a review a clean learner would never have been given', () => {
    for (const glyph of ['C', 'J'] as MorseLetter[]) {
      expect(reviewedIn(glyph)).toHaveLength(1)
      expect(reviewedIn(glyph, stumbling(glyph)).length).toBeGreaterThan(1)
    }
  })

  /**
   * The more common shape: the character was going to come round again anyway,
   * and the stumble moves it forward. `P` is the clearest — three lessons
   * earlier — but the direction is the assertion, not the size.
   */
  it('brings a stumbled character’s next review forward', () => {
    for (const glyph of ['A', 'F', 'M', 'O', 'P', 'V', 'W'] as MorseLetter[]) {
      const clean = reviewedIn(glyph)
      const stumbled = reviewedIn(glyph, stumbling(glyph))
      expect(stumbled[1]).toBeLessThan(clean[1])
    }
  })

  /**
   * The property the baseline failed outright, stated over the whole
   * programme: what the learner is shown has to be a function of how the
   * learner answered. Before the repair term these two traces were identical
   * roster for roster, because nothing durable remembered a miss once its
   * support level had come back up.
   */
  it('gives two learners with different error histories different programmes', () => {
    const rosters = (options: Options = {}) =>
      runProgramme(options).promptsPerSitting.map((prompts) => [...prompts.keys()].sort().join(''))
    expect(rosters(stumbling('P'))).not.toEqual(rosters())
  })

  /**
   * The limit, pinned rather than papered over.
   *
   * A repair still has to find a slot the acquisition-separation rule will
   * allow, and that rule outranks it: a character whose pattern differs from
   * this lesson's novel pair only at the end is kept off the roster whatever it
   * owes (Rothkopf 1958, and `confusion.ts` owns the relation). A character
   * missed in the last lesson has no later lesson at all. So `B`, `Q`, `Y` and
   * `Z` cannot be repaired inside the thirteen, and this says so out loud
   * rather than letting it read as the term failing.
   */
  it('names the stumbles the course has no room to repair', () => {
    const improved = ALL_MORSE_LETTERS.filter((glyph) => {
      const clean = reviewedIn(glyph)
      const stumbled = reviewedIn(glyph, stumbling(glyph))
      return stumbled.length > clean.length || stumbled[1] < clean[1]
    })

    expect(improved.length).toBeGreaterThanOrEqual(9)
    for (const stranded of ['B', 'Q', 'Y', 'Z']) expect(improved).not.toContain(stranded)
  })

  /** Whatever else moves, a stumble may never push a character's review later. */
  it('never delays the review of a character the learner got wrong', () => {
    for (const glyph of ALL_MORSE_LETTERS) {
      const clean = reviewedIn(glyph)
      const stumbled = reviewedIn(glyph, stumbling(glyph))
      if (clean.length > 1 && stumbled.length > 1) {
        expect(stumbled[1]).toBeLessThanOrEqual(clean[1])
      }
    }
  })

  it('leaves a perfect learner’s whole-programme exposure as evenly spread as before', () => {
    const trace = runProgramme()
    const counts = ALL_MORSE_LETTERS.map((glyph) => trace.printed.get(glyph) ?? 0)
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(3)
  })
})
