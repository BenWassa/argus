import { describe, expect, it } from 'vitest'
import { morseAcquisitionProfile } from './acquisition'
import { hasCompleteTopicDirectionalCoverage, retentionCorrectCount } from './items'
import { MORSE_LETTERS, type MorseLetter } from './morse'
import {
  LESSON_CHOICE_OPTIONS,
  WEAK_ITEM_DELAY_STEPS,
  advanceLesson,
  answerLesson,
  checkFormat,
  currentStep,
  fadedSupport,
  introduceLesson,
  lessonOptions,
  lessonPackets,
  lessonProgressOf,
  pruneLessonProgress,
  restoredSupport,
  startLesson,
  withLessonProgress,
  type LessonRun,
} from './morseLesson'
import { differsOnlyInFinalElement, isConfusable } from './confusion'
import { DEFAULT_PACKET_PLAN } from './morseOrder'
import { resolveAttempt, resolveStudy } from './scheduling'
import { parseLibrary } from './storage'
import { seedLibrary } from './seed'
import type { ItemLessonStore, Topic } from './types'

function morseTopic(): Topic {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  const topic = parsed.library.topics.find((t) => t.id === 'international-morse-letters-printed')
  if (!topic) throw new Error('The seeded Morse topic is missing.')
  return topic
}

function itemIdFor(topic: Topic, glyph: string): string {
  const item = topic.items.find((candidate) => candidate.prompt === glyph)
  if (!item?.id) throw new Error(`No scored item for ${glyph}`)
  return item.id
}

function withProgress(topic: Topic, progress: Record<string, string>): Topic {
  const store: ItemLessonStore = {}
  for (const [glyph, support] of Object.entries(progress)) {
    store[itemIdFor(topic, glyph)] = support as ItemLessonStore[string]
  }
  return { ...topic, lessonProgress: store }
}

/**
 * Drive a lesson the way a learner would, answering each check according to
 * `answer`. Returns the finished run plus the full trace of steps, so ordering
 * claims are asserted against what actually happened rather than restated.
 */
function playLesson(
  topic: Topic,
  answer: (glyph: MorseLetter, step: number) => boolean,
  limit = 400,
): { run: LessonRun; trace: { kind: string; glyph: MorseLetter; format?: string }[] } {
  let run = startLesson(topic) as LessonRun
  const trace: { kind: string; glyph: MorseLetter; format?: string }[] = []

  for (let guard = 0; guard < limit; guard += 1) {
    if (run.complete) break
    const step = currentStep(run)
    if (!step) break
    if (step.kind === 'introduce') {
      trace.push({ kind: 'introduce', glyph: step.entry.glyph })
      run = introduceLesson(run, step.entry.itemId)
      continue
    }
    trace.push({ kind: 'check', glyph: step.entry.glyph, format: step.format })
    const correct = answer(step.entry.glyph, run.step)
    const response = correct ? step.entry.pattern : `${step.entry.pattern}.`
    run = advanceLesson(answerLesson(run, step.entry.itemId, response))
  }

  return { run, trace }
}

/** One whole programme, always answering correctly. */
function settleEverything(topic: Topic): Topic {
  let current = topic
  for (let packet = 0; packet < lessonPackets().length + 2; packet += 1) {
    const { run } = playLesson(current, () => true)
    if (run.finished) break
    current = withLessonProgress(current, lessonProgressOf(run))
  }
  return current
}

describe('the lesson support ladder', () => {
  it('fades one level per correct retrieval and stops at settled', () => {
    expect(fadedSupport('taught')).toBe('cued')
    expect(fadedSupport('cued')).toBe('solo')
    expect(fadedSupport('solo')).toBe('settled')
    expect(fadedSupport('settled')).toBe('settled')
  })

  it('restores the support the failed check was actually withholding', () => {
    // A miss at `settled` cannot return the learner to the identical unaided
    // format, so both unaided levels restore to `cued`.
    expect(restoredSupport('settled')).toBe('cued')
    expect(restoredSupport('solo')).toBe('cued')
    expect(restoredSupport('cued')).toBe('taught')
    expect(restoredSupport('taught')).toBe('taught')
  })

  it('retrieves a settled character in exactly the unaided format', () => {
    expect(checkFormat('settled')).toBe('solo')
    expect(checkFormat('solo')).toBe('solo')
    expect(checkFormat('cued')).toBe('cued')
    expect(checkFormat('taught')).toBe('taught')
  })
})

