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
  await expect(page.getByRole('heading', { name: 'You have been through every letter' })).toBeVisible()
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
