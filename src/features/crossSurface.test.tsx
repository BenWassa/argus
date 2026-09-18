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

function renderToday() {
  return render(
    <LibraryProvider>
      <Today
        onStart={() => undefined}
        onOpenTopic={() => undefined}
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

/** Library lists a decayed topic twice on purpose: as work, and in the record. */
function libraryShelves(): HTMLElement {
  const work = document.createElement('div')
  for (const shelf of document.querySelectorAll('.lib-shelf')) {
    work.appendChild(shelf.cloneNode(true))
  }
  return work
}

/** The docket alone. Today's primary action now names its topic too, and the
 *  docket is where the per-topic verdict is said. */
function todayDocket(): HTMLElement {
  const docket = document.querySelector('.docket')
  if (!docket) throw new Error('Today rendered no docket')
  return docket as HTMLElement
}

/** What Today tells the learner to do with this topic. */
function todayVerb(topic: Topic): string {
  renderToday()
  const row = rowFor(topic.title, todayDocket())
  // The verb is the row's screen-reader prefix: the row *is* the control.
  const verb = row.querySelector('.sr-only')?.textContent ?? ''
  return verb.replace(/:\s*$/, '').trim()
}

function todaySchedule(topic: Topic): string {
  renderToday()
  return rowFor(topic.title, todayDocket()).querySelector('.due-reason')?.textContent?.trim() ?? ''
}

/** What Library's action button says for this topic. */
function libraryVerb(topic: Topic): string {
  renderLibrary()
  return rowFor(topic.title, libraryShelves()).querySelector('.lib-action')?.textContent?.trim() ?? ''
}

function librarySchedule(topic: Topic): string {
  renderLibrary()
  return rowFor(topic.title, libraryShelves()).querySelector('.lib-when')?.textContent?.trim() ?? ''
}

/** Which shelf Library placed this topic on. */
function libraryShelf(topic: Topic): string {
  renderLibrary()
  const shelf = rowFor(topic.title, libraryShelves()).closest('section')
  return shelf?.querySelector('.lib-shelf-head')?.textContent?.replace(/\d+$/, '').trim() ?? ''
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
    /** Where Library shelves it, for that same state. */
    shelf: string
  }

  const scenarios: Scenario[] = [
    {
      name: 'a Morse topic nobody has opened',
      topic: () => blank(MORSE_ID),
      shelf: 'Due now',
    },
    {
      name: 'a Morse topic partway through acquisition',
      topic: () => acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 6 * DAY)), 4),
      shelf: 'Due now',
    },
    {
      name: 'a Morse topic that reached readiness today',
      topic: () => ({
        ...acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 40 * DAY)), 14),
        acquisitionReadyAt: ago(0),
      }),
      shelf: 'Waiting',
    },
    {
      name: 'a Morse topic ready and past its anchored gap',
      topic: () => ({
        ...acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 40 * DAY)), 14),
        acquisitionReadyAt: ago(3),
      }),
      shelf: 'Due now',
    },
    {
      name: 'an ordinary topic not yet enrolled',
      topic: () => blank('cardinal-bearings'),
      shelf: 'Due now',
    },
    {
      name: 'an ordinary topic waiting out its delayed test',
      topic: () => blank('cardinal-bearings', { status: 'drilled', drilledAt: ago(4) }),
      shelf: 'Waiting',
    },
    {
      name: 'an ordinary topic ready for its delayed test',
      topic: () =>
        blank('cardinal-bearings', { status: 'drilled', drilledAt: ago(COMPLETION_GAP_DAYS + 1) }),
      shelf: 'Due now',
    },
    {
      name: 'a topic that decayed and needs repair',
      topic: () => blank('cardinal-bearings', { status: 'decayed', completedAt: ago(200) }),
      shelf: 'Due now',
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
      shelf: 'Waiting',
    },
  ]

  for (const scenario of scenarios) {
    it(`agrees about ${scenario.name}`, () => {
      const topic = scenario.topic()
      install([topic])
      const journey = journeyFor(topic)

      // Every surface describes the same stored topic. Opening Topic is browsing
      // only, so it cannot advance the state underneath later assertions.
      expect(libraryVerb(topic)).toBe(journey.actionLabel)
      cleanup()
      expect(librarySchedule(topic)).toBe(journey.statusLabel)
      cleanup()

      if (journey.due) {
        expect(todayVerb(topic)).toBe(journey.actionLabel)
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

      // Placement. A row on `Due now` whose button says nothing is doable, or a
      // topic filed under Waiting that Today is asking for, is the same defect.
      install([topic])
      expect(libraryShelf(topic)).toBe(scenario.shelf)
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

    expect(todayVerb(partial)).toBe('Continue')
    cleanup()
    expect(libraryVerb(partial)).toBe('Continue')
    cleanup()
    expect(topicPrimary(partial)).toBe(journeyFor(partial).primaryLabel)
    expect(topicPrimary(partial)).toMatch(/^Continue lesson \d+$/)
  })

  it('says Start lesson rather than Continue before the first sitting', () => {
    const fresh = blank(MORSE_ID)
    install([fresh])

    expect(todayVerb(fresh)).toBe('Start lesson')
    cleanup()
    expect(libraryVerb(fresh)).toBe('Start lesson')
    cleanup()
    expect(topicPrimary(fresh)).toBe('Start lesson 1')
  })

  it('never offers Test as the lead action while acquisition is incomplete', () => {
    const partial = acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 6 * DAY)), 3)
    install([partial])

    renderToday()
    // Today's primary control is the lead group's button. With only an acquiring
    // topic due, it must be the lesson, and the generic `Test everything` batch
    // must not be reachable as the day's required action.
    const primary = document.querySelector('.today-go')
    expect(primary?.textContent).toContain('lesson')
    expect(primary?.textContent).not.toContain('Test')
    expect(document.body.textContent).not.toContain('Test everything')
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
    expect(check?.querySelector('.morse-path-action')?.textContent).toBe('Try early')
    expect(check?.textContent).toContain('without moving the ladder')
  })

  it('shows acquisition progress as words, never as a retention gap bar', () => {
    const partial = acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 6 * DAY)), 4)
    install([partial])

    renderLibrary()
    const row = rowFor(partial.title)
    expect(row.querySelector('.lib-acquisition')?.textContent).toContain('letters settled')
    // The gap bar means retention, and this topic has not entered a gap.
    expect(row.querySelector('.lib-gap')).toBeNull()
  })

  it('carries the active finite sitting through to the surfaces that show it', () => {
    const partial = acquire(resolveStudy(blank(MORSE_ID), new Date(Date.now() - 6 * DAY)), 2)
    const resumed: Topic = {
      ...partial,
      lessonSitting: { retrievals: 6, correct: 5, revisitItemIds: [partial.items[2].id as string] },
    }
    install([resumed])

    expect(todayVerb(resumed)).toBe('Continue')
    cleanup()
    renderToday()
    expect(rowFor(resumed.title, todayDocket()).textContent).toContain(
      '6 of 10 retrievals this sitting',
    )
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
    expect(rowFor(topic.title, todayDocket()).querySelector('.sr-only')?.textContent).toContain(
      'Test',
    )
  })

  it('starts the delayed-test clock at readiness rather than at first exposure', () => {
    const topic = ready()
    install([topic])

    // First exposure was forty days ago. Under the old rule the topic has read
    // `Ready to drill` for thirty-nine of them.
    expect(topic.learningAt).not.toBeNull()
    expect(librarySchedule(topic)).toBe('Test in 1 day')
    cleanup()
    expect(libraryShelf(topic)).toBe('Waiting')
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

describe('Library absorbed Progress without losing what it said', () => {
  it('separates live work, waiting and the permanent record', () => {
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
    renderLibrary()
    const headings = [...document.querySelectorAll('.lib-shelf-head')].map((h) =>
      h.textContent?.replace(/\d+$/, '').trim(),
    )
    expect(headings).toEqual(['Due now', 'Waiting'])

    // Repair is not a fourth shelf: a decayed topic is due, and its own row says
    // so in warning rather than being filed away from the work it needs.
    const bearings = rowFor('Cardinal and intercardinal bearings', libraryShelves())
    expect(bearings.querySelector('.lib-when.is-repair')?.textContent).toBe('Needs repair')

    // Decay routes work without erasing history: the bearings topic is due for
    // repair *and* still holds its place in the permanent record.
    const record = document.querySelector('.record') as HTMLElement
    expect(within(record).getByText('Cardinal and intercardinal bearings')).toBeTruthy()
    expect(within(record).getByText('NATO phonetic alphabet')).toBeTruthy()
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

  it('shows a fresh install no achievements at all', () => {
    // No stored library: the first-run delivery path.
    renderLibrary()

    expect(document.body.textContent).toContain('No completions yet')
    expect(document.querySelector('.record')).toBeNull()
    // Every shipped topic, and every one of them not started.
    expect(document.querySelectorAll('.lib-shelf .index-entry')).toHaveLength(
      SHIPPED_CATALOG_TOPIC_IDS.length,
    )
    for (const when of document.querySelectorAll('.lib-when')) {
      expect(when.textContent).toBe('Not started')
    }
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

    expect(todayVerb(fresh)).toBe('Start')
    cleanup()
    expect(libraryVerb(fresh)).toBe('Start')
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

    const states = [...document.querySelectorAll('.morse-path-lesson')].map((item) =>
      item.querySelector('.morse-path-status')?.textContent ?? null,
    )
    // Only what the action word cannot say. A locked row states `Locked` where
    // its control would be, so labelling it twice was noise.
    expect(states[0]).toBe('Current')
    expect(states.slice(1).every((state) => state === null)).toBe(true)
    // A locked entry is stated, never offered as a control that does nothing.
    expect(document.querySelectorAll('.morse-path-action.is-locked').length).toBeGreaterThan(0)
    expect([...document.querySelectorAll('button')].some((b) => b.disabled)).toBe(false)
  })
})
