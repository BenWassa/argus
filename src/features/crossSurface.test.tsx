// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
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
import { COMPLETION_GAP_DAYS, resolveStudy } from '../domain/study/scheduling'
import { seedLibrary } from '../domain/library/catalogSeed'
import { parseLibrary } from '../infrastructure/persistence/libraryParser'
import type { Topic } from '../domain/library/topic'
import { Today } from './today/Today'
import { LibraryPage } from './library/LibraryPage'
import { TopicPage } from './library/TopicPage'

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
        onDelete={() => undefined}
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
  return rowFor(topic.title, todayDocket()).querySelector('.due-reason')?.textContent?.trim() ?? ''
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
  return document.querySelector('.topic-primary-verb')?.textContent?.trim() ?? ''
}

function topicSchedule(topic: Topic): string {
  renderTopicPage(topic)
  return document.querySelector('.topic-state-label')?.textContent?.trim() ?? ''
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
      name: 'an ordinary topic waiting out its delayed test',
      topic: () => blank('cardinal-bearings', { status: 'drilled', drilledAt: ago(4) }),
      group: 'Started',
    },
    {
      name: 'an ordinary topic ready for its delayed test',
      topic: () =>
        blank('cardinal-bearings', { status: 'drilled', drilledAt: ago(COMPLETION_GAP_DAYS + 1) }),
      group: 'Started',
    },
    {
      name: 'a topic that decayed and needs repair',
      topic: () => blank('cardinal-bearings', { status: 'decayed', completedAt: ago(200) }),
      group: 'Started',
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
        expect(todaySchedule(topic)).toBe(journey.statusLabel)
        cleanup()
      }

      // Topic browsing is side-effect free and therefore renders the same
      // journey as Today and Library, including for a fresh ordinary topic.
      install([topic])
      expect(topicPrimary(topic)).toBe(journey.primaryLabel)
      cleanup()
      install([topic])
      expect(topicSchedule(topic)).toBe(journey.statusLabel)
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

  it('offers Test on the Topic page only as an explicitly non-advancing path entry', () => {
    const partial = acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 6 * DAY)), 3)
    install([partial])
    renderTopicPage(partial)

    // Exactly one prominent control, and it is the lesson. The scored run is
    // still reachable, from its own place at the end of the curriculum, and it
    // states its consequence there rather than as a standing second button.
    expect(document.querySelectorAll('.topic-primary')).toHaveLength(1)
    expect(document.querySelector('.topic-primary-verb')?.textContent).toContain('lesson')

    const check = document.querySelector('.morse-path-check')
    expect(check?.querySelector('.morse-path-cue')?.textContent).toBe('Try early')
    expect(check?.textContent).toContain('does not move the ladder')
  })

  it('reads acquisition progress in its own units, never as a retention gap', () => {
    const partial = acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 6 * DAY)), 4)
    install([partial])

    renderLibrary()
    const row = rowFor(partial.title)
    expect(row.querySelector('.gauge-acquisition')).not.toBeNull()
    expect(row.querySelector('.gauge-row .gauge-label')?.textContent).toContain('letters')
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
    // Today states no quantities; the sitting's count is the topic page's.
    expect(rowFor(resumed.title, todayDocket()).textContent).not.toContain('retrievals')
    cleanup()
    renderTopicPage(resumed)
    expect(document.body.textContent).toContain('6 retrievals')
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

    // The page's fuller recommendation between checks: keep learning past the
    // alphabet. Its Test is still one tap away, as a short review.
    expect(topicPrimary(topic)).toBe('Test')
    cleanup()
    // The anchored one-day gap has not passed, so it is not today's work yet.
    // It is still in motion, so Today shows it as waiting, and pressing it opens
    // the topic, where an early Test and its consequence are both stated.
    renderToday()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('ARGUS')
    const row = rowFor(topic.title, todayDocket())
    expect(row.querySelector('.due-reason')?.textContent).toBe('Ready to test')
    cleanup()
    expect(todayOpens(topic)).toBe(topic.id)
  })

  it('starts the delayed-test clock at readiness rather than at first exposure', () => {
    const topic = ready()
    install([topic])

    // First exposure was forty days ago. Under the old rule the topic has read
    // `Ready to drill` for thirty-nine of them.
    expect(topic.learningAt).not.toBeNull()
    expect(topicSchedule(topic)).toBe('Ready to test')
    cleanup()
    expect(libraryGroup(topic)).toBe('Started')
  })

  it('becomes due once the anchored gap has actually passed', () => {
    const topic = { ...ready(), acquisitionReadyAt: ago(3) }
    install([topic])

    expect(todayOpens(topic)).toBe(topic.id)
    cleanup()
    expect(todaySchedule(topic)).toBe('Ready to test')
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
  it('puts the finite reference on the page instead of behind a disclosure', () => {
    const ordinary = blank('cardinal-bearings')
    renderTopicPage(ordinary)

    // The separate reading route repeated this page's title, scope and every
    // item. The material is now the body of the page, visible and unconcealed,
    // which is what a surface that hides nothing should look like.
    expect(document.querySelectorAll('.sheet-items li')).toHaveLength(ordinary.items.length)
    expect(document.body.textContent).not.toContain('Show all')
    expect(document.querySelector('.morse-path')).toBeNull()
    // Nothing on a reading surface is card-shaped, because nothing is concealed.
    expect(document.querySelector('.flip-card')).toBeNull()
  })

  it('renders a briefing above the scored set, with the boundary between them visible', () => {
    const briefed = blank('ooda-loop')
    renderTopicPage(briefed)

    expect(document.querySelector('.learn-support')).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Recall reference', level: 2 })).toBeTruthy()
    expect(document.querySelectorAll('.sheet-items li')).toHaveLength(briefed.items.length)
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
    expect(document.querySelector('.topic-primary-verb')?.textContent).toBe('Start learning')
    expect(document.querySelectorAll('.sheet-items li')).toHaveLength(fresh.items.length)
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}') as { topics?: Topic[] }
      expect(stored.topics?.find((topic) => topic.id === fresh.id)).toEqual(beforeBrowse)
    })

    fireEvent.click(screen.getByRole('button', { name: /Start learning/ }))
    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}') as { topics?: Topic[] }
      const enrolled = stored.topics?.find((topic) => topic.id === fresh.id)
      expect(enrolled?.status).toBe('learning')
      expect(enrolled?.learningAt).toBeTruthy()
      expect(enrolled?.history).toEqual([])
      expect(enrolled?.lastTestedAt).toBeNull()
      expect(enrolled?.itemEvidence ?? {}).toEqual({})
    })
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
    expect(document.querySelector('.topic-primary')).toBeNull()
    expect(document.body.textContent).toContain('no items yet')
    expect(screen.getByRole('button', { name: 'Add items' })).toBeTruthy()
  })
})

