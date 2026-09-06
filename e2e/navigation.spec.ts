import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import type { Topic } from '../src/lib/types'

const STORE_KEY = 'argus.library.v5'
const SPLASH_KEY = 'argus-splash-seen'

const shippedCatalog = JSON.parse(
  readFileSync(fileURLToPath(new URL('../src/lib/shippedCatalog.json', import.meta.url)), 'utf8'),
) as { topicIds: string[] }

const TOPIC: Topic = {
  id: 'navigation-topic',
  title: 'Navigation test topic',
  scope: 'Two fixed prompts used only to verify navigation behaviour.',
  track: 'learning',
  items: [
    { id: 'navigation-alpha', kind: 'forward', prompt: 'Alpha prompt', answer: 'Alpha answer' },
    { id: 'navigation-bravo', kind: 'forward', prompt: 'Bravo prompt', answer: 'Bravo answer' },
  ],
  status: 'unstarted',
  createdAt: '2026-09-06T12:00:00.000Z',
  drilledAt: null,
  learningAt: null,
  completedAt: null,
  lastTestedAt: null,
  spotCheckedAt: null,
  history: [],
  origin: 'user',
}

const LIBRARY = JSON.stringify({
  version: 5,
  topics: [TOPIC],
  catalogDelivered: [...shippedCatalog.topicIds].sort(),
})

interface NavigationState {
  argusNavigation: number
  index: number
  route: Record<string, unknown>
}

async function installLibrary(page: Page, initialState: unknown = null) {
  await page.addInitScript(
    ([library, storeKey, splashKey, state]) => {
      // The same init script can be present when a root-Back test returns to a
      // data: page. Storage is intentionally touched only on the Argus origin.
      if (location.protocol === 'http:' || location.protocol === 'https:') {
        window.sessionStorage.setItem(splashKey, 'true')
        window.localStorage.setItem(storeKey, library)
        ;(window as unknown as { __argusInitialHistoryLength: number }).__argusInitialHistoryLength =
          window.history.length
        if (state !== null) window.history.replaceState(state, '')
      }
    },
    [LIBRARY, STORE_KEY, SPLASH_KEY, initialState] as const,
  )
}

async function openApp(page: Page, initialState: unknown = null) {
  await installLibrary(page, initialState)
  await page.goto('./')
}

async function navigationState(page: Page): Promise<NavigationState> {
  return page.evaluate(() => window.history.state as NavigationState)
}

async function systemBack(page: Page) {
  await page.evaluate(() => window.history.back())
}

async function systemForward(page: Page) {
  await page.evaluate(() => window.history.forward())
}

async function waitForHistoryIndex(page: Page, index: number) {
  await expect.poll(async () => (await navigationState(page)).index).toBe(index)
}

async function waitForRouteKind(page: Page, kind: string) {
  await expect.poll(async () => (await navigationState(page)).route.kind).toBe(kind)
}

