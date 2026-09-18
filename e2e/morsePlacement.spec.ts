import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { MORSE_LETTERS, type MorseLetter } from '../src/domain/morse/code'
import { seedLibrary } from '../src/domain/library/catalogSeed'
import type { Topic } from '../src/domain/library/topic'

const STORE_KEY = 'argus.library.v5'
const SPLASH_KEY = 'argus-splash-seen'
const MORSE_ID = 'international-morse-letters-printed'

const shippedCatalog = JSON.parse(
  readFileSync(fileURLToPath(new URL('../src/domain/library/shippedCatalog.json', import.meta.url)), 'utf8'),
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
  itemEvidence: {},
  lessonProgress: {},
  lessonSitting: undefined,
  morseReview: undefined,
  acquisitionReadyAt: undefined,
}
const LIBRARY = JSON.stringify({
  version: 5,
  topics: [morse],
  catalogDelivered: [...shippedCatalog.topicIds].sort(),
})

async function openFreshMorse(page: Page) {
  await page.addInitScript(
    ([library, storeKey, splashKey]) => {
      window.localStorage.setItem(splashKey, 'true')
      window.localStorage.setItem(storeKey, library)
    },
    [LIBRARY, STORE_KEY, SPLASH_KEY] as const,
  )
  await page.goto('./')
  await page.getByRole('button', { name: 'Library', exact: true }).click()
  await page.locator(`[data-row="${MORSE_ID}"]`).click()
  await expect(page.getByRole('heading', { name: morse.title, level: 1 })).toBeVisible()
}

async function keyElement(page: Page, element: '.' | '-') {
  await expect(page.getByRole('button', { name: /Morse key/i })).toBeEnabled()
  await page.keyboard.press(element)
}

test('placement collects the learner-selected full pattern before grading and abandons cleanly', async ({ page }) => {
  await openFreshMorse(page)
  const before = await page.evaluate((key) => window.localStorage.getItem(key), STORE_KEY)

  await page.getByRole('button', { name: /start lesson/i }).click()
  await expect(page.getByRole('dialog', { name: 'Check your Morse level' })).toBeVisible()
  await page.getByRole('button', { name: /Know some Morse/i }).click()
  await expect(page.getByRole('dialog', { name: 'Morse placement check' })).toBeVisible()

  const glyph = ((await page.locator('.morse-placement-letter').textContent()) ?? '').trim() as MorseLetter
  const pattern = MORSE_LETTERS[glyph]
  expect(pattern).toBeTruthy()
  // The current canonical first target is one signal. This is the regression
  // case #107 got wrong: passing the true target length into MorseKeyInput made
  // the first signal auto-grade before the learner could express a longer belief.
  expect(pattern).toHaveLength(1)

  await keyElement(page, pattern[0] as '.' | '-')
  await expect(page.getByRole('button', { name: 'Check pattern' })).toBeEnabled()
  await expect(page.getByText('Correct', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Not quite', { exact: true })).toHaveCount(0)

  await page.getByRole('button', { name: 'Check pattern' }).click()
  await expect(page.getByText('Correct', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Exit placement check' }).click()
  await expect(page.getByRole('dialog', { name: 'Morse placement check' })).toHaveCount(0)
  expect(await page.evaluate((key) => window.localStorage.getItem(key), STORE_KEY)).toBe(before)
})
