// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import { LibraryProvider } from '../lib/store'
import { SHIPPED_CATALOG_TOPIC_IDS } from '../lib/catalog'
import { journeyFor } from '../lib/journey'
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
} from '../lib/morseLesson'
import { COMPLETION_GAP_DAYS, resolveStudy } from '../lib/scheduling'
import { seedLibrary } from '../lib/seed'
import { parseLibrary } from '../lib/storage'
import type { Topic } from '../lib/types'
import { Today } from './today/Today'
import { Library } from './library/Library'
import { TopicPage } from './library/TopicPage'
import { Progress } from './progress/Progress'

/**
 * The surface-consistency contract (#62, #69, #70).
 *
 * The defect this suite exists to prevent is not a rendering bug. It is four
 * screens each reading raw status fields and reaching their own conclusion, so
 * one Morse topic could say `Continue lesson` on Topic, `Test` in Library and
 * `Ready to drill` on Today at the same instant, all of them internally
 * consistent and one learner state.
 *
 * Every test below therefore checks the same thing from four directions: for one
 * topic at one instant, what does each surface tell the learner to do? The
 * assertions are written against the shared derivation rather than against
 * hard-coded strings wherever the wording is the derivation's to choose, so
 * changing a label in one place cannot quietly make the surfaces disagree again.
 */

const STORE_KEY = 'argus.library.v5'
const MORSE_ID = 'international-morse-letters-printed'
const DAY = 86_400_000

function seeded(id: string): Topic {
  const parsed = parseLibrary(seedLibrary())
  if (!parsed.ok) throw new Error(parsed.error)
  const topic = parsed.library.topics.find((candidate) => candidate.id === id)
  if (!topic) throw new Error(`Missing seeded topic ${id}`)
  return topic
}

const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString()

