import { describe, expect, it } from 'vitest'
import {
  dueEntries,
  journeyFor,
  journeyShelves,
  journeysFor,
  retentionAnchor,
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
} from './morseLesson'
import { COMPLETION_GAP_DAYS, resolveAttempt, resolveStudy } from './scheduling'
import { parseLibrary } from './storage'
import { seedLibrary } from './seed'
import type { Topic } from './types'

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
  it('sends a fresh Morse topic to Learn, and calls it starting rather than continuing', () => {
    const journey = journeyFor(freshMorse(), NOW)

    expect(journey.phase).toBe('acquiring')
    expect(journey.action).toBe('learn')
    expect(journey.actionLabel).toBe('Learn')
    expect(journey.primaryLabel).toBe('Start lesson')
    expect(journey.acquisition.progressive).toBe(true)
    expect(journey.acquisition.started).toBe(false)
    expect(journey.acquisition.ready).toBe(false)
    expect(journey.acquisition.settled).toBe(0)
    expect(journey.acquisition.total).toBe(26)
    expect(journey.due).toBe(true)
    expect(journey.advancementEligible).toBe(false)
  })

  it('keeps saying Continue Learn after a sitting or two, not Test', () => {
    // This is the exact P0 defect: opening Learn sets status to `learning`, and
    // the old rule read `learning` as "everything else, so Test".
    const partial = acquire(resolveStudy(freshMorse(), new Date(NOW.getTime() - 3 * DAY)), 4)
    expect(partial.status).toBe('learning')

    const journey = journeyFor(partial, NOW)
    expect(journey.phase).toBe('acquiring')
    expect(journey.action).toBe('learn')
    expect(journey.actionLabel).toBe('Continue Learn')
    expect(journey.primaryLabel).toBe('Continue lesson')
    expect(journey.acquisition.started).toBe(true)
    expect(journey.acquisition.ready).toBe(false)
    expect(journey.acquisition.settled).toBeGreaterThan(0)
    expect(journey.acquisition.settled).toBeLessThan(26)
    expect(journey.detail).toContain('letters settled')
    expect(journey.detail).toContain(`packet ${journey.acquisition.packet} of 13`)
  })

  it('reports the active finite sitting alongside acquisition, without conflating them', () => {
    const partial = acquire(resolveStudy(freshMorse(), ago(3) ? new Date(NOW.getTime() - 3 * DAY) : NOW), 2)
    const resumed: Topic = {
      ...partial,
      lessonSitting: { retrievals: 6, correct: 5, revisitItemIds: [partial.items[3].id as string] },
    }

    const journey = journeyFor(resumed, NOW)
    expect(journey.sitting).toEqual({
      retrievals: 6,
      target: 10,
      correct: 5,
      revisit: 1,
      active: true,
      listeningSuppressed: false,
    })
    expect(journey.detail).toContain('6 of 10 retrievals this sitting')
    // The sitting is not retention and not acquisition. It moves neither.
    expect(journey.retention.status).toBe('learning')
    expect(journey.acquisition.ready).toBe(false)
    expect(journey.advancementEligible).toBe(false)
  })

  it('switches to Test the moment acquisition reaches its endpoint', () => {
    const ready = withAcquisitionReadiness(acquiredMorse(), NOW)

    const journey = journeyFor(ready, NOW)
    expect(journey.acquisition.ready).toBe(true)
    expect(journey.acquisition.settled).toBe(26)
    expect(journey.action).toBe('test')
    expect(journey.actionLabel).toBe('Test')
    expect(journey.advancementEligible).toBe(true)
    expect(journey.detail).toBe('26 of 26 letters settled in Learn')
  })

  it('keeps readiness permanent once earned, so a later lesson miss cannot undo it', () => {
    const ready = withAcquisitionReadiness(acquiredMorse(), NOW)
    // A miss in a later lesson legitimately restores that letter's support.
    const slipped = withLessonProgress(ready, { [ready.items[0].id as string]: 'cued' })

    expect(morseAcquisitionPosition(slipped)?.ready).toBe(false)
    // ...but the learner did produce all 26 unaided, and that is a fact.
    expect(journeyFor(slipped, NOW).acquisition.ready).toBe(true)
    expect(journeyFor(slipped, NOW).action).toBe('test')
    expect(withAcquisitionReadiness(slipped, NOW).acquisitionReadyAt).toBe(ready.acquisitionReadyAt)
  })
})