describe('which topics get a lesson', () => {
  it('drives the seeded printed A–Z topic', () => {
    expect(startLesson(morseTopic())).not.toBeNull()
  })

  it('leaves every other seeded topic on the reading sheet', () => {
    const parsed = parseLibrary(seedLibrary())
    if (!parsed.ok) throw new Error(parsed.error)
    for (const topic of parsed.library.topics) {
      if (topic.id === 'international-morse-letters-printed') continue
      expect(startLesson(topic)).toBeNull()
    }
  })

  it('refuses a partial Morse deck rather than handing out a lesson it cannot finish', () => {
    const topic = morseTopic()
    const partial: Topic = { ...topic, items: topic.items.slice(0, 10) }
    // The acquisition ladder still recognises it for Test; only the lesson,
    // which walks the whole 26-character programme, declines.
    expect(morseAcquisitionProfile(partial)).not.toBeNull()
    expect(startLesson(partial)).toBeNull()
  })
})

describe('the first lesson', () => {
  const topic = morseTopic()

  it('introduces exactly the intended new-item load, not the visible packet size', () => {
    const run = startLesson(topic) as LessonRun
    expect(run.packetIndex).toBe(0)
    expect(run.entries.filter((entry) => entry.novel)).toHaveLength(DEFAULT_PACKET_PLAN.novel)
    expect(run.entries.map((entry) => entry.glyph)).toEqual(['E', 'I'])
    expect(DEFAULT_PACKET_PLAN.novel).toBeLessThan(DEFAULT_PACKET_PLAN.visible)
  })

  it('introduces both new characters before asking for either', () => {
    const { trace } = playLesson(topic, () => true)
    expect(trace.slice(0, 2)).toEqual([
      { kind: 'introduce', glyph: 'E' },
      { kind: 'introduce', glyph: 'I' },
    ])
    expect(trace[2].kind).toBe('check')
  })

  it('retrieves a new character one step after its own introduction', () => {
    const { trace } = playLesson(topic, () => true)
    const introducedAt = trace.findIndex((entry) => entry.kind === 'introduce' && entry.glyph === 'E')
    const checkedAt = trace.findIndex((entry) => entry.kind === 'check' && entry.glyph === 'E')
    // One item of intervening material: retrieval, not recognition of what is
    // still on screen, and not a wait until the end of the lesson either.
    expect(checkedAt - introducedAt).toBe(2)
  })

  it('walks a correct learner down the ladder and asks the last check unaided', () => {
    const { trace, run } = playLesson(topic, () => true)
    const forE = trace.filter((entry) => entry.kind === 'check' && entry.glyph === 'E')
    expect(forE.map((entry) => entry.format)).toEqual(['taught', 'cued', 'solo'])
    expect(run.complete).toBe(true)
  })

  it('alternates the roster instead of drilling one character to the end', () => {
    const { trace } = playLesson(topic, () => true)
    const checks = trace.filter((entry) => entry.kind === 'check').map((entry) => entry.glyph)
    for (let at = 1; at < checks.length; at += 1) {
      expect(checks[at]).not.toBe(checks[at - 1])
    }
  })
})

