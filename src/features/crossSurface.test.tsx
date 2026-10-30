import { curriculumFor } from '../domain/learning/generatedCurriculum'
// @vitest-environment jsdom
import { homeProgress } from '../domain/study/home'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { LibraryProvider } from '../services/library/LibraryProvider'
import { SHIPPED_CATALOG_TOPIC_IDS } from '../domain/library/catalog'
import { journeyFor } from '../domain/study/journey'
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
} from '../domain/morse/curriculum/lesson'
import { resolveStudy } from '../domain/study/scheduling'
import { seedLibrary } from '../domain/library/catalogSeed'
import { parseLibrary } from '../infrastructure/persistence/libraryParser'
import type { Topic } from '../domain/library/topic'
import { Today } from './today/Today'
import { LibraryPage } from './library/LibraryPage'
import { TopicPage } from './library/TopicPage'
import { TopicReading } from './learn/TopicReading'

/**
 * The surface-consistency contract (#62, #69, #70).
 *
 * Three surfaces now rather than four: Progress was a third projection of this
 * same derivation, and its live sections are Library's shelves while its
 * permanent record closes Library. Removing a destination must not weaken the
 * contract, so every assertion it carried is still made here against the surface
 * that absorbed it.
 *
 * The defect this suite exists to prevent is not a rendering bug. It is screens
 * each reading raw status fields and reaching their own conclusion, so
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

function renderToday(onOpenTopic: (topicId: string) => void = () => undefined) {
  return render(
    <LibraryProvider>
      <Today
        onOpenTopic={onOpenTopic}
        onGoToLibrary={() => undefined}
        onAuthorTopic={() => undefined}
        onOpenProfile={() => undefined}
      />
    </LibraryProvider>,
  )
}

describe('Today utility entry points', () => {
  it('keeps Profile reachable without adding a primary navigation destination', () => {
    renderToday()
    expect(screen.getByRole('button', { name: 'Open profile' })).toBeTruthy()
  })
})

function renderLibrary() {
  return render(
    <LibraryProvider>
      <LibraryPage
        onStart={() => undefined}
        onReference={() => undefined}
        onOpenTopic={() => undefined}
        onCloseTopic={() => undefined}
      />
    </LibraryProvider>,
  )
}

function renderTopicPage(topic: Topic) {
  return render(
    <LibraryProvider>
      <TopicPage
        topic={topic}
        onBack={() => undefined}
        onStart={() => undefined}
        onReference={() => undefined}
        onEdit={() => undefined}
      />
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


/** The docket alone. Today's primary action now names its topic too, and the
 *  docket is where the per-topic verdict is said. */
function todayDocket(): HTMLElement {
  const docket = document.querySelector('.docket')
  if (!docket) throw new Error('Today rendered no docket')
  return docket as HTMLElement
}

/**
 * Which topic pressing this topic's Today plate opens. Today names no action of
 * its own: every plate opens its topic, the same page a Library plate opens, and
 * the topic page is where the action is chosen.
 */
function todayOpens(topic: Topic): string | null {
  let opened: string | null = null
  renderToday((topicId) => {
    opened = topicId
  })
  fireEvent.click(within(rowFor(topic.title, todayDocket())).getByRole('button'))
  return opened
}

/** Whether Today shows this topic at all. It holds only topics in motion. */
function onToday(topic: Topic): boolean {
  renderToday()
  const docket = document.querySelector('.docket')
  return !!docket && within(docket as HTMLElement).queryByText(topic.title) !== null
}

function todaySchedule(topic: Topic): string {
  renderToday()
  return rowFor(topic.title, todayDocket()).querySelector('.home-topic-reading')?.textContent?.trim() ?? ''
}

/**
 * Which Library group holds this topic. Library no longer carries a verb or a
 * schedule of its own — the row only opens the topic — so the one thing it can
 * disagree with the other surfaces about is whether the learner has started.
 */
function libraryGroup(topic: Topic): string {
  renderLibrary()
  const row = rowFor(topic.title)
  // A row opens its topic and nothing else: no second control to disagree.
  expect(row.querySelectorAll('button')).toHaveLength(1)
  const group = row.closest('section')
  return group?.querySelector('.lib-group-head')?.textContent?.trim() ?? ''
}