describe('the retention clock is anchored at readiness, not at first exposure', () => {
  it('does not run the learning gap while acquisition is still in progress', () => {
    // Forty days of lessons. Under the old rule the one-day gap expired on day
    // two and the topic has read "Ready to drill" ever since.
    const partial = acquire(resolveStudy(freshMorse(), new Date(NOW.getTime() - 40 * DAY)), 3)

    const journey = journeyFor(partial, NOW)
    expect(retentionAnchor(partial, journey.acquisition)).toBeNull()
    expect(journey.retention.gated).toBe(true)
    expect(journey.retention.label).toBe('Not yet drilling')
    expect(journey.statusLabel).toBe('Lesson in progress')
    expect(journey.action).toBe('learn')
  })

  it('starts the qualifying gap from the readiness anchor', () => {
    const ready: Topic = {
      ...acquiredMorse(),
      learningAt: ago(40),
      acquisitionReadyAt: ago(0),
    }

    // Ready today: the one-day gap has not passed, so Test is the action but
    // not yet the due work.
    const today = journeyFor(ready, NOW)
    expect(today.action).toBe('test')
    expect(today.due).toBe(false)
    expect(today.phase).toBe('waiting')
    expect(today.statusLabel).toBe('Test in 1 day')

    const tomorrow = journeyFor(ready, new Date(NOW.getTime() + DAY))
    expect(tomorrow.due).toBe(true)
    expect(tomorrow.phase).toBe('due')
    expect(tomorrow.statusLabel).toBe('Ready to test')
  })

  it('falls back to learningAt for a record written before the anchor existed', () => {
    const legacy: Topic = { ...acquiredMorse(), learningAt: ago(40) }
    expect(legacy.acquisitionReadyAt).toBeUndefined()

    const journey = journeyFor(legacy, NOW)
    // Never stricter than the behaviour that learner already had.
    expect(retentionAnchor(legacy, journey.acquisition)).toBe(ago(40))
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
    const journey = journeyFor(partial, NOW)
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
      drilledAt: ago(COMPLETION_GAP_DAYS + 1),
      lastTestedAt: ago(COMPLETION_GAP_DAYS + 1),
    }

    const journey = journeyFor(drilled, NOW)
    expect(journey.acquisition.ready).toBe(false)
    expect(journey.advancementEligible).toBe(true)
    expect(journey.action).toBe('test')
    expect(journey.due).toBe(true)
    expect(journey.statusLabel).toBe('Ready for the delayed test')
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

    const journey = journeyFor(completed, NOW)
    expect(journey.action).toBe('test')
    expect(journey.phase).toBe('waiting')
    expect(journey.advancementEligible).toBe(true)
    expect(journey.statusLabel).toContain('Spot check in')
  })
})

describe('ordinary topics keep exactly the behaviour they had', () => {
  it('routes an unstarted ordinary topic to Learn, then to Test', () => {
    const bearings = { ...seeded('cardinal-bearings'), status: 'unstarted' as const, completedAt: null, history: [] }

    const fresh = journeyFor(bearings, NOW)
    expect(fresh.acquisition.progressive).toBe(false)
    expect(fresh.action).toBe('learn')
    expect(fresh.actionLabel).toBe('Learn')
    expect(fresh.primaryLabel).toBe('Learn')
    expect(fresh.statusLabel).toBe('Not started')
    expect(fresh.due).toBe(true)
    // An ordinary Learn is one exposure, so it is advancement-eligible at once.
    expect(fresh.advancementEligible).toBe(true)

    const exposed = resolveStudy(bearings, NOW)
    const sameDay = journeyFor(exposed, NOW)
    expect(sameDay.action).toBe('test')
    expect(sameDay.statusLabel).toBe('Drilled today')
    expect(sameDay.due).toBe(false)

    const nextDay = journeyFor(exposed, new Date(NOW.getTime() + DAY))
    expect(nextDay.due).toBe(true)
    expect(nextDay.statusLabel).toBe('Ready to drill')
    expect(nextDay.advancementEligible).toBe(true)
  })

  it('keeps the scheduler wording for drilled, repair and completed topics', () => {
    const base = seeded('cardinal-bearings')
    const drilled = journeyFor({ ...base, status: 'drilled', drilledAt: ago(4), completedAt: null }, NOW)
    expect(drilled.statusLabel).toBe(`Delayed test in ${COMPLETION_GAP_DAYS - 4} days`)
    expect(drilled.phase).toBe('waiting')
    expect(drilled.retention.gapProgress).toBeGreaterThan(0)

    const repair = journeyFor({ ...base, status: 'decayed', completedAt: ago(200) }, NOW)
    expect(repair.phase).toBe('repair')
    expect(repair.statusLabel).toBe('Needs repair')
    expect(repair.due).toBe(true)
    expect(repair.action).toBe('test')
  })

  it('holds a topic with no items apart as an authoring job', () => {
    const empty: Topic = { ...seeded('cardinal-bearings'), items: [], status: 'unstarted' }

    const journey = journeyFor(empty, NOW)
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
    const journey = journeyFor(morse, NOW)

    expect(journey.evidence.bidirectional).toBe(true)
    expect(journey.evidence.total).toBe(26)
    // Every letter settled in Learn, and no formal evidence whatsoever. That
    // separation is the whole point: Learn cannot testify for Test.
    expect(journey.acquisition.settled).toBe(26)
    expect(journey.evidence.covered).toBe(0)
    expect(journey.evidence.complete).toBe(false)
  })

  it('does not claim bidirectional evidence for an ordinary forward deck', () => {
    const journey = journeyFor(seeded('cardinal-bearings'), NOW)
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
    const entries = journeysFor(topics(), NOW)
    const due = dueEntries(entries)

    expect(due[0].topic.id).toBe('cardinal-bearings')
    expect(due.map((entry) => entry.topic.id)).toContain(MORSE_ID)
    // The topic with no items is authoring, never due work.
    expect(due.map((entry) => entry.topic.id)).not.toContain('ooda-loop')
  })

  it('places every topic on the shelf its own action agrees with', () => {
    const shelves = journeyShelves(journeysFor(topics(), NOW))
    const shelfOf = (id: string) => shelves.find((shelf) => shelf.entries.some((e) => e.topic.id === id))?.id

    expect(shelfOf('cardinal-bearings')).toBe('due')
    expect(shelfOf(MORSE_ID)).toBe('due')
    expect(shelfOf('primary-survey')).toBe('active')
    expect(shelfOf('ooda-loop')).toBe('unfinished')

    // Nothing appears twice, and every topic appears once.
    const placed = shelves.flatMap((shelf) => shelf.entries.map((entry) => entry.topic.id))
    expect(new Set(placed).size).toBe(placed.length)
    expect(placed).toHaveLength(4)
  })
})
