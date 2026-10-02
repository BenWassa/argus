import { describe, expect, it } from 'vitest'
import {
  dueEntries,
  journeyFor,
  journeyShelves,
  journeysFor,
  withAcquisitionReadiness,
} from './journey'
import {
  advanceLesson,
  answerLesson,
  currentStep,
  introduceLesson,
  lessonProgressOf,
  morseAcquisitionPosition,
  startLesson,
  withLessonProgress,
  type LessonRun,
} from '../morse/curriculum/lesson'
import { resolveAttempt, resolveStudy } from './scheduling'
import { parseLibrary } from '../../infrastructure/persistence/libraryParser'
import { seedLibrary } from '../library/catalogSeed'
import type { Topic } from '../library/topic'

const MORSE_ID = 'international-morse-letters-printed'
const DAY = 86_400_000

const NOW = new Date('2026-09-06T12:00:00.000Z')
const ago = (days: number) => new Date(NOW.getTime() - days * DAY).toISOString()

function seeded(id: string): Topic {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  const topic = parsed.library.topics.find((candidate) => candidate.id === id)
  if (!topic) throw new Error(`Missing seeded topic ${id}`)
  return topic
}

/** A fresh Morse topic: the shipped content with no learner state on it at all. */
function freshMorse(): Topic {
  return {
    ...seeded(MORSE_ID),
    status: 'unstarted',
    createdAt: ago(0),
    drilledAt: null,
    learningAt: null,
    completedAt: null,
    lastTestedAt: null,
    spotCheckedAt: null,
    history: [],
    itemEvidence: {},
    lessonProgress: {},
  }
}

/** Play the guided lesson honestly through `packets` packets. */
function acquire(topic: Topic, packets: number): Topic {
  let current = topic
  for (let packet = 0; packet < packets; packet += 1) {
    let run = startLesson(current) as LessonRun
    if (!run || run.finished) break
    for (let guard = 0; guard < 200 && !run.complete; guard += 1) {
      const step = currentStep(run)
      if (!step) break
      run =
        step.kind === 'introduce'
          ? introduceLesson(run, step.entry.itemId)
          : advanceLesson(answerLesson(run, step.entry.itemId, step.entry.pattern))
    }
    current = withLessonProgress(current, lessonProgressOf(run))
  }
  return current
}

/** Every packet settled: the acquisition endpoint the programme defines. */
function acquiredMorse(): Topic {
  const acquired = acquire(resolveStudy(freshMorse(), new Date(NOW.getTime() - 40 * DAY)), 14)
  const position = morseAcquisitionPosition(acquired)
  if (!position?.ready) throw new Error('Expected the lesson to reach its endpoint.')
  return acquired
}