/** Content only. Whatever learner state a scenario wants, it states itself. */
function blank(id: string, overrides: Partial<Topic> = {}): Topic {
  return {
    ...seeded(id),
    status: 'unstarted',
    drilledAt: null,
    learningAt: null,
    completedAt: null,
    lastTestedAt: null,
    spotCheckedAt: null,
    history: [],
    itemEvidence: {},
    lessonProgress: {},
    ...overrides,
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

function install(topics: Topic[]): void {
  localStorage.setItem(
    STORE_KEY,
    JSON.stringify({ version: 5, topics, catalogDelivered: [...SHIPPED_CATALOG_TOPIC_IDS] }),
  )
}

function renderToday() {
  return render(
    <LibraryProvider>
      <Today onStart={() => undefined} onGoToLibrary={() => undefined} />
    </LibraryProvider>,
  )
}

function renderLibrary() {
  return render(
    <LibraryProvider>
      <Library
        onStart={() => undefined}
        onOpenReference={() => undefined}
        onOpenTopic={() => undefined}
        onCloseTopic={() => undefined}
      />
    </LibraryProvider>,
  )
}

function renderTopicPage(topic: Topic) {
  return render(
    <TopicPage
      topic={topic}
      onBack={() => undefined}
      onStart={() => undefined}
      onOpenReference={() => undefined}
      onEdit={() => undefined}
      onDelete={() => undefined}
    />,
  )
}

function renderProgress() {
  return render(
    <LibraryProvider>
      <Progress />
    </LibraryProvider>,
  )
}

/** The row for one topic on a list surface, whichever list is on screen. */
function rowFor(title: string, scope: HTMLElement = document.body): HTMLElement {
  const heading = within(scope).getByText(title)
  const row = heading.closest('li')
  if (!row) throw new Error(`No row for ${title}`)
  return row
}

/** Progress shows a decayed topic twice on purpose: as work, and in the record. */
function progressWork(): HTMLElement {
  const work = document.createElement('div')
  for (const section of document.querySelectorAll('.progress-section')) {
    work.appendChild(section.cloneNode(true))
  }
  return work
}

/** What Today tells the learner to do with this topic. */
function todayVerb(topic: Topic): string {
  renderToday()
  const row = rowFor(topic.title)
  // The verb is the row's screen-reader prefix: the row *is* the control.
  const verb = row.querySelector('.sr-only')?.textContent ?? ''
  return verb.replace(/:\s*$/, '').trim()
}

function todaySchedule(topic: Topic): string {
  renderToday()
  return rowFor(topic.title).querySelector('.due-reason')?.textContent?.trim() ?? ''
}

/** What Library's action button says for this topic. */
function libraryVerb(topic: Topic): string {
  renderLibrary()
  return rowFor(topic.title).querySelector('.lib-action')?.textContent?.trim() ?? ''
}

function librarySchedule(topic: Topic): string {
  renderLibrary()
  return rowFor(topic.title).querySelector('.lib-when')?.textContent?.trim() ?? ''
}

/** Which shelf Library placed this topic on. */
function libraryShelf(topic: Topic): string {
  renderLibrary()
  const shelf = rowFor(topic.title).closest('section')
  return shelf?.querySelector('.lib-shelf-head')?.textContent?.replace(/\d+$/, '').trim() ?? ''
}

/** The Topic page's single primary action. */
function topicPrimary(topic: Topic): string {
  renderTopicPage(topic)
  const primary = document.querySelector('.mode-btn.is-primary .mode-name')
  return primary?.textContent?.trim() ?? ''
}

function topicSchedule(topic: Topic): string {
  renderTopicPage(topic)
  const terms = [...document.querySelectorAll('.topic-facts dt')]
  const schedule = terms.find((term) => term.textContent === 'Schedule')
  return schedule?.parentElement?.querySelector('dd')?.textContent?.trim() ?? ''
}

/** Which Progress section this topic landed in, and what it says there. */
function progressSection(topic: Topic): { heading: string; state: string } {
  renderProgress()
  // Scoped to the work sections: the permanent completion record deliberately
  // lists a decayed topic too, and that is not where its current state is said.
  const row = rowFor(topic.title, progressWork())
  const section = row.closest('section')
  return {
    heading: section?.querySelector('h2')?.textContent?.replace(/\d+$/, '').trim() ?? '',
    state: row.querySelector('.progress-state')?.textContent?.trim() ?? '',
  }
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('one learner state, four surfaces, one recommendation', () => {
  interface Scenario {
    name: string
    topic: () => Topic
    /** Where Library shelves it and Progress files it, for the same state. */
    shelf: string
    section: string
  }

  const scenarios: Scenario[] = [
    {
      name: 'a Morse topic nobody has opened',
      topic: () => blank(MORSE_ID),
      shelf: 'Due now',
      section: 'In progress',
    },
    {
      name: 'a Morse topic partway through acquisition',
      topic: () => acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 6 * DAY)), 4),
      shelf: 'Due now',
      section: 'In progress',
    },
    {
      name: 'a Morse topic that reached readiness today',
      topic: () => ({
        ...acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 40 * DAY)), 14),
        acquisitionReadyAt: ago(0),
      }),
      shelf: 'In progress',
      section: 'Waiting',
    },
    {
      name: 'a Morse topic ready and past its anchored gap',
      topic: () => ({
        ...acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 40 * DAY)), 14),
        acquisitionReadyAt: ago(3),
      }),
      shelf: 'Due now',
      section: 'In progress',
    },
    {
      name: 'an ordinary topic nobody has opened',
      topic: () => blank('cardinal-bearings'),
      shelf: 'Due now',
      section: 'In progress',
    },
    {
      name: 'an ordinary topic waiting out its delayed test',
      topic: () => blank('cardinal-bearings', { status: 'drilled', drilledAt: ago(4) }),
      shelf: 'In progress',
      section: 'Waiting',
    },
    {
      name: 'an ordinary topic ready for its delayed test',
      topic: () =>
        blank('cardinal-bearings', { status: 'drilled', drilledAt: ago(COMPLETION_GAP_DAYS + 1) }),
      shelf: 'Due now',
      section: 'In progress',
    },
    {
      name: 'a topic that decayed and needs repair',
      topic: () => blank('cardinal-bearings', { status: 'decayed', completedAt: ago(200) }),
      shelf: 'Due now',
      section: 'Repair',
    },
    {
      name: 'a completed topic waiting for its spot check',
      topic: () =>
        blank('cardinal-bearings', {
          status: 'completed',
          drilledAt: ago(80),
          completedAt: ago(20),
          lastTestedAt: ago(20),
        }),
      shelf: 'Completed',
      section: 'Waiting',
    },
  ]

  for (const scenario of scenarios) {
    it(`agrees about ${scenario.name}`, () => {
      const topic = scenario.topic()
      install([topic])
      const journey = journeyFor(topic)

      // The verb. Today and Library must both be the journey's own word, and
      // Topic's primary control must launch the same mode.
      expect(libraryVerb(topic)).toBe(journey.actionLabel)
      cleanup()
      expect(topicPrimary(topic)).toBe(journey.primaryLabel)
      cleanup()

      if (journey.due) {
        expect(todayVerb(topic)).toBe(journey.actionLabel)
        cleanup()
        expect(todaySchedule(topic)).toBe(journey.statusLabel)
        cleanup()
      }

      // The schedule line. One sentence about this topic, said the same way
      // wherever it appears.
      expect(librarySchedule(topic)).toBe(journey.statusLabel)
      cleanup()
      expect(topicSchedule(topic)).toBe(journey.statusLabel)
      cleanup()

      // Placement. A row on `Due now` whose button says nothing is doable, or a
      // topic filed under Waiting that Today is asking for, is the same defect.
      expect(libraryShelf(topic)).toBe(scenario.shelf)
      cleanup()
      const progress = progressSection(topic)
      expect(progress.heading).toBe(scenario.section)
      expect(progress.state).toBe(journey.statusLabel)
    })
  }
})

