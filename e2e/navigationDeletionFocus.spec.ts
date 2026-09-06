import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import type { Topic } from '../src/lib/types'

const STORE_KEY = 'argus.library.v5'
const SPLASH_KEY = 'argus-splash-seen'
const TOPIC_ID = 'navigation-focus-topic'
const TOPIC_TITLE = 'Navigation focus topic'

const shippedCatalog = JSON.parse(
  readFileSync(fileURLToPath(new URL('../src/lib/shippedCatalog.json', import.meta.url)), 'utf8'),
) as { topicIds: string[] }

const topic: Topic = {
  id: TOPIC_ID,
  title: TOPIC_TITLE,
  scope: 'Two prompts used only for navigation focus and deletion coverage.',
  track: 'learning',
  items: [
    { id: 'focus-a', kind: 'forward', prompt: 'A', answer: 'Alpha' },
    { id: 'focus-b', kind: 'forward', prompt: 'B', answer: 'Bravo' },
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
  topics: [topic],
  catalogDelivered: [...shippedCatalog.topicIds].sort(),
})

async function openApp(page: Page) {
  await page.addInitScript(
    ([library, storeKey, splashKey]) => {
      window.sessionStorage.setItem(splashKey, 'true')
      window.localStorage.setItem(storeKey, library)
    },
    [LIBRARY, STORE_KEY, SPLASH_KEY] as const,
  )
  await page.goto('./')
}

async function historyIndex(page: Page) {
  return page.evaluate(() => (window.history.state as { index: number }).index)
}

test('section Back and Forward land focus on main', async ({ page }) => {
  await openApp(page)

  await page.getByRole('button', { name: 'Library', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Library', level: 1 })).toBeVisible()
  expect(await historyIndex(page)).toBe(1)

  await page.evaluate(() => window.history.back())
  await expect(page.getByRole('button', { name: 'Today', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page.locator('#main')).toBeFocused()
  expect(await historyIndex(page)).toBe(0)

  await page.evaluate(() => window.history.forward())
  await expect(page.getByRole('heading', { name: 'Library', level: 1 })).toBeVisible()
  await expect(page.locator('#main')).toBeFocused()
  expect(await historyIndex(page)).toBe(1)
})

test('deleting the open Topic returns through the existing Library entry', async ({ page }) => {
  await openApp(page)
  await page.getByRole('button', { name: 'Library', exact: true }).click()
  await page.locator(`[data-row="${TOPIC_ID}"]`).click()
  await expect(page.getByRole('heading', { name: TOPIC_TITLE, level: 1 })).toBeVisible()
  expect(await historyIndex(page)).toBe(2)

  await page.getByRole('button', { name: 'Delete topic' }).click()
  const confirm = page.getByRole('dialog', { name: 'Delete topic' })
  await expect(confirm).toBeVisible()
  await confirm.getByRole('button', { name: 'Delete topic', exact: true }).click()

  await expect(page.getByRole('heading', { name: 'Library', level: 1 })).toBeVisible()
  await expect(page.locator(`[data-row="${TOPIC_ID}"]`)).toHaveCount(0)
  await expect(page.locator('#main')).toBeFocused()
  await expect.poll(() => historyIndex(page)).toBe(1)

  await page.evaluate(() => window.history.back())
  await expect(page.getByRole('button', { name: 'Today', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  expect(await historyIndex(page)).toBe(0)
})