describe('errors', () => {
  const topic = morseTopic()

  it('restores support on the character that was missed', () => {
    let run = startLesson(topic) as LessonRun
    run = introduceLesson(run, itemIdFor(topic, 'E'))
    run = introduceLesson(run, itemIdFor(topic, 'I'))
    const first = currentStep(run)
    expect(first?.kind).toBe('check')
    if (first?.kind !== 'check') return

    // Get E to `solo`, then miss it.
    run = advanceLesson(answerLesson(run, itemIdFor(topic, 'E'), '.'))
    run = advanceLesson(answerLesson(run, itemIdFor(topic, 'I'), '..'))
    run = advanceLesson(answerLesson(run, itemIdFor(topic, 'E'), '.'))
    expect(run.entries.find((entry) => entry.glyph === 'E')?.support).toBe('solo')

    const missed = answerLesson(run, itemIdFor(topic, 'E'), '-')
    expect(missed.feedback).toMatchObject({ glyph: 'E', correct: false, reteach: true })
    expect(missed.entries.find((entry) => entry.glyph === 'E')?.support).toBe('cued')
  })

  it('never asks the missed character as the very next step, at any point in any packet', () => {
    // Exhaustive over the programme: miss the nth check of every lesson and
    // assert that the correction is never an immediate echo.
    for (let packet = 0; packet < lessonPackets().length; packet += 1) {
      let current = morseTopic()
      for (let ahead = 0; ahead < packet; ahead += 1) {
        current = withLessonProgress(current, lessonProgressOf(playLesson(current, () => true).run))
      }
      for (let missAt = 0; missAt < 12; missAt += 1) {
        let seen = 0
        let missedGlyph: MorseLetter | null = null
        let nextGlyph: MorseLetter | null = null
        let run = startLesson(current) as LessonRun

        for (let guard = 0; guard < 200 && !run.complete; guard += 1) {
          const step = currentStep(run)
          if (!step) break
          if (step.kind === 'introduce') {
            run = introduceLesson(run, step.entry.itemId)
            continue
          }
          if (missedGlyph) {
            nextGlyph = step.entry.glyph
            break
          }
          const miss = seen === missAt
          seen += 1
          if (miss) missedGlyph = step.entry.glyph
          const response = miss ? `${step.entry.pattern}.` : step.entry.pattern
          run = advanceLesson(answerLesson(run, step.entry.itemId, response))
        }

        if (missedGlyph && nextGlyph) expect(nextGlyph).not.toBe(missedGlyph)
      }
    }
  })

  it('brings the missed character back after intervening material, not at the end of time', () => {
    let run = startLesson(topic) as LessonRun
    run = introduceLesson(run, itemIdFor(topic, 'E'))
    run = introduceLesson(run, itemIdFor(topic, 'I'))
    const missedAt = run.step
    run = advanceLesson(answerLesson(run, itemIdFor(topic, 'E'), '-'))

    const entry = run.entries.find((candidate) => candidate.glyph === 'E')
    expect(entry?.notBefore).toBe(missedAt + 1 + WEAK_ITEM_DELAY_STEPS)

    // It does come back, and at restored support.
    const trace: string[] = []
    for (let guard = 0; guard < 40 && !run.complete; guard += 1) {
      const step = currentStep(run)
      if (step?.kind !== 'check') break
      trace.push(step.entry.glyph)
      run = advanceLesson(answerLesson(run, step.entry.itemId, step.entry.pattern))
    }
    expect(trace).toContain('E')
  })

  it('cannot finish a packet while a character is still missed', () => {
    // Always wrong on E: the lesson never reports complete, because packet
    // readiness is "every roster character settled" and nothing else.
    const { run } = playLesson(topic, (glyph) => glyph !== 'E', 60)
    expect(run.complete).toBe(false)
    expect(run.entries.find((entry) => entry.glyph === 'E')?.support).not.toBe('settled')
  })
})