describe('partially acquired Morse is never routed to Test', () => {
  it('keeps every surface on the lesson after several sittings', () => {
    // The exact P0: opening Learn set the status to `learning`, and `learning`
    // used to mean "not unstarted, therefore Test".
    const partial = acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 6 * DAY)), 5)
    expect(partial.status).toBe('learning')
    expect(morseAcquisitionPosition(partial)?.ready).toBe(false)
    install([partial])

    expect(todayVerb(partial)).toBe('Continue Learn')
    cleanup()
    expect(libraryVerb(partial)).toBe('Continue Learn')
    cleanup()
    expect(topicPrimary(partial)).toBe('Continue lesson')
  })

  it('says Learn rather than Continue Learn before the first sitting', () => {
    const fresh = blank(MORSE_ID)
    install([fresh])

    expect(todayVerb(fresh)).toBe('Learn')
    cleanup()
    expect(libraryVerb(fresh)).toBe('Learn')
    cleanup()
    expect(topicPrimary(fresh)).toBe('Start lesson')
  })

  it('never offers Test as the lead action while acquisition is incomplete', () => {
    const partial = acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 6 * DAY)), 3)
    install([partial])

    renderToday()
    // Today's primary control is the lead group's button. With only an acquiring
    // topic due, it must be the lesson, and the generic `Test everything` batch
    // must not be reachable as the day's required action.
    const primary = document.querySelector('.today-go')
    expect(primary?.textContent).toContain('Learn')
    expect(primary?.textContent).not.toContain('Test')
    expect(document.body.textContent).not.toContain('Test everything')
  })

  it('offers Test on the Topic page only as an explicitly non-advancing option', () => {
    const partial = acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 6 * DAY)), 3)
    install([partial])
    renderTopicPage(partial)

    const secondary = [...document.querySelectorAll('.mode-btn')].find(
      (button) => !button.classList.contains('is-primary'),
    )
    expect(secondary?.querySelector('.mode-name')?.textContent).toBe('Test early')
    expect(secondary?.textContent).toContain('without moving the ladder')
  })

  it('shows acquisition progress as words, never as a retention gap bar', () => {
    const partial = acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 6 * DAY)), 4)
    install([partial])

    renderLibrary()
    const row = rowFor(partial.title)
    expect(row.querySelector('.lib-acquisition')?.textContent).toContain('letters settled')
    // The gap bar means retention, and this topic has not entered a gap.
    expect(row.querySelector('.lib-gap')).toBeNull()
    cleanup()

    renderProgress()
    expect(rowFor(partial.title).querySelector('.progress-gap')).toBeNull()
  })

  it('carries the active finite sitting through to the surfaces that show it', () => {
    const partial = acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 6 * DAY)), 2)
    const resumed: Topic = {
      ...partial,
      lessonSitting: { retrievals: 6, correct: 5, revisitItemIds: [partial.items[2].id as string] },
    }
    install([resumed])

    expect(todayVerb(resumed)).toBe('Continue Learn')
    cleanup()
    renderToday()
    expect(rowFor(resumed.title).textContent).toContain('6 of 10 retrievals this sitting')
    cleanup()
    renderTopicPage(resumed)
    expect(document.body.textContent).toContain('6 of 10 retrievals')
    // Plain terminology: the finite sitting is a retrieval budget, not a score.
    expect(document.body.textContent).not.toContain('XP')
  })
})

describe('acquisition readiness moves every surface together', () => {
  const ready = (): Topic => ({
    ...acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 40 * DAY)), 14),
    acquisitionReadyAt: ago(0),
  })

  it('switches the recommendation from lesson to Test at the same instant', () => {
    const topic = ready()
    install([topic])

    expect(libraryVerb(topic)).toBe('Test')
    cleanup()
    expect(topicPrimary(topic)).toBe('Test')
    cleanup()
    // The anchored one-day gap has not passed, so it is not today's work yet.
    // It still appears under `Coming up`, which is the honest place for it: an
    // early Test stays reachable, it simply is not what today asks for.
    renderToday()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Nothing due')
    expect(rowFor(topic.title).querySelector('.sr-only')?.textContent).toContain('Test')
  })

  it('starts the delayed-test clock at readiness rather than at first exposure', () => {
    const topic = ready()
    install([topic])

    // First exposure was forty days ago. Under the old rule the topic has read
    // `Ready to drill` for thirty-nine of them.
    expect(topic.learningAt).not.toBeNull()
    expect(librarySchedule(topic)).toBe('Test in 1 day')
    cleanup()
    expect(progressSection(topic)).toEqual({ heading: 'Waiting', state: 'Test in 1 day' })
  })

  it('becomes due once the anchored gap has actually passed', () => {
    const topic = { ...ready(), acquisitionReadyAt: ago(3) }
    install([topic])

    expect(todayVerb(topic)).toBe('Test')
    cleanup()
    expect(todaySchedule(topic)).toBe('Ready to test')
    cleanup()
    expect(libraryShelf(topic)).toBe('Due now')
  })
})