/** The Topic page's single primary action. There is only ever one. */
function topicPrimary(topic: Topic): string {
  renderTopicPage(topic)
  if (curriculumFor(topic)) return document.querySelector('.topic-tray .mode-tray-label')?.textContent?.trim() ?? ''
  const current = document.querySelector('[aria-current="step"]')
  if (current) {
    const label = current.getAttribute('aria-label') ?? ''
    if (label === 'Begin, current') return 'Start lesson 1'
    const lesson = /, Lesson (\d+),/.exec(label)
    if (lesson) return `Continue lesson ${lesson[1]}`
    return current.classList.contains('morse-progress-test') ? 'Test' : label
  }
  return topicTestLabel()
}

function topicTestLabel(): string {
  return document.querySelector('.topic-tray [data-tile-id="test"] .mode-tray-label')?.textContent?.trim() ?? ''
}

function topicSchedule(topic: Topic): string {
  renderTopicPage(topic)
  return document.querySelector('.topic-state-label')?.textContent?.trim() || document.querySelector('.screen-header-readout')?.textContent?.trim() || ''
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('one learner state, three surfaces, one recommendation', () => {
  interface Scenario {
    name: string
    topic: () => Topic
    /** Which Library group holds it, for that same state. */
    group: 'Started' | 'Not started'
  }

  const scenarios: Scenario[] = [
    {
      name: 'a Morse topic nobody has opened',
      topic: () => blank(MORSE_ID),
      group: 'Not started',
    },
    {
      name: 'a Morse topic partway through acquisition',
      topic: () => acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 6 * DAY)), 4),
      group: 'Started',
    },
    {
      name: 'a Morse topic that reached readiness today',
      topic: () => ({
        ...acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 40 * DAY)), 14),
        acquisitionReadyAt: ago(0),
      }),
      group: 'Started',
    },
    {
      name: 'a Morse topic ready and past its anchored gap',
      topic: () => ({
        ...acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 40 * DAY)), 14),
        acquisitionReadyAt: ago(3),
      }),
      group: 'Started',
    },
    {
      name: 'an ordinary topic not yet enrolled',
      topic: () => blank('cardinal-bearings'),
      group: 'Not started',
    },
    {
      name: 'an ordinary topic drilled days ago',
      topic: () => blank('cardinal-bearings', { status: 'drilled', drilledAt: ago(4) }),
      group: 'Started',
    },
    {
      name: 'an ordinary topic drilled yesterday',
      topic: () =>
        blank('cardinal-bearings', { status: 'drilled', drilledAt: ago(1) }),
      group: 'Started',
    },
    {
      name: 'a topic that decayed and needs repair',
      topic: () => blank('cardinal-bearings', { status: 'decayed', completedAt: ago(200) }),
      group: 'Started',
    },
    {
      name: 'a completed topic, banked',
      topic: () =>
        blank('cardinal-bearings', {
          status: 'completed',
          drilledAt: ago(80),
          completedAt: ago(20),
          lastTestedAt: ago(20),
        }),
      group: 'Started',
    },
  ]

  for (const scenario of scenarios) {
    it(`agrees about ${scenario.name}`, () => {
      const topic = scenario.topic()
      install([topic])
      const journey = journeyFor(topic)

      // Every surface describes the same stored topic. Opening Topic is browsing
      // only, so it cannot advance the state underneath later assertions.
      // Today holds only started topics, so an unstarted one is Library's to
      // offer even when the schedule would call it available.
      if (scenario.group === 'Not started') {
        expect(onToday(topic)).toBe(false)
        cleanup()
      } else if (journey.due) {
        expect(todayOpens(topic)).toBe(topic.id)
        cleanup()
        expect(todaySchedule(topic)).toBe(homeProgress(topic, journey).label)
        cleanup()
      }

      // Topic browsing is side-effect free and therefore renders the same
      // journey as Today and Library, including for a fresh ordinary topic.
      install([topic])
      if (topic.id === MORSE_ID && journey.phase === 'banked') {
        expect(topicPrimary(topic)).toBe('') // Completed path has no required current action.
      }
      else expect(topicPrimary(topic)).toBe(journey.primaryLabel)
      cleanup()
      install([topic])
      if (topic.id === MORSE_ID) {
        renderTopicPage(topic)
        expect(screen.getByRole('img', { name: `${journey.acquisition.settled} of 26 letters` })).toBeTruthy()
      } else expect(topicSchedule(topic)).toBe(journey.statusLabel)
      cleanup()

      // Placement. Library groups by whether the learner has begun, so a topic
      // Today treats as in progress must never sit on the untouched shelf.
      install([topic])
      expect(libraryGroup(topic)).toBe(scenario.group)
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

    // Today chooses no run: its plate opens the topic, whose one action is the
    // lesson.
    expect(todayOpens(partial)).toBe(partial.id)
    cleanup()
    expect(topicPrimary(partial)).toBe(journeyFor(partial).primaryLabel)
    expect(topicPrimary(partial)).toMatch(/^Continue lesson \d+$/)
  })

  it('says Start lesson rather than Continue before the first sitting', () => {
    const fresh = blank(MORSE_ID)
    install([fresh])

    // Not started, so not on Today; the topic page is where it begins.
    expect(onToday(fresh)).toBe(false)
    cleanup()
    expect(topicPrimary(fresh)).toBe('Start lesson 1')
  })

  it('never offers Test as the lead action while acquisition is incomplete', () => {
    const partial = acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 6 * DAY)), 3)
    install([partial])

    // The plate is Today's only control. With only an acquiring topic in
    // motion, pressing it opens that topic, and no batch Test is offered.
    expect(todayOpens(partial)).toBe(partial.id)
    cleanup()
    renderToday()
    expect(document.querySelector('.today-go')).toBeNull()
    for (const button of document.querySelectorAll('button')) {
      expect(button.textContent).not.toMatch(/^Test/)
    }
  })

  it('offers Test on the Topic page as an early path entry', () => {
    const partial = acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 6 * DAY)), 3)
    install([partial])
    renderTopicPage(partial)

    // Exactly one prominent control, and it is the lesson. The scored run is
    // still reachable, from its own place at the end of the curriculum, and it
    // leaves the consequence to the Test end screen.
    expect(document.querySelectorAll('[aria-current="step"]')).toHaveLength(1)
    expect(document.querySelector('[aria-current="step"]')?.getAttribute('aria-label')).toMatch(/^[A-Z] [A-Z], Lesson /)
    expect(screen.getByRole('button', { name: 'Test early' })).toBeTruthy()
    expect(document.querySelector('.topic-tray')).toBeNull()
  })

  it('reads acquisition progress in its own units, never as a retention gap', () => {
    const partial = acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 6 * DAY)), 4)
    install([partial])

    renderLibrary()
    const row = rowFor(partial.title)
    expect(row.querySelector('.gauge-acquisition')).not.toBeNull()
    expect(row.querySelector('.gauge-row .sr-only')?.textContent).toContain('letters')
    expect(row.querySelector('.gauge-row .gauge-label')).toBeNull()
    // The gap bar means retention, and this topic has not entered a gap.
    expect(row.querySelector('.gauge-gap')).toBeNull()
  })

  it('carries the active finite sitting through to the surfaces that show it', () => {
    const partial = acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 6 * DAY)), 2)
    const resumed: Topic = {
      ...partial,
      lessonSitting: { retrievals: 6, correct: 5, revisitItemIds: [partial.items[2].id as string] },
    }
    install([resumed])

    expect(todayOpens(resumed)).toBe(resumed.id)
    cleanup()
    renderToday()
    // Compact overview surfaces keep the sitting count in durable state.
    expect(rowFor(resumed.title, todayDocket()).textContent).not.toContain('retrievals')
    cleanup()
    renderTopicPage(resumed)
    expect(document.querySelector('[aria-current="step"]')?.getAttribute('aria-label')).toMatch(/^[A-Z] [A-Z], Lesson /)
    expect(screen.getByRole('img', { name: `${journeyFor(resumed).acquisition.settled} of 26 letters` })).toBeTruthy()
    const stored = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}') as { topics?: Topic[] }
    expect(stored.topics?.find(topic => topic.id === resumed.id)?.lessonSitting).toEqual(resumed.lessonSitting)
    // Plain terminology: the finite sitting is a retrieval budget, not a score.
    expect(document.body.textContent).not.toContain('XP')
  })
})