describe('interleaving prior packets', () => {
  it('puts earlier characters on later rosters and actually retrieves them', () => {
    let topic = morseTopic()
    for (let packet = 0; packet < 4; packet += 1) {
      topic = withLessonProgress(topic, lessonProgressOf(playLesson(topic, () => true).run))
    }

    const run = startLesson(topic) as LessonRun
    expect(run.packetIndex).toBe(4)
    const returning = run.entries.filter((entry) => !entry.novel).map((entry) => entry.glyph)
    expect(returning.length).toBeGreaterThan(0)
    // Returning characters arrive already settled, so they are retrieved with
    // no support at all — the point of interleaving, not a re-teach.
    for (const entry of run.entries.filter((candidate) => !candidate.novel)) {
      expect(entry.support).toBe('settled')
      expect(checkFormat(entry.support)).toBe('solo')
    }

    const { trace } = playLesson(topic, () => true)
    const checked = new Set(trace.filter((entry) => entry.kind === 'check').map((entry) => entry.glyph))
    for (const glyph of returning) expect(checked.has(glyph)).toBe(true)
  })

  it('a missed returning character blocks the packet until it is produced again', () => {
    let topic = morseTopic()
    for (let packet = 0; packet < 4; packet += 1) {
      topic = withLessonProgress(topic, lessonProgressOf(playLesson(topic, () => true).run))
    }
    const returning = (startLesson(topic) as LessonRun).entries.find((entry) => !entry.novel)
    expect(returning).toBeDefined()
    if (!returning) return

    const { run } = playLesson(topic, (glyph) => glyph !== returning.glyph, 60)
    expect(run.complete).toBe(false)
    expect(run.entries.find((entry) => entry.glyph === returning.glyph)?.support).not.toBe('settled')
  })
})

describe('packet advancement', () => {
  it('advances only once every roster character is settled', () => {
    const topic = morseTopic()
    const { run } = playLesson(topic, () => true)
    expect(run.complete).toBe(true)
    for (const entry of run.entries) expect(entry.support).toBe('settled')

    const next = startLesson(withLessonProgress(topic, lessonProgressOf(run))) as LessonRun
    expect(next.packetIndex).toBe(1)
  })

  it('holds the packet when one new character is left unsettled', () => {
    const topic = morseTopic()
    const { run } = playLesson(topic, () => true)
    const held = withLessonProgress(topic, { ...lessonProgressOf(run), [itemIdFor(topic, 'I')]: 'solo' })
    expect((startLesson(held) as LessonRun).packetIndex).toBe(0)
  })

  it('covers all 26 characters and then reports the programme finished', () => {
    const settled = settleEverything(morseTopic())
    const run = startLesson(settled) as LessonRun
    expect(run.finished).toBe(true)
    expect(run.packetIndex).toBe(lessonPackets().length)

    const store = settled.lessonProgress ?? {}
    const settledGlyphs = settled.items
      .filter((item) => item.id && store[item.id] === 'settled')
      .map((item) => item.prompt)
      .sort()
    expect(settledGlyphs).toEqual(Object.keys(MORSE_LETTERS).sort())
  })
})

describe('leaving and resuming', () => {
  const topic = morseTopic()

  it('keeps the support levels earned before the learner left', () => {
    let run = startLesson(topic) as LessonRun
    run = introduceLesson(run, itemIdFor(topic, 'E'))
    run = introduceLesson(run, itemIdFor(topic, 'I'))
    run = advanceLesson(answerLesson(run, itemIdFor(topic, 'E'), '.'))

    const left = withLessonProgress(topic, lessonProgressOf(run))
    const resumed = startLesson(left) as LessonRun

    expect(resumed.packetIndex).toBe(0)
    expect(resumed.entries.find((entry) => entry.glyph === 'E')?.support).toBe('cued')
    expect(resumed.entries.find((entry) => entry.glyph === 'I')?.support).toBe('taught')
  })

  it('does not re-introduce a character the learner has already met', () => {
    let run = startLesson(topic) as LessonRun
    run = introduceLesson(run, itemIdFor(topic, 'E'))
    const resumed = startLesson(withLessonProgress(topic, lessonProgressOf(run))) as LessonRun

    expect(resumed.entries.find((entry) => entry.glyph === 'E')?.introduced).toBe(true)
    expect(currentStep(resumed)).toMatchObject({ kind: 'introduce', entry: { glyph: 'I' } })
  })

  it('resumes a returning learner at their first unsettled packet, not at zero', () => {
    let current = topic
    for (let packet = 0; packet < 6; packet += 1) {
      current = withLessonProgress(current, lessonProgressOf(playLesson(current, () => true).run))
    }
    const resumed = startLesson(current) as LessonRun
    expect(resumed.packetIndex).toBe(6)
    // And never into material they have not met: everything on the roster is
    // either introduced now or already carries a support level.
    for (const entry of resumed.entries) {
      expect(entry.novel || entry.introduced).toBe(true)
    }
  })

  it('starts a learner with no lesson history at the first packet', () => {
    expect((startLesson({ ...topic, lessonProgress: {} }) as LessonRun).packetIndex).toBe(0)
    expect((startLesson({ ...topic, lessonProgress: undefined }) as LessonRun).packetIndex).toBe(0)
  })
})