describe('opening Morse lands on the curriculum', () => {
  it('makes the path the body of the page, with the alphabet a deliberate step away', () => {
    renderTopicPage(blank(MORSE_ID))

    // Thirteen lessons, four word checkpoints and the Test that closes them.
    expect(document.querySelectorAll('.morse-path-lesson')).toHaveLength(13)
    expect(document.querySelectorAll('.morse-path-checkpoint')).toHaveLength(4)
    expect(document.querySelectorAll('.morse-path-check')).toHaveLength(1)

    // The reference used to be twenty-six cards sitting on this page, which was
    // right when the page had nothing better to be. The curriculum is better,
    // and a long lookup deserves its own surface rather than the top of this one.
    expect(document.querySelectorAll('.morse-ref-card')).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Morse alphabet' })).toBeTruthy()
    expect(document.body.textContent).not.toContain('Show all 26 items')
  })

  it('shows the whole finite shape from the first sitting, locked entries included', () => {
    renderTopicPage(blank(MORSE_ID))

    const cues = [...document.querySelectorAll('.morse-path-lesson')].map((item) =>
      item.querySelector('.morse-path-cue')?.textContent ?? null,
    )
    // The current lesson says what a tap does; a locked one says nothing,
    // because it is not a control.
    expect(cues[0]).toBe('Continue')
    expect(cues.slice(1).every((cue) => cue === null)).toBe(true)
    // A locked entry is stated, never offered as a control that does nothing.
    const locked = [...document.querySelectorAll('.morse-path-item.is-locked')]
    expect(locked.length).toBeGreaterThan(0)
    expect(locked.every((row) => row.querySelector('button') === null)).toBe(true)
    expect([...document.querySelectorAll('button')].some((b) => b.disabled)).toBe(false)
  })
})