describe('curriculum completion moves every surface together', () => {
  const ready = (): Topic => ({
    ...acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 40 * DAY)), 14),
    acquisitionReadyAt: ago(0),
  })

  it('stops recommending mandatory lessons or Tests immediately upon learning', () => {
    const topic = ready()
    install([topic])
    expect(journeyFor(topic).phase).toBe('banked')
    expect(journeyFor(topic).due).toBe(false)
    expect(topicPrimary(topic)).toBe('')
    cleanup()
    expect(onToday(topic)).toBe(false)
  })

  it('offers optional scored Test separately from the learned course', () => {
    const topic = ready()
    install([topic])
    expect(topic.learningAt).not.toBeNull()
    renderTopicPage(topic)
    expect(screen.getByRole('button', { name: 'A–Z Test, available, reached' })).toBeTruthy()
    cleanup()
    expect(libraryGroup(topic)).toBe('Started')
  })

  it('does not reopen learned topics when an old acquisition date changes', () => {
    const topic = { ...ready(), acquisitionReadyAt: ago(3) }
    install([topic])
    expect(journeyFor(topic).phase).toBe('banked')
    expect(journeyFor(topic).due).toBe(false)
    expect(onToday(topic)).toBe(false)
    cleanup()
    expect(libraryGroup(topic)).toBe('Started')
  })
})