async function openLibrary(page: Page) {
  await page.getByRole('button', { name: 'Library', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Library', level: 1 })).toBeVisible()
}

async function openTopic(page: Page) {
  await page.locator(`[data-row="${TOPIC.id}"]`).click()
  await expect(page.getByRole('heading', { name: TOPIC.title, level: 1 })).toBeVisible()
}

test('initial root replaces the document entry and current-section taps add no Back stop', async ({ page }) => {
  await openApp(page)

  const initial = await navigationState(page)
  expect(initial).toMatchObject({
    argusNavigation: 1,
    index: 0,
    route: { kind: 'section', view: 'today' },
  })
  const lengths = await page.evaluate(() => ({
    before: (window as unknown as { __argusInitialHistoryLength: number }).__argusInitialHistoryLength,
    after: window.history.length,
  }))
  expect(lengths.after).toBe(lengths.before)

  await page.getByRole('button', { name: 'Today', exact: true }).click()
  expect((await navigationState(page)).index).toBe(0)

  await openLibrary(page)
  expect(await navigationState(page)).toMatchObject({
    index: 1,
    route: { kind: 'section', view: 'library' },
  })

  await page.getByRole('button', { name: 'Library', exact: true }).click()
  await page.getByRole('button', { name: 'Library', exact: true }).click()
  expect((await navigationState(page)).index).toBe(1)
})

test('Back unwinds Topic and Library, and Forward restores the Topic without duplication', async ({ page }) => {
  await openApp(page)
  await openLibrary(page)
  await openTopic(page)

  expect(await navigationState(page)).toMatchObject({
    index: 2,
    route: { kind: 'topic', topicId: TOPIC.id },
  })

  await systemBack(page)
  await expect(page.getByRole('heading', { name: 'Library', level: 1 })).toBeVisible()
  await expect(page.locator(`[data-row="${TOPIC.id}"]`)).toBeFocused()
  expect((await navigationState(page)).index).toBe(1)

  await systemBack(page)
  await expect(page.getByRole('button', { name: 'Today', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  expect((await navigationState(page)).index).toBe(0)

  await systemForward(page)
  await expect(page.getByRole('heading', { name: 'Library', level: 1 })).toBeVisible()
  expect((await navigationState(page)).index).toBe(1)

  await systemForward(page)
  const heading = page.getByRole('heading', { name: TOPIC.title, level: 1 })
  await expect(heading).toBeVisible()
  await expect(heading).toBeFocused()
  expect((await navigationState(page)).index).toBe(2)
})

test('runs remember their real Today, Library and Topic origins', async ({ page }) => {
  await openApp(page)

  // Today -> Learn -> Back = Today.
  await page.locator('.docket .index-row').click()
  await expect(page.getByRole('button', { name: 'Test me' })).toBeVisible()
  expect(await navigationState(page)).toMatchObject({
    index: 1,
    route: { kind: 'run', mode: 'learn', origin: { kind: 'section', view: 'today' } },
  })
  await systemBack(page)
  await expect(page.getByRole('button', { name: 'Today', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )

  // Library -> Learn -> Back = Library.
  await openLibrary(page)
  await page.locator(`[data-row="${TOPIC.id}"]`).locator('..').locator('.lib-action').click()
  await expect(page.getByRole('button', { name: 'Test me' })).toBeVisible()
  expect(await navigationState(page)).toMatchObject({
    route: { kind: 'run', mode: 'learn', origin: { kind: 'section', view: 'library' } },
  })
  await systemBack(page)
  await expect(page.getByRole('heading', { name: 'Library', level: 1 })).toBeVisible()

  // Topic -> Test -> Back = Topic.
  await openTopic(page)
  await page.locator('.mode-btn').filter({ hasText: /^Test/ }).click()
  await expect(page.locator('.flip-card')).toBeVisible()
  expect(await navigationState(page)).toMatchObject({
    route: { kind: 'run', mode: 'test', origin: { kind: 'topic', topicId: TOPIC.id } },
  })
  await systemBack(page)
  await expect(page.getByRole('heading', { name: TOPIC.title, level: 1 })).toBeVisible()
})

test('Learn to Test me replaces the run entry instead of adding a Learn Back stop', async ({ page }) => {
  await openApp(page)
  await openLibrary(page)
  await openTopic(page)

  await page.locator('.mode-btn').filter({ hasText: /^Learn/ }).click()
  const learned = await navigationState(page)
  expect(learned).toMatchObject({
    index: 3,
    route: { kind: 'run', mode: 'learn', origin: { kind: 'topic', topicId: TOPIC.id } },
  })

  await page.getByRole('button', { name: 'Test me' }).click()
  await expect(page.locator('.flip-card')).toBeVisible()
  const tested = await navigationState(page)
  expect(tested).toMatchObject({
    index: learned.index,
    route: { kind: 'run', mode: 'test', origin: { kind: 'topic', topicId: TOPIC.id } },
  })

  await systemBack(page)
  await expect(page.getByRole('heading', { name: TOPIC.title, level: 1 })).toBeVisible()
  expect((await navigationState(page)).index).toBe(2)
})

test('partial Test Back reuses End test, Back resumes, and confirmed exit preserves banking semantics', async ({ page }) => {
  await openApp(page)
  await openLibrary(page)
  await openTopic(page)
  await page.locator('.mode-btn').filter({ hasText: /^Test/ }).click()

  await page.locator('.flip-card').click()
  await page.getByRole('button', { name: 'Got it' }).click()
  await expect(page.locator('.session-bar .tabular')).toContainText('2 of 2')

  await systemBack(page)
  await expect(page.getByRole('heading', { name: 'End test', level: 1 })).toBeVisible()
  await waitForRouteKind(page, 'run')
  await waitForHistoryIndex(page, 3)

  // System Back on the confirmation is the existing "Keep going" meaning.
  await systemBack(page)
  await expect(page.getByRole('heading', { name: 'End test', level: 1 })).toHaveCount(0)
  await expect(page.locator('.flip-card')).toBeVisible()
  await expect(page.locator('.session-bar .tabular')).toContainText('2 of 2')
  await waitForRouteKind(page, 'run')
  await waitForHistoryIndex(page, 3)

  await systemBack(page)
  await expect(page.getByRole('heading', { name: 'End test', level: 1 })).toBeVisible()
  await waitForRouteKind(page, 'run')
  await waitForHistoryIndex(page, 3)
  await page.getByRole('button', { name: 'End test', exact: true }).click()
  await expect(page.getByRole('heading', { name: TOPIC.title, level: 1 })).toBeVisible()

  const history = await page.evaluate(
    ([storeKey, topicId]) => {
      const parsed = JSON.parse(window.localStorage.getItem(storeKey) ?? '{}') as {
        topics?: { id: string; history?: unknown[] }[]
      }
      return parsed.topics?.find((topic) => topic.id === topicId)?.history ?? null
    },
    [STORE_KEY, TOPIC.id] as const,
  )
  expect(history).toEqual([])
})

test('system Back dismisses clean and dirty dialogs before changing route', async ({ page }) => {
  await openApp(page)
  await openLibrary(page)

  await page.getByRole('button', { name: 'New topic' }).click()
  await expect(page.getByRole('dialog', { name: 'New topic' })).toBeVisible()
  await systemBack(page)
  await expect(page.getByRole('dialog', { name: 'New topic' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Library', level: 1 })).toBeVisible()
  await waitForHistoryIndex(page, 1)

  await page.getByRole('button', { name: 'New topic' }).click()
  const title = page.getByLabel('Title')
  await title.fill('Unsaved navigation work')

  await systemBack(page)
  await expect(page.getByRole('dialog', { name: 'Discard changes' })).toBeVisible()
  await waitForHistoryIndex(page, 1)

  await systemBack(page)
  await expect(page.getByRole('dialog', { name: 'New topic' })).toBeVisible()
  await expect(page.getByLabel('Title')).toHaveValue('Unsaved navigation work')
  await waitForHistoryIndex(page, 1)

  await systemBack(page)
  await expect(page.getByRole('dialog', { name: 'Discard changes' })).toBeVisible()
  await waitForHistoryIndex(page, 1)
  await page.getByRole('button', { name: 'Discard changes', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Library', level: 1 })).toBeVisible()

  await openTopic(page)
  await page.getByRole('button', { name: 'Delete topic' }).click()
  await expect(page.getByRole('dialog', { name: 'Delete topic' })).toBeVisible()
  await systemBack(page)
  await expect(page.getByRole('dialog', { name: 'Delete topic' })).toHaveCount(0)
  await waitForHistoryIndex(page, 2)
  await expect(page.getByRole('heading', { name: TOPIC.title, level: 1 })).toBeVisible()
})

test('malformed initial history normalizes to Today', async ({ page }) => {
  await openApp(page, {
    argusNavigation: 99,
    index: 7,
    route: { kind: 'topic', topicId: 'missing-topic' },
  })
  await expect(page.getByRole('button', { name: 'Today', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  expect(await navigationState(page)).toMatchObject({
    argusNavigation: 1,
    index: 0,
    route: { kind: 'section', view: 'today' },
  })
})

test('a valid stale Topic entry falls back to Library in place', async ({ page }) => {
  await openApp(page, {
    argusNavigation: 1,
    index: 4,
    route: { kind: 'topic', topicId: 'deleted-topic' },
  })
  await expect(page.getByRole('heading', { name: 'Library', level: 1 })).toBeVisible()
  expect(await navigationState(page)).toMatchObject({
    index: 4,
    route: { kind: 'section', view: 'library' },
  })
})

test('a reloaded run entry falls back to its safe origin instead of replaying Test', async ({ page }) => {
  await openApp(page, {
    argusNavigation: 1,
    index: 3,
    route: {
      kind: 'run',
      mode: 'test',
      topicIds: [TOPIC.id],
      origin: { kind: 'topic', topicId: TOPIC.id },
    },
  })
  await expect(page.getByRole('heading', { name: TOPIC.title, level: 1 })).toBeVisible()
  expect(await navigationState(page)).toMatchObject({
    index: 3,
    route: { kind: 'topic', topicId: TOPIC.id },
  })
})

test('Back from the Today root is left to the browser instead of being trapped', async ({ page }) => {
  await page.goto('data:text/html,<title>External</title><p>External page</p>')
  await installLibrary(page)
  await page.goto('./')
  await expect(page.getByRole('button', { name: 'Today', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )

  await page.goBack()
  await expect(page).toHaveURL(/^data:text\/html/)
})
