import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { seedLibrary } from '../src/domain/library/catalogSeed'
import type { Topic } from '../src/domain/library/topic'
import { openFinishedLessons } from './support'
import { MORSE_TRANSITION_MS } from '../src/domain/morse/response'

/**
 * The transition that follows a dismissed correction, with margin for CI
 * jitter. There is no miss dwell to add any more: a correction stands until the
 * learner presses `Continue`, so the wait begins at the press.
 */
const MISS_TRANSITION_TIMEOUT = MORSE_TRANSITION_MS + 2_000

/** Dismiss a correction the way a learner does. */
async function continueFromMiss(page: Page) {
  await page.getByRole('button', { name: 'Continue' }).click()
}

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
      window.localStorage.setItem(splashKey, 'true')
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

/**
 * The Morse topic page, which is where the curriculum lives. Opening it does not
 * mark the topic learning: reading a path is not learning an alphabet, and the
 * tests below depend on the stored record being untouched until a lesson runs.
 */
async function openMorseTopic(page: Page) {
  await page.getByRole('button', { name: 'Library', exact: true }).click()
  await page.locator(`[data-row="${MORSE_ID}"]`).click()
  await expect(page.getByRole('heading', { name: morse.title, level: 1 })).toBeVisible()
}

async function finishCheckpointWarmups(page: Page) {
  await keyPattern(page, '.')
  await expect(page.getByText('2/4', { exact: true })).toBeVisible({ timeout: 2_000 })
  await keyPattern(page, '-')
  await expect(page.getByText('3/4', { exact: true })).toBeVisible({ timeout: 2_000 })
  await keyPattern(page, '.-')
  await expect(page.getByText('4/4', { exact: true })).toBeVisible({ timeout: 2_000 })
  await keyPattern(page, '..-')
  await expect(page.getByText('1/1', { exact: true })).toBeVisible({ timeout: 2_000 })
}

test('the alphabet returns to the lesson it was opened from, not past it', async ({ page }) => {
  await openApp(page)

  // The docket resumes the curriculum directly.
  await page.locator('.docket .index-row').click()
  await expect(page.locator('.morse-lesson')).toBeVisible()
  expect(await state(page)).toMatchObject({ index: 1, route: { kind: 'run', mode: 'learn' } })

  await page.getByRole('button', { name: 'Morse alphabet' }).click()
  await expect(page.getByRole('heading', { name: 'Morse alphabet', level: 1 })).toBeVisible()
  expect(await state(page)).toMatchObject({ index: 2, route: { kind: 'reference', topicId: MORSE_ID } })

  // The change this replaces: Back used to abandon the lesson and land on the
  // Topic page, which is why App had to rewrite the run entry into a Topic entry
  // on the way in. The sitting is durable, so Back now returns to the lesson.
  await page.evaluate(() => window.history.back())
  await expect(page.locator('.morse-lesson')).toBeVisible()
  expect(await state(page)).toMatchObject({ index: 1, route: { kind: 'run', mode: 'learn' } })

  await page.evaluate(() => window.history.back())
  await expect(page.getByRole('button', { name: 'Today', exact: true })).toHaveAttribute(
    'aria-current',
    'page',
  )
  expect((await state(page)).index).toBe(0)
})

test('opening Morse lands on the curriculum, with the alphabet a step away', async ({ page }) => {
  await openApp(page)
  await openMorseTopic(page)

  const path = page.getByRole('list', { name: 'Morse curriculum' })
  await expect(path.locator('.morse-path-lesson')).toHaveCount(13)
  await expect(path.locator('.morse-path-checkpoint')).toHaveCount(4)
  await expect(path.locator('.morse-path-check')).toHaveCount(1)
  expect(await state(page)).toMatchObject({ index: 2, route: { kind: 'topic', topicId: MORSE_ID } })

  // Twenty-six lookup cards no longer sit above the curriculum on this page.
  await expect(page.locator('.morse-ref-card')).toHaveCount(0)
  await page.getByRole('button', { name: 'Morse alphabet' }).click()
  await expect(page.getByRole('heading', { name: 'Morse alphabet', level: 1 })).toBeVisible()
  expect(await state(page)).toMatchObject({
    index: 3,
    route: { kind: 'reference', topicId: MORSE_ID, origin: { kind: 'topic', topicId: MORSE_ID } },
  })

  await page.evaluate(() => window.history.back())
  const heading = page.getByRole('heading', { name: morse.title, level: 1 })
  await expect(heading).toBeVisible()
  await expect(heading).toBeFocused()
})