describe('Library is a list of titles, grouped by whether you have begun', () => {
  it('puts every started topic first, most recent at the top, and the rest by title', () => {
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
      blank('ooda-loop'),
    ]
    install(topics)
    renderLibrary()

    // Two named shelves. There are no schedule shelves, no track filters and
    // no selection mode any more.
    const headings = [...document.querySelectorAll('.lib-group-head')].map((h) => h.textContent)
    expect(headings).toEqual(['Started', 'Not started'])
    expect(document.querySelector('.lib-shelf')).toBeNull()
    expect(screen.queryByRole('group', { name: 'Filter by track' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Select' })).toBeNull()

    const learning = document.querySelector('.lib-group:not(.lib-group-rest)') as HTMLElement
    const titles = [...learning.querySelectorAll('.index-title')].map((t) => t.textContent)
    // Survey drilled 4 days ago, Morse enrolled 6, NATO tested 20, bearings
    // banked 200.
    expect(titles).toEqual([topics[2].title, topics[0].title, topics[3].title, topics[1].title])
    const rest = document.querySelector('.lib-group-rest') as HTMLElement
    expect(within(rest).getByText(topics[4].title)).toBeTruthy()

    // A row carries one reading at most, and never an item count or a verb.
    expect(document.querySelector('.lib-when')).toBeNull()
    expect(document.querySelector('.index-meta')).toBeNull()
    for (const row of document.querySelectorAll('.lib-row')) {
      expect(row.querySelectorAll('.gauge-label, .lib-row-reading').length).toBeLessThanOrEqual(1)
    }
    // An untouched topic has nothing to report.
    expect(rest.querySelector('.gauge-label, .lib-row-reading')).toBeNull()
  })

  it('carries no streaks, badges, XP, leaderboard or single progress percentage', () => {
    install([
      acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 6 * DAY)), 3),
      blank('cardinal-bearings', { status: 'completed', drilledAt: ago(80), completedAt: ago(20) }),
    ])
    renderLibrary()

    const text = document.body.textContent ?? ''
    for (const banned of ['streak', 'badge', 'leaderboard', 'points']) {
      expect(text.toLowerCase()).not.toContain(banned)
    }
    // Whole words: `Export` legitimately contains the letters of the currency
    // this product does not have.
    for (const banned of [/\bXP\b/, /\bLevel\b/i]) {
      expect(text).not.toMatch(banned)
    }
    // No aggregate percentage: acquisition, retention and completion are
    // different measurements and averaging them would say nothing true.
    expect(text).not.toMatch(/\d+%/)
    expect(document.querySelector('.stat-strip')).toBeNull()
  })

  it('shows a fresh install every shipped topic on the untouched shelf', () => {
    // No stored library: the first-run delivery path.
    renderLibrary()

    const headings = [...document.querySelectorAll('.lib-group-head')].map((h) => h.textContent)
    expect(headings).toEqual(['Not started'])
    expect(document.querySelectorAll('.lib-group-rest .index-entry')).toHaveLength(
      SHIPPED_CATALOG_TOPIC_IDS.length,
    )
  })

  it('keeps account and data utilities out of the learning Library', () => {
    install([blank('cardinal-bearings')])
    renderLibrary()
    expect(screen.queryByRole('button', { name: 'Data and backup' })).toBeNull()
  })
})