describe('progressive acquisition routes the learner to Learn until it is ready', () => {
  it('sends a fresh Morse topic to its lesson, and calls it starting rather than continuing', () => {
    const journey = journeyFor(freshMorse())

    expect(journey.phase).toBe('acquiring')
    expect(journey.action).toBe('learn')
    expect(journey.actionLabel).toBe('Start lesson')
    expect(journey.primaryLabel).toBe('Start lesson 1')
    expect(journey.acquisition.progressive).toBe(true)
    expect(journey.acquisition.started).toBe(false)
    expect(journey.acquisition.ready).toBe(false)
    expect(journey.acquisition.settled).toBe(0)
    expect(journey.acquisition.total).toBe(26)
    expect(journey.due).toBe(true)
    expect(journey.advancementEligible).toBe(false)
  })

  it('keeps saying Continue after a sitting or two, not Test', () => {
    // This is the exact P0 defect: opening Learn sets status to `learning`, and
    // the old rule read `learning` as "everything else, so Test".
    const partial = acquire(resolveStudy(freshMorse(), new Date(NOW.getTime() - 3 * DAY)), 4)
    expect(partial.status).toBe('learning')

    const journey = journeyFor(partial)
    expect(journey.phase).toBe('acquiring')
    expect(journey.action).toBe('learn')
    expect(journey.actionLabel).toBe('Continue')
    expect(journey.primaryLabel).toBe(`Continue lesson ${journey.acquisition.packet}`)
    expect(journey.acquisition.started).toBe(true)
    expect(journey.acquisition.ready).toBe(false)
    expect(journey.acquisition.settled).toBeGreaterThan(0)
    expect(journey.acquisition.settled).toBeLessThan(26)
    expect(journey.detail).toContain('letters')
    expect(journey.detail).toContain(`lesson ${journey.acquisition.packet} of 13`)
  })

  it('reports the active finite sitting alongside acquisition, without conflating them', () => {
    const partial = acquire(resolveStudy(freshMorse(), ago(3) ? new Date(NOW.getTime() - 3 * DAY) : NOW), 2)
    const resumed: Topic = {
      ...partial,
      lessonSitting: { retrievals: 6, correct: 5, revisitItemIds: [partial.items[3].id as string] },
    }

    const journey = journeyFor(resumed)
    expect(journey.sitting).toEqual({
      retrievals: 6,
      target: 10,
      correct: 5,
      revisit: 1,
      active: true,
      listeningSuppressed: false,
    })
    expect(journey.detail).toContain('6 retrievals this sitting')
    // The sitting is not retention and not acquisition. It moves neither.
    expect(journey.retention.status).toBe('learning')
    expect(journey.acquisition.ready).toBe(false)
    expect(journey.advancementEligible).toBe(false)
  })

  it('switches to Test the moment acquisition reaches its endpoint', () => {
    const ready = withAcquisitionReadiness(acquiredMorse(), NOW)

    const journey = journeyFor(ready)
    expect(journey.acquisition.ready).toBe(true)
    expect(journey.acquisition.settled).toBe(26)
    expect(journey.action).toBe('test')
    expect(journey.actionLabel).toBe('Test')
    expect(journey.advancementEligible).toBe(true)
    expect(journey.detail).toBe('26 of 26 letters')
  })

  it('keeps readiness permanent once earned, so a later lesson miss cannot undo it', () => {
    const ready = withAcquisitionReadiness(acquiredMorse(), NOW)
    // A miss in a later lesson legitimately restores that letter's support.
    const slipped = withLessonProgress(ready, { [ready.items[0].id as string]: 'cued' })

    expect(morseAcquisitionPosition(slipped)?.ready).toBe(false)
    // ...but the learner did produce all 26 unaided, and that is a fact.
    expect(journeyFor(slipped).acquisition.ready).toBe(true)
    expect(journeyFor(slipped).action).toBe('test')
    expect(withAcquisitionReadiness(slipped, NOW).acquisitionReadyAt).toBe(ready.acquisitionReadyAt)
  })
})

describe('acquisition gates the ladder, and no clock does', () => {
  it('keeps a curriculum in its lessons while acquisition is still in progress', () => {
    // Forty days of lessons. Elapsed time alone never makes it a Test.
    const partial = acquire(resolveStudy(freshMorse(), new Date(NOW.getTime() - 40 * DAY)), 3)

    const journey = journeyFor(partial)
    expect(journey.retention.gated).toBe(true)
    expect(journey.retention.label).toBe('Not yet drilling')
    expect(journey.statusLabel).toBe('Lesson in progress')
    expect(journey.action).toBe('learn')
  })

  it('offers the Test as soon as acquisition is ready', () => {
    const ready: Topic = {
      ...acquiredMorse(),
      learningAt: ago(40),
      acquisitionReadyAt: ago(0),
    }

    // Ready today, and there is nothing to wait for.
    const today = journeyFor(ready)
    expect(today.action).toBe('test')
    expect(today.due).toBe(true)
    expect(today.phase).toBe('due')
    expect(today.statusLabel).toBe('Ready to test')

    const tomorrow = journeyFor(ready)
    expect(tomorrow.due).toBe(true)
    expect(tomorrow.phase).toBe('due')
    expect(tomorrow.statusLabel).toBe('Ready to test')
  })

  it('treats a record written before the readiness anchor existed the same way', () => {
    const legacy: Topic = { ...acquiredMorse(), learningAt: ago(40) }
    expect(legacy.acquisitionReadyAt).toBeUndefined()

    const journey = journeyFor(legacy)
    expect(journey.due).toBe(true)
    expect(journey.action).toBe('test')
  })

  it('stamps the anchor in the same write as the answer that earned it', () => {
    const nearlyThere = acquire(resolveStudy(freshMorse(), new Date(NOW.getTime() - 40 * DAY)), 12)
    expect(morseAcquisitionPosition(nearlyThere)?.ready).toBe(false)
    expect(withAcquisitionReadiness(nearlyThere, NOW).acquisitionReadyAt).toBeUndefined()

    const finished = withAcquisitionReadiness(acquire(nearlyThere, 3), NOW)
    expect(finished.acquisitionReadyAt).toBe(NOW.toISOString())
  })
})

