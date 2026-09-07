import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { seedLibrary } from '../src/lib/seed'
import type { Topic } from '../src/lib/types'

const STORE_KEY = 'argus.library.v5'
const SPLASH_KEY = 'argus-splash-seen'
const MORSE_ID = 'international-morse-letters-printed'

const shippedCatalog = JSON.parse(
  readFileSync(fileURLToPath(new URL('../src/lib/shippedCatalog.json', import.meta.url)), 'utf8'),
) as { topicIds: string[] }

const seeded = seedLibrary()
const source = seeded.topics.find((topic) => topic.id === MORSE_ID)
if (!source) throw new Error('Seeded Morse topic missing')

const morse: Topic = {
  ...source,
  status: 'unstarted',
  drilledAt: null,
  learningAt: null,
  completedAt: null,
  lastTestedAt: null,
  spotCheckedAt: null,
  history: [],
  lessonProgress: Object.fromEntries(
    source.items.map((item) => {
      if (!item.id) throw new Error('Seeded Morse item missing id')
      return [item.id, 'settled']
    }),
  ),
}

const LIBRARY = JSON.stringify({
  version: 5,
  topics: [morse],
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

async function state(page: Page) {
  return page.evaluate(() => window.history.state as {
    index: number
    route: { kind: string; topicId?: string; origin?: { kind: string; topicId?: string } }
  })
}

test('Learn opened from Today still closes Morse reference to Topic, then Today', async ({ page }) => {
  await openApp(page)

  await page.locator('.docket .index-row').click()
  await expect(page.getByRole('heading', { name: 'Learn Morse A–Z' })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Morse lesson path' }).getByRole('listitem')).toHaveCount(13)
  expect(await state(page)).toMatchObject({
    index: 1,
    route: { kind: 'run' },
  })

  await page.getByRole('button', { name: 'Morse alphabet' }).click()
  await expect(page.getByRole('heading', { name: 'Morse alphabet', level: 1 })).toBeVisible()
  expect(await state(page)).toMatchObject({
    index: 2,
    route: {
      kind: 'reference',
      topicId: MORSE_ID,
      origin: { kind: 'topic', topicId: MORSE_ID },
    },
  })

  await page.evaluate(() => window.history.back())
  const topicHeading = page.getByRole('heading', { name: source.title, level: 1 })
  await expect(topicHeading).toBeVisible()
  await expect(topicHeading).toBeFocused()
  expect(await state(page)).toMatchObject({
    index: 1,
    route: { kind: 'topic', topicId: MORSE_ID },
  })

  await page.evaluate(() => window.history.back())
  await expect(page.getByRole('button', { name: 'Today', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  await expect(page.locator('#main')).toBeFocused()
  expect((await state(page)).index).toBe(0)

  await page.evaluate(() => window.history.forward())
  await expect(page.getByRole('heading', { name: source.title, level: 1 })).toBeVisible()
  await page.evaluate(() => window.history.forward())
  await expect(page.getByRole('heading', { name: 'Morse alphabet', level: 1 })).toBeVisible()
})

test('completed lesson replay stays inside Learn history and never mutates the saved topic', async ({ page }) => {
  await openApp(page)
  await page.locator('.docket .index-row').click()

  const before = await page.evaluate((key) => window.localStorage.getItem(key), STORE_KEY)
  const historyBefore = await state(page)
  await page.getByRole('list', { name: 'Morse lesson path' }).getByRole('button', { name: 'Replay' }).first().click()

  await expect(page.getByRole('heading', { name: 'Replay Morse lesson 1' })).toBeVisible()
  await expect(page.getByText('0 / 10 max')).toBeVisible()
  expect(await state(page)).toEqual(historyBefore)

  await page.getByRole('button', { name: 'Close' }).click()
  await expect(page.getByRole('heading', { name: 'Learn Morse A–Z' })).toBeFocused()
  expect(await page.evaluate((key) => window.localStorage.getItem(key), STORE_KEY)).toBe(before)
  expect(await state(page)).toEqual(historyBefore)
})

test('reference cards keep the phone hierarchy without horizontal overflow', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('phone-'), 'phone-width rendering contract')
  await openApp(page)
  await page.getByRole('button', { name: 'Library', exact: true }).click()
  await page.locator(`[data-row="${MORSE_ID}"]`).click()

  await expect(page.getByRole('heading', { name: 'Morse alphabet', level: 2 })).toBeVisible()
  await expect(page.getByText('Show all 26 items')).toHaveCount(0)

  const cards = page.locator('.morse-ref-card')
  await expect(cards).toHaveCount(26)
  await expect(cards.first().locator('.morse-ref-letter')).toHaveText('A')
  await expect(cards.first().locator('.morse-ref-pattern')).toContainText('· —')
  await expect(cards.first().locator('.morse-ref-mnemonic')).toHaveText('A LONG')
  const play = cards.first().getByRole('button', { name: 'Play A Morse' })
  await expect(play).toBeVisible()
  expect(await play.evaluate((button) => Math.min(button.getBoundingClientRect().width, button.getBoundingClientRect().height))).toBeGreaterThanOrEqual(44)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('Topic reference playback does not write learner state', async ({ page }) => {
  await openApp(page)
  await page.getByRole('button', { name: 'Library', exact: true }).click()
  await page.locator(`[data-row="${MORSE_ID}"]`).click()

  const before = await page.evaluate((key) => window.localStorage.getItem(key), STORE_KEY)
  await page.getByRole('button', { name: 'Play A Morse' }).click()
  await expect(page.getByRole('button', { name: /Stop A Morse|Play A Morse/ })).toBeVisible()
  expect(await page.evaluate((key) => window.localStorage.getItem(key), STORE_KEY)).toBe(before)
})