describe('ordinary topic browsing and enrollment', () => {
  it('shows lessons on landing and the complete answer-visible reference on its own screen', () => {
    const ordinary = blank('cardinal-bearings')
    renderTopicPage(ordinary)
    expect(screen.getByRole('list', { name: 'Lessons' })).toBeTruthy()
    expect(document.querySelector('.topic-items')).toBeNull()
    expect(document.querySelector('.morse-progress-path')).toBeNull()
    cleanup()
    render(<TopicReading topic={ordinary} onBack={vi.fn()} />)
    expect(document.querySelectorAll('.topic-items .topic-item')).toHaveLength(ordinary.items.length)
    for (const item of ordinary.items) expect(document.body.textContent).toContain(item.answer)
  })

  it('keeps visible briefing support on its own Learn screen, opening on its lede', () => {
    const briefed = blank('ooda-loop')
    const onReference = vi.fn()
    render(
      <LibraryProvider>
        <TopicPage topic={briefed} onBack={() => undefined} onStart={() => undefined}
          onReference={onReference} onEdit={() => undefined} />
      </LibraryProvider>,
    )
    // The topic page carries the scored set; the explanation is one tile away.
    expect(document.querySelector('.learn-support')).toBeNull()
    expect(document.querySelector('.topic-items')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Reference' }))
    expect(onReference).toHaveBeenCalledWith(briefed.id)
    cleanup()

    render(<TopicReading topic={briefed} onBack={() => undefined} />)
    const support = document.querySelector('.learn-support')!
    expect(support).not.toBeNull()
    // The lede opens the screen; the scope moves to the sources sheet (a survival topic's safety boundary stays).
    expect(document.querySelector('.topic-scope')).toBeNull()
    expect(support.querySelector('.learn-overview')?.textContent).toBe(briefed.learn!.overview)
    expect(support.querySelector('h3')).toBeTruthy()
    expect(support.querySelector('details, summary')).toBeNull()
  })

  it('keeps page-open side-effect free and starts only on the deliberate action', async () => {
    const fresh = blank('primary-survey')
    install([fresh])

    expect(onToday(fresh)).toBe(false)
    cleanup()

    install([fresh])
    const beforeBrowse = (JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}') as { topics?: Topic[] }).topics?.find(
      (topic) => topic.id === fresh.id,
    )
    expect(beforeBrowse).toEqual(fresh)
    renderTopicPage(fresh)
    expect(document.querySelector('.topic-tray .mode-tray-label')?.textContent).toBe('Start')
    expect(screen.getByRole('list', { name: 'Lessons' })).toBeTruthy()
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}') as { topics?: Topic[] }
      expect(stored.topics?.find((topic) => topic.id === fresh.id)).toEqual(beforeBrowse)
    })

    // Starting a Test does not enroll or create evidence before scoring.
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    const stored = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}') as { topics?: Topic[] }
    expect(stored.topics?.find((topic) => topic.id === fresh.id)).toEqual(beforeBrowse)

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
    expect(document.querySelector('.topic-tray')).toBeNull()
    expect(document.body.textContent).toContain('no items yet')
    expect(screen.getByRole('button', { name: 'Add items' })).toBeTruthy()
  })
})

describe('opening Morse lands on the curriculum', () => {
  it('makes the path the body of the page, with the alphabet a deliberate step away', () => {
    renderTopicPage(blank(MORSE_ID))

    // Thirteen lessons, four word checkpoints and the Test that closes them.
    expect(document.querySelectorAll('.morse-progress-lesson')).toHaveLength(13)
    expect(document.querySelectorAll('.morse-progress-checkpoint')).toHaveLength(4)
    expect(document.querySelectorAll('.morse-progress-test')).toHaveLength(1)

    // The reference used to be twenty-six cards sitting on this page, which was
    // right when the page had nothing better to be. The curriculum is better,
    // and a long lookup deserves its own surface rather than the top of this one.
    expect(document.querySelectorAll('.morse-ref-card')).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'A–Z' })).toBeTruthy()
    expect(document.body.textContent).not.toContain('Show all 26 items')
  })

  it('shows the whole finite shape from the first sitting, locked entries included', () => {
    renderTopicPage(blank(MORSE_ID))

    expect(screen.getByRole('button', { name: 'Begin, current' })).toBeTruthy()
    const locked = [...document.querySelectorAll('.morse-progress-row.is-locked')]
    expect(locked.length).toBeGreaterThan(0)
    expect(locked.every(row => row.getAttribute('aria-disabled') === 'true')).toBe(true)
    expect(document.querySelectorAll('[aria-current="step"]')).toHaveLength(1)
  })
})