test('a lesson replay reruns the real lesson, writes nothing and returns to the curriculum', async ({ page }) => {
  await openApp(page)
  await openMorseTopic(page)

  const before = await page.evaluate((key) => window.localStorage.getItem(key), STORE_KEY)
  const onTopic = await state(page)
  await openFinishedLessons(page)
  await page.getByRole('button', { name: 'Replay lesson 1', exact: true }).click()

  // #117: the same lesson, not a stripped quiz. The first-exposure
  // introduction is back, with the rhythmic mnemonic, the canonical notation
  // and the sound that teach the letter.
  await expect(page.getByLabel('Lesson 1 of 13')).toBeVisible()
  await expect(page.locator('.session-mode')).toHaveText('Replay')
  await expect(page.getByText('New letter', { exact: true })).toBeVisible()
  await expect(page.locator('.morse-phrase')).toBeVisible()
  await expect(page.locator('.morse-notation')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Got it' })).toBeVisible()

  // A replay is a task, so it is a route: Android Back leaves it the same way
  // the visible Close does, rather than unwinding an invisible selection.
  expect(await state(page)).toMatchObject({
    index: onTopic.index + 1,
    route: { kind: 'run', mode: 'learn' },
  })

  // Acknowledging an introduction is a durable write in ordinary acquisition.
  // In a replay it must reach nothing at all, so the check below is taken after
  // the learner has actually moved through part of the lesson.
  await page.getByRole('button', { name: 'Got it' }).click()
  await expect(page.locator('.lesson-check, .lesson-introduce')).toBeVisible()

  await page.getByRole('button', { name: 'Close' }).click()
  await expect(page.getByRole('heading', { name: morse.title, level: 1 })).toBeFocused()
  expect(await page.evaluate((key) => window.localStorage.getItem(key), STORE_KEY)).toBe(before)
  expect(await state(page)).toEqual(onTopic)
})

test('unlocked word checkpoint holds a miss until dismissed and never mutates saved Learn or Test state', async ({ page }) => {
  await openApp(page)
  await openMorseTopic(page)

  const before = await page.evaluate((key) => window.localStorage.getItem(key), STORE_KEY)
  const onTopic = await state(page)
  await openFinishedLessons(page)
  await page.getByRole('button', { name: 'Start word checkpoint after lesson 4' }).click()

  await expect(page.getByText('Checkpoint', { exact: true })).toBeVisible()
  await expect(page.getByText('1/4', { exact: true })).toBeVisible()

  // E expects one element. A dah is immediately a miss: there is no edit
  // opportunity, the correction then stands until it is dismissed, and #115
  // never requeues the missed warm-up inside the following word.
  await keyPattern(page, '-')
  await expect(page.getByRole('status')).toContainText('Miss')
  // The correction holds: the counter has not moved off 1/4 on its own.
  await expect(page.getByText('1/4', { exact: true })).toBeVisible()
  await continueFromMiss(page)
  await expect(page.getByText('2/4', { exact: true })).toBeVisible({ timeout: MISS_TRANSITION_TIMEOUT })

  await keyPattern(page, '-')
  await expect(page.getByText('3/4', { exact: true })).toBeVisible({ timeout: 2_000 })
  await keyPattern(page, '.-')
  await expect(page.getByText('4/4', { exact: true })).toBeVisible({ timeout: 2_000 })
  await keyPattern(page, '..-')
  await expect(page.getByText('1/1', { exact: true })).toBeVisible({ timeout: 2_000 })

  const word = page.locator('.morse-checkpoint-word')
  await expect(word).toHaveText('TIME')
  await expect(word.locator('.is-current')).toHaveText('T')

  // Miss T, then prove the run still advances through I, M and E contiguously.
  await keyPattern(page, '.')
  await expect(page.getByRole('status')).toContainText('Miss')
  await expect(word.locator('.is-current')).toHaveText('T')
  await continueFromMiss(page)
  await expect(word.locator('.is-current')).toHaveText('I', { timeout: MISS_TRANSITION_TIMEOUT })
  await keyPattern(page, '..')
  await expect(word.locator('.is-current')).toHaveText('M', { timeout: 2_000 })
  await keyPattern(page, '--')
  await expect(word.locator('.is-current')).toHaveText('E', { timeout: 2_000 })
  await keyPattern(page, '.')

  await expect(page.getByRole('heading', { name: 'Checkpoint done' })).toBeVisible({ timeout: 2_000 })
  await expect(page.getByText('6 of 8 correct')).toBeVisible()
  await expect(page.getByText(/changed saved progress/)).toBeVisible()
  expect(await page.evaluate((key) => window.localStorage.getItem(key), STORE_KEY)).toBe(before)

  await page.getByRole('button', { name: 'Back to lessons' }).click()
  await expect(page.getByRole('heading', { name: morse.title, level: 1 })).toBeFocused()
  await openFinishedLessons(page)
  await expect(page.getByRole('button', { name: 'Start word checkpoint after lesson 4' })).toBeVisible()
  expect(await page.evaluate((key) => window.localStorage.getItem(key), STORE_KEY)).toBe(before)
  expect(await state(page)).toEqual(onTopic)
})

test('word checkpoint remains usable at phone width and 200% text with the whole word visible', async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.startsWith('phone-'), 'phone-width checkpoint rendering contract')
  await openApp(page)
  await openMorseTopic(page)
  await openFinishedLessons(page)
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
  await openMorseTopic(page)
  await page.getByRole('button', { name: 'Morse alphabet' }).click()

  await expect(page.getByRole('heading', { name: 'Morse alphabet', level: 1 })).toBeVisible()
  await expect(page.getByText('Show all 26 items')).toHaveCount(0)

  const cards = page.locator('.morse-ref-card:not(.is-extra)')
  await expect(cards).toHaveCount(26)
  // Figures and punctuation follow the alphabet on the standalone page.
  await expect(page.locator('.morse-ref-card.is-extra')).toHaveCount(14)
  await expect(cards.first().locator('.morse-ref-letter')).toHaveText('A')
  await expect(cards.first().locator('.morse-ref-pattern')).toContainText('· —')
  await expect(cards.first().locator('.morse-ref-mnemonic')).toHaveText('A LONG')
  const play = cards.first().getByRole('button', { name: 'Play A Morse' })
  await expect(play).toBeVisible()
  expect(await play.evaluate((button) => Math.min(button.getBoundingClientRect().width, button.getBoundingClientRect().height))).toBeGreaterThanOrEqual(44)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)

  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  expect(await page.locator('.morse-ref-card').evaluateAll((elements) => elements.every((card) => {
    const bounds = card.getBoundingClientRect()
    return bounds.left >= 0 && bounds.right <= window.innerWidth && card.scrollWidth <= card.clientWidth
  }))).toBe(true)
})

test('reference playback does not write learner state', async ({ page }) => {
  await openApp(page)
  await openMorseTopic(page)
  await page.getByRole('button', { name: 'Morse alphabet' }).click()

  const before = await page.evaluate((key) => window.localStorage.getItem(key), STORE_KEY)
  await page.getByRole('button', { name: 'Play A Morse' }).click()
  await expect(page.getByRole('button', { name: /Stop A Morse|Play A Morse/ })).toBeVisible()
  expect(await page.evaluate((key) => window.localStorage.getItem(key), STORE_KEY)).toBe(before)
})
