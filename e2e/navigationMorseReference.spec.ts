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

async function keyPattern(page: Page, pattern: string) {
  // Since #87 the key is deliberately inert while the previous verdict stands
  // and through the transition behind it, so a letter is keyed once its target
  // is actually armed rather than typed blind into the boundary.
  await expect(page.locator('.morse-key')).toBeEnabled({ timeout: 4_000 })
  await page.keyboard.type(pattern)
}

async function waitForLearnFirstExposure(page: Page) {
  await expect.poll(async () => {
    const raw = await page.evaluate((key) => window.localStorage.getItem(key), STORE_KEY)
    if (!raw) return { status: null, hasLearningAt: false }

    const stored = JSON.parse(raw) as { topics: Topic[] }
    const topic = stored.topics.find((candidate) => candidate.id === MORSE_ID)
    return {
      status: topic?.status ?? null,
      hasLearningAt: typeof topic?.learningAt === 'string',
    }
  }).toEqual({ status: 'learning', hasLearningAt: true })
}

async function finishCheckpointWarmups(page: Page) {
  await keyPattern(page, '.')
  await expect(page.getByText('Warm-up 2 of 4', { exact: true })).toBeVisible({ timeout: 2_000 })
  await keyPattern(page, '-')
  await expect(page.getByText('Warm-up 3 of 4', { exact: true })).toBeVisible({ timeout: 2_000 })
  await keyPattern(page, '.-')
  await expect(page.getByText('Warm-up 4 of 4', { exact: true })).toBeVisible({ timeout: 2_000 })
  await keyPattern(page, '..-')
  await expect(page.getByText('Word 1 of 1', { exact: true })).toBeVisible({ timeout: 2_000 })
}

test('Learn opened from Today still closes Morse reference to Topic, then Today', async ({ page }) => {
  await openApp(page)

  await page.locator('.docket .index-row').click()
  await expect(page.getByRole('heading', { name: 'Learn Morse A–Z' })).toBeVisible()
  const path = page.getByRole('list', { name: 'Morse lesson path' })
  await expect(path.locator('.morse-path-lesson')).toHaveCount(13)
  await expect(path.locator('.morse-path-checkpoint')).toHaveCount(2)
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
  await waitForLearnFirstExposure(page)

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

test('unlocked word checkpoint auto-advances through a miss and never mutates saved Learn or Test state', async ({ page }) => {
  await openApp(page)
  await page.locator('.docket .index-row').click()
  await waitForLearnFirstExposure(page)

  const before = await page.evaluate((key) => window.localStorage.getItem(key), STORE_KEY)
  const historyBefore = await state(page)
  await page.getByRole('button', { name: 'Start word checkpoint after lesson 4' }).click()

  await expect(page.getByText('Checkpoint after lesson 4', { exact: true })).toBeVisible()
  await expect(page.getByText('Warm-up 1 of 4', { exact: true })).toBeVisible()
  expect(await state(page)).toEqual(historyBefore)

  // E expects one element. A dah is immediately a miss; there is no edit or
  // confirmation opportunity before the checkpoint moves on.
  await keyPattern(page, '-')
  await expect(page.getByRole('status')).toContainText('Miss')
  await expect(page.getByText('Warm-up 2 of 4', { exact: true })).toBeVisible({ timeout: 2_000 })

  await keyPattern(page, '-')
  await expect(page.getByText('Warm-up 3 of 4', { exact: true })).toBeVisible({ timeout: 2_000 })
  await keyPattern(page, '.-')
  await expect(page.getByText('Warm-up 4 of 4', { exact: true })).toBeVisible({ timeout: 2_000 })
  await keyPattern(page, '..-')
  await expect(page.getByText('Word 1 of 1', { exact: true })).toBeVisible({ timeout: 2_000 })

  const word = page.locator('.morse-checkpoint-word')
  await expect(word).toHaveText('TIME')
  await expect(word.locator('.is-current')).toHaveText('T')

  await keyPattern(page, '-')
  await expect(word.locator('.is-current')).toHaveText('I', { timeout: 2_000 })
  await keyPattern(page, '..')
  await expect(word.locator('.is-current')).toHaveText('M', { timeout: 2_000 })
  await keyPattern(page, '--')
  await expect(word.locator('.is-current')).toHaveText('E', { timeout: 2_000 })
  await keyPattern(page, '.')

  await expect(page.getByRole('heading', { name: 'Word checkpoint complete' })).toBeVisible({ timeout: 2_000 })
  expect(await page.evaluate((key) => window.localStorage.getItem(key), STORE_KEY)).toBe(before)
  expect(await state(page)).toEqual(historyBefore)

  await page.getByRole('button', { name: 'Back to lessons' }).click()
  await expect(page.getByRole('heading', { name: 'Learn Morse A–Z' })).toBeFocused()
  await expect(page.getByRole('button', { name: 'Start word checkpoint after lesson 4' })).toBeVisible()
  expect(await page.evaluate((key) => window.localStorage.getItem(key), STORE_KEY)).toBe(before)
  expect(await state(page)).toEqual(historyBefore)
})

test('word checkpoint remains usable at phone width and 200% text with the whole word visible', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('phone-'), 'phone-width checkpoint rendering contract')
  await openApp(page)
  await page.locator('.docket .index-row').click()
  await page.getByRole('button', { name: 'Start word checkpoint after lesson 4' }).click()
  await finishCheckpointWarmups(page)

  const target = page.locator('.morse-checkpoint-target')
  const word = page.locator('.morse-checkpoint-word')
  await expect(word).toHaveText('TIME')
  await expect(word.locator('.is-current')).toHaveText('T')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(await target.evaluate((element) => {
    const bounds = element.getBoundingClientRect()
    return bounds.left >= 0 && bounds.right <= window.innerWidth && element.scrollWidth <= element.clientWidth
  })).toBe(true)

  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  await expect(word).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  expect(await target.evaluate((element) => {
    const bounds = element.getBoundingClientRect()
    return bounds.left >= 0 && bounds.right <= window.innerWidth && element.scrollWidth <= element.clientWidth
  })).toBe(true)
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
  expect(await cards.evaluateAll((elements) => elements.every((card) => {
    const bounds = card.getBoundingClientRect()
    return bounds.left >= 0 && bounds.right <= window.innerWidth && card.scrollWidth <= card.clientWidth
  }))).toBe(true)
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