describe('alternatives on a supported check', () => {
  it('offers the answer plus deterministic distractors the learner has met', () => {
    const topic = morseTopic()
    let run = startLesson(topic) as LessonRun
    run = introduceLesson(run, itemIdFor(topic, 'E'))
    run = introduceLesson(run, itemIdFor(topic, 'I'))
    const step = currentStep(run)
    if (step?.kind !== 'check') throw new Error('expected a check')

    const options = lessonOptions(run, step.entry)
    expect(options).toHaveLength(LESSON_CHOICE_OPTIONS)
    expect(options).toContain(step.entry.pattern)
    expect(new Set(options).size).toBe(LESSON_CHOICE_OPTIONS)
    // Deterministic: the same run always produces the same three, in the same
    // order, so what a learner sees is a property of their own answers.
    expect(lessonOptions(run, step.entry)).toEqual(options)
  })

  it('never contrasts a confusable during acquisition, in any packet', () => {
    // Rothkopf: keep highly confusable material apart while it is being
    // acquired. Contrasting a pair is the Test ladder's discrimination stage,
    // once both members are established — not the introduction lesson's.
    let topic = morseTopic()
    let sameLengthChecks = 0
    for (let packet = 0; packet < lessonPackets().length; packet += 1) {
      let run = startLesson(topic) as LessonRun
      for (let guard = 0; guard < 200 && !run.complete; guard += 1) {
        const step = currentStep(run)
        if (!step) break
        if (step.kind === 'introduce') {
          run = introduceLesson(run, step.entry.itemId)
          continue
        }
        if (step.format !== 'solo') {
          const target = step.entry.pattern
          const options = lessonOptions(run, step.entry)
          for (const option of options) {
            if (option === target) continue
            expect(isConfusable(target, option)).toBe(false)
            // Every multi-element pattern has a same-length non-confusable
            // alternative, so the strongest family never appears at all.
            if (target.length > 1) expect(differsOnlyInFinalElement(target, option)).toBe(false)
          }
          // The `cued` check discloses the element count, so alternatives of
          // the same length are what stop the count from solving it.
          if (target.length > 1) {
            expect(options.every((option) => option.length === target.length)).toBe(true)
            sameLengthChecks += 1
          }
        }
        run = advanceLesson(answerLesson(run, step.entry.itemId, step.entry.pattern))
      }
      if (run.finished) break
      topic = withLessonProgress(topic, lessonProgressOf(run))
    }
    expect(sameLengthChecks).toBeGreaterThan(20)
  })
})