describe('an ineligible Test is recorded and moves nothing', () => {
  it('cannot drill a topic whose acquisition is incomplete', () => {
    const partial = acquire(resolveStudy(freshMorse(), new Date(NOW.getTime() - 5 * DAY)), 2)
    const journey = journeyFor(partial)
    expect(journey.advancementEligible).toBe(false)

    const resolution = resolveAttempt(partial, 26, 26, NOW, {
      advancementEligible: journey.advancementEligible,
    })

    expect(resolution.to).toBe('learning')
    expect(resolution.topic.status).toBe('learning')
    expect(resolution.topic.drilledAt).toBeNull()
    expect(resolution.completed).toBe(false)
    // Recorded, though: the run happened and the learner should see it.
    expect(resolution.topic.history).toHaveLength(1)
    expect(resolution.topic.lastTestedAt).toBe(NOW.toISOString())
    // ...and it does not demote either. Withholding a pass is not a failure.
    expect(resolution.topic.learningAt).toBe(partial.learningAt)
  })

  it('leaves the learning clock exactly where it was, in either direction', () => {
    const partial = acquire(resolveStudy(freshMorse(), new Date(NOW.getTime() - 5 * DAY)), 2)
    const failed = resolveAttempt(partial, 0, 26, NOW, { advancementEligible: false })

    expect(failed.topic.status).toBe('learning')
    expect(failed.topic.learningAt).toBe(partial.learningAt)
    expect(failed.topic.history).toHaveLength(1)
  })

  it('never gates a topic that already holds real retention evidence', () => {
    // An existing learner who drilled printed Morse before the lesson shipped.
    // Retention evidence outranks lesson scaffolding; they are not sent back to
    // packet 1, and their completion is not put at risk.
    const drilled: Topic = {
      ...freshMorse(),
      status: 'drilled',
      learningAt: ago(60),
      drilledAt: ago(1),
      lastTestedAt: ago(1),
    }

    const journey = journeyFor(drilled)
    expect(journey.acquisition.ready).toBe(false)
    expect(journey.advancementEligible).toBe(true)
    expect(journey.action).toBe('test')
    expect(journey.due).toBe(false)
    expect(journey.retention.status).toBe('completed')
    expect(drilled.status).toBe('drilled')
    expect(journey.statusLabel).toBe('Banked')
  })

  it('never gates a completed topic back into acquisition', () => {
    const completed: Topic = {
      ...freshMorse(),
      status: 'completed',
      learningAt: ago(200),
      drilledAt: ago(150),
      completedAt: ago(30),
      lastTestedAt: ago(30),
    }

    const journey = journeyFor(completed)
    expect(journey.action).toBe('test')
    expect(journey.phase).toBe('banked')
    expect(journey.due).toBe(false)
    expect(journey.advancementEligible).toBe(true)
    expect(journey.statusLabel).toBe('Banked')
  })
})