describe('Progress projects the journey rather than inventing a fourth reading', () => {
  it('separates live work, waiting, repair and the permanent record', () => {
    const topics = [
      acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 6 * DAY)), 3),
      blank('cardinal-bearings', { status: 'decayed', completedAt: ago(200) }),
      blank('primary-survey', { status: 'drilled', drilledAt: ago(4) }),
      blank('nato-phonetic', {
        status: 'completed',
        drilledAt: ago(80),
        completedAt: ago(20),
        lastTestedAt: ago(20),
      }),
    ]
    install(topics)
    renderProgress()

    const headings = [...document.querySelectorAll('.progress-section h2')].map((h) =>
      h.textContent?.replace(/\d+$/, '').trim(),
    )
    expect(headings).toEqual(['In progress', 'Waiting', 'Repair'])

    // Decay routes work without erasing history: the bearings topic is in
    // Repair *and* still holds its place in the permanent record.
    const record = document.querySelector('.record') as HTMLElement
    expect(within(record).getByText('Cardinal and intercardinal bearings')).toBeTruthy()
    expect(within(record).getByText('NATO phonetic alphabet')).toBeTruthy()
  })

  it('carries no streaks, badges, XP, leaderboard or single progress percentage', () => {
    install([
      acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 6 * DAY)), 3),
      blank('cardinal-bearings', { status: 'completed', drilledAt: ago(80), completedAt: ago(20) }),
    ])
    renderProgress()

    const text = document.body.textContent ?? ''
    for (const banned of ['streak', 'badge', 'XP', 'Level', 'leaderboard', 'points']) {
      expect(text.toLowerCase()).not.toContain(banned.toLowerCase())
    }
    // No aggregate percentage: acquisition, retention and completion are
    // different measurements and averaging them would say nothing true.
    expect(text).not.toMatch(/\d+%/)
    expect(document.querySelector('.stat-strip')).toBeNull()
  })

  it('shows a fresh install no achievements at all', () => {
    // No stored library: the first-run delivery path.
    renderProgress()

    expect(document.body.textContent).toContain('No completions yet')
    expect(document.querySelector('.record')).toBeNull()
    const headings = [...document.querySelectorAll('.progress-section h2')].map((h) =>
      h.textContent?.replace(/\d+$/, '').trim(),
    )
    expect(headings).toEqual(['In progress'])
    // Every shipped topic, and every one of them not started.
    expect(document.querySelectorAll('.progress-list li')).toHaveLength(
      SHIPPED_CATALOG_TOPIC_IDS.length,
    )
    for (const state of document.querySelectorAll('.progress-state')) {
      expect(state.textContent).toBe('Not started')
    }
  })
})

describe('ordinary topics keep the behaviour they had', () => {
  it('reads an unstarted topic, then proves it, on every surface alike', () => {
    const fresh = blank('primary-survey')
    install([fresh])

    expect(todayVerb(fresh)).toBe('Learn')
    cleanup()
    expect(libraryVerb(fresh)).toBe('Learn')
    cleanup()
    expect(topicPrimary(fresh)).toBe('Learn')
    cleanup()

    const exposed = resolveStudy(fresh, new Date(Date.now() - 2 * DAY))
    install([exposed])
    expect(todayVerb(exposed)).toBe('Test')
    cleanup()
    expect(todaySchedule(exposed)).toBe('Ready to drill')
    cleanup()
    expect(libraryVerb(exposed)).toBe('Test')
    cleanup()
    expect(topicPrimary(exposed)).toBe('Test')
  })

  it('treats a topic with no items as authoring rather than learner progress', () => {
    // The v5 storage boundary refuses a topic with no items, so this state only
    // ever exists in memory between authoring the title and adding the rows.
    // The journey and the Topic page are therefore where it has to be right.
    const empty = blank('cardinal-bearings', { items: [] })
    const journey = journeyFor(empty)

    expect(journey.phase).toBe('authoring')
    expect(journey.actionLabel).toBe('Add items')
    expect(journey.due).toBe(false)
    expect(journey.advancementEligible).toBe(false)

    renderTopicPage(empty)
    expect(document.querySelector('.mode-choice')).toBeNull()
    expect(document.body.textContent).toContain('no items yet')
    expect(screen.getByRole('button', { name: 'Add items' })).toBeTruthy()
  })
})