describe('a Learn answer cannot become formal evidence', () => {
  it('changes nothing about a topic except lessonProgress', () => {
    const topic = morseTopic()
    const { run } = playLesson(topic, () => true)
    const after = withLessonProgress(topic, lessonProgressOf(run))

    expect(after.lessonProgress).not.toEqual(topic.lessonProgress)
    expect({ ...after, lessonProgress: topic.lessonProgress }).toEqual(topic)
  })

  it('leaves status, history and every retention timestamp untouched through the whole programme', () => {
    const topic = resolveStudy(morseTopic(), new Date('2026-01-01T00:00:00.000Z'))
    const settled = settleEverything(topic)

    expect(settled.status).toBe(topic.status)
    expect(settled.history).toEqual(topic.history)
    expect(settled.completedAt).toBeNull()
    expect(settled.drilledAt).toBe(topic.drilledAt)
    expect(settled.learningAt).toBe(topic.learningAt)
    expect(settled.lastTestedAt).toBe(topic.lastTestedAt)
    expect(settled.spotCheckedAt).toBe(topic.spotCheckedAt)
  })

  it('writes no cue evidence and no directional coverage', () => {
    const settled = settleEverything(morseTopic())

    expect(settled.itemEvidence).toEqual({})
    expect(hasCompleteTopicDirectionalCoverage(settled.items, settled.itemEvidence)).toBe(false)
    // The one-way gate #28 added still withholds the tally, so a perfect Learn
    // run cannot present the scheduler with a passing bidirectional attempt.
    expect(retentionCorrectCount(settled.items, settled.itemEvidence, 26)).toBe(0)
  })

  it('cannot complete the topic even from a perfect lesson plus a perfect-looking attempt', () => {
    const drilled: Topic = {
      ...morseTopic(),
      status: 'drilled',
      drilledAt: '2026-01-01T00:00:00.000Z',
    }
    const settled = settleEverything(drilled)
    const now = new Date('2026-06-01T00:00:00.000Z')

    const withheld = retentionCorrectCount(settled.items, settled.itemEvidence, settled.items.length)
    const resolution = resolveAttempt(settled, withheld, settled.items.length, now)

    expect(withheld).toBe(0)
    expect(resolution.completed).toBe(false)
    expect(resolution.topic.completedAt).toBeNull()
  })

  it('resolves an attempt identically whether or not a lesson ever happened', () => {
    const topic: Topic = { ...morseTopic(), status: 'learning', learningAt: '2026-01-01T00:00:00.000Z' }
    const now = new Date('2026-02-01T00:00:00.000Z')
    const plain = resolveAttempt(topic, 20, 26, now)
    const taught = resolveAttempt(settleEverything(topic), 20, 26, now)

    expect(taught.to).toBe(plain.to)
    expect(taught.completed).toBe(plain.completed)
    expect(taught.topic.history).toEqual(plain.topic.history)
  })
})

describe('lesson progress as durable state', () => {
  it('records one support level per introduced item and nothing else', () => {
    const topic = morseTopic()
    const { run } = playLesson(topic, () => true)
    const store = lessonProgressOf(run)

    expect(Object.keys(store)).toHaveLength(2)
    for (const value of Object.values(store)) expect(value).toBe('settled')
  })

  it('records nothing for a character that has not been introduced yet', () => {
    const run = startLesson(morseTopic()) as LessonRun
    expect(lessonProgressOf(run)).toEqual({})
  })

  it('returns the same topic when nothing changed', () => {
    const topic = morseTopic()
    const once = withLessonProgress(topic, { [itemIdFor(topic, 'E')]: 'cued' })
    expect(withLessonProgress(once, { [itemIdFor(topic, 'E')]: 'cued' })).toBe(once)
  })

  it('drops progress for items an author has deleted', () => {
    const topic = morseTopic()
    const store: ItemLessonStore = {
      [itemIdFor(topic, 'E')]: 'settled',
      'deleted-item': 'cued',
    }
    expect(pruneLessonProgress(store, topic.items)).toEqual({ [itemIdFor(topic, 'E')]: 'settled' })
    expect(pruneLessonProgress(undefined, topic.items)).toEqual({})
  })

  it('degrades safely when an imported record has progress for only some of the packet', () => {
    // A returning character with no stored level is introduced rather than
    // assumed. Nothing crashes and nothing is silently skipped.
    const topic = withProgress(morseTopic(), { E: 'settled', I: 'settled', T: 'settled', A: 'settled' })
    const run = startLesson(topic) as LessonRun
    expect(run.packetIndex).toBe(2)
    const uninitiated = run.entries.filter((entry) => !entry.introduced).map((entry) => entry.glyph)
    expect(uninitiated).toEqual(['N', 'S'])
  })
})