describe('ordinary topics separate browsing from deliberate enrollment', () => {
  it('keeps a fresh ordinary topic unenrolled until Start, then preserves Test scheduling', () => {
    const bearings = { ...seeded('cardinal-bearings'), status: 'unstarted' as const, completedAt: null, history: [] }

    const fresh = journeyFor(bearings)
    expect(fresh.acquisition.progressive).toBe(false)
    expect(fresh.action).toBe('test')
    expect(fresh.actionLabel).toBe('Test')
    expect(fresh.primaryLabel).toBe('Test')
    expect(fresh.statusLabel).toBe('Not tested yet')
    expect(fresh.detail).toBeNull()
    expect(fresh.due).toBe(true)
    expect(fresh.advancementEligible).toBe(true)

    // Explicit enrollment changes only the scheduler-owned learning state. It
    // invents no attempt, score or formal evidence.
    const enrolled = resolveStudy(bearings, NOW)
    expect(enrolled.status).toBe('learning')
    expect(enrolled.learningAt).toBe(NOW.toISOString())
    expect(enrolled.history).toEqual([])
    expect(enrolled.itemEvidence).toEqual(bearings.itemEvidence)

    const sameDay = journeyFor(enrolled)
    expect(sameDay.action).toBe('test')
    expect(sameDay.statusLabel).toBe('Ready to test')
    expect(sameDay.due).toBe(true)

    const nextDay = journeyFor(enrolled)
    expect(nextDay.due).toBe(true)
    expect(nextDay.statusLabel).toBe('Ready to test')
    expect(nextDay.advancementEligible).toBe(true)
  })

  it('keeps the scheduler wording for drilled, repair and completed topics', () => {
    const base = seeded('cardinal-bearings')
    const drilled = journeyFor({ ...base, status: 'drilled', drilledAt: ago(4), completedAt: null })
    expect(drilled.statusLabel).toBe('Banked')
    expect(drilled.phase).toBe('banked')

    const repair = journeyFor({ ...base, status: 'decayed', completedAt: ago(200) })
    expect(repair.phase).toBe('repair')
    expect(repair.statusLabel).toBe('Needs repair')
    expect(repair.due).toBe(true)
    expect(repair.action).toBe('test')
  })

  it('holds a topic with no items apart as an authoring job', () => {
    const empty: Topic = { ...seeded('cardinal-bearings'), items: [], status: 'unstarted' }

    const journey = journeyFor(empty)
    expect(journey.phase).toBe('authoring')
    expect(journey.action).toBe('author')
    expect(journey.actionLabel).toBe('Add items')
    expect(journey.due).toBe(false)
    expect(journey.advancementEligible).toBe(false)
  })
})

describe('formal evidence stays its own dimension', () => {
  it('reports directional coverage separately from acquisition and retention', () => {
    const morse = acquiredMorse()
    const journey = journeyFor(morse)

    expect(journey.evidence.bidirectional).toBe(true)
    expect(journey.evidence.total).toBe(26)
    // Every letter settled in Learn, and no formal evidence whatsoever. That
    // separation is the whole point: Learn cannot testify for Test.
    expect(journey.acquisition.settled).toBe(26)
    expect(journey.evidence.covered).toBe(0)
    expect(journey.evidence.complete).toBe(false)
  })

  it('does not claim bidirectional evidence for an ordinary forward deck', () => {
    const journey = journeyFor(seeded('cardinal-bearings'))
    expect(journey.evidence.bidirectional).toBe(false)
  })
})

describe('the day and the shelves read from the same derivation', () => {
  const topics = (): Topic[] => [
    freshMorse(),
    { ...seeded('cardinal-bearings'), status: 'decayed', completedAt: ago(200) },
    { ...seeded('primary-survey'), status: 'drilled', drilledAt: ago(2), completedAt: null },
    { ...seeded('ooda-loop'), items: [], status: 'unstarted' },
  ]

  it('ranks repair first and puts acquisition work on the due shelf', () => {
    const entries = journeysFor(topics())
    const due = dueEntries(entries)

    expect(due[0].topic.id).toBe('cardinal-bearings')
    expect(due.map((entry) => entry.topic.id)).toContain(MORSE_ID)
    // The topic with no items is authoring, never due work.
    expect(due.map((entry) => entry.topic.id)).not.toContain('ooda-loop')
  })

  it('places every topic on the shelf its own action agrees with', () => {
    const shelves = journeyShelves(journeysFor(topics()))
    const shelfOf = (id: string) => shelves.find((shelf) => shelf.entries.some((e) => e.topic.id === id))?.id

    expect(shelfOf('cardinal-bearings')).toBe('due')
    expect(shelfOf(MORSE_ID)).toBe('due')
    expect(shelfOf('primary-survey')).toBe('banked')
    expect(shelfOf('ooda-loop')).toBe('unfinished')

    // Nothing appears twice, and every topic appears once.
    const placed = shelves.flatMap((shelf) => shelf.entries.map((entry) => entry.topic.id))
    expect(new Set(placed).size).toBe(placed.length)
    expect(placed).toHaveLength(4)
  })
})
