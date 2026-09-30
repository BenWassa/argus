import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { MORSE_LETTERS, type MorseLetter } from '../src/domain/morse/code'
import { lessonPackets } from '../src/domain/morse/curriculum/lesson'
import { seedLibrary } from '../src/domain/library/catalogSeed'
import type { Topic } from '../src/domain/library/topic'
import type { ItemLessonStore, MorseReviewProgress } from '../src/domain/morse/progress'

/**
 * A learner who reached the end of the thirteen lessons the ordinary way, with
 * the review history that leaves behind — not a fixture with the readiness
 * anchor faked. Q and Y are taught in the last lesson, so nothing inside the
 * course could confirm them in a later sitting, and before the after-course
 * run this learner could never reach a Test that counted.
 */

const STORE_KEY = 'argus.library.v5'
const SPLASH_KEY = 'argus-splash-seen'
const MORSE_ID = 'international-morse-letters-printed'

const shippedCatalog = JSON.parse(
  readFileSync(fileURLToPath(new URL('../src/domain/library/shippedCatalog.json', import.meta.url)), 'utf8'),
) as { topicIds: string[] }

const source = seedLibrary().topics.find((topic) => topic.id === MORSE_ID)
if (!source) throw new Error('Seeded Morse topic missing')

function itemId(glyph: string): string {
  const item = source!.items.find((candidate) => candidate.prompt === glyph)
  if (!item?.id) throw new Error(`Missing item for ${glyph}`)
  return item.id
}

function finishedCourse(): string {
  const packets = lessonPackets()
  const lessonProgress: ItemLessonStore = {}
  const review: MorseReviewProgress = { sittings: packets.length, items: {} }
  packets.forEach((packet, sitting) => {
    for (const glyph of packet.novel) {
      lessonProgress[itemId(glyph)] = 'settled'
      review.items[itemId(glyph)] = {
        // Sitting ordinals are 1-based: lesson n is sitting n.
        introducedIn: sitting + 1,
        lastSeenIn: packets.length,
        // Confirmed in a later sitting, except what the last lesson taught.
        laterCorrect: sitting < packets.length - 1 ? 1 : 0,
        printed: 3,
        heard: 0,
        heardCorrect: 0,
      }
    }
  })
  const morse: Topic = {
    ...source!,
    status: 'learning',
    learningAt: new Date().toISOString(),
    drilledAt: null,
    completedAt: null,
    lastTestedAt: null,
    spotCheckedAt: null,
    history: [],
    lessonProgress,
    morseReview: review,
  }
  return JSON.stringify({ version: 5, topics: [morse], catalogDelivered: [...shippedCatalog.topicIds].sort() })
}

async function openMorse(page: Page) {
  await page.addInitScript(
    ([lib, storeKey, splashKey]) => {
      window.localStorage.setItem(splashKey, 'true')
      // Only the first load plants the fixture; a reload keeps what the run wrote.
      if (window.localStorage.getItem(storeKey) === null) window.localStorage.setItem(storeKey, lib)
    },
    [finishedCourse(), STORE_KEY, SPLASH_KEY] as const,
  )
  await page.goto('./')
  await page.locator('.nav-btn', { hasText: 'Library' }).click()
  await page.getByRole('button', { name: /International Morse/ }).click()
}

/** Answer every keyed check correctly until the run's end screen. */
async function driveToEnd(page: Page) {
  for (let step = 0; step < 40; step += 1) {
    if (await page.locator('.lesson-exits').isVisible()) return
    const cantListen = page.getByRole('button', { name: /listen now/ })
    if (await cantListen.isVisible()) {
      await cantListen.click()
      continue
    }
    await expect(page.locator('.morse-key')).toBeEnabled({ timeout: 4_000 })
    const glyph = (await page.locator('.lesson-glyph').first().textContent())?.trim() as MorseLetter | undefined
    if (!glyph) throw new Error('Expected a keyed check glyph on screen.')
    await page.keyboard.type(MORSE_LETTERS[glyph])
    await expect(
      page.locator('.morse-key:enabled, .lesson-exits, button:has-text("listen now")').first(),
    ).toBeVisible({ timeout: 4_000 })
  }
  throw new Error('The after-course run did not end within 40 steps.')
}

test('a finished course goes over the letters it still owes, then its Test counts', async ({ page }) => {
  await openMorse(page)

  // Not lesson 13 again: the page names what is left and offers going over it.
  await expect(page.locator('.topic-primary')).toContainText('Go over missed letters')
  await expect(page.getByText('Still to confirm: Y Q')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Go over Y, Q' })).toBeVisible()

  await page.locator('.topic-primary').click()
  await expect(page.locator('.session-mode')).toHaveText('Going over')
  // The keyed run asks the owed letters, and introduces nothing.
  await expect(page.getByRole('button', { name: 'Got it' })).toHaveCount(0)
  await driveToEnd(page)

  await expect(page.getByRole('heading', { name: 'Every letter confirmed' })).toBeVisible()
  const stored = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? '{}'), STORE_KEY)
  const morse = (stored.topics as Topic[]).find((topic) => topic.id === MORSE_ID)
  expect(morse?.acquisitionReadyAt).toBeTruthy()
  // Learn still moved nothing on the ladder.
  expect(morse?.status).toBe('learning')
  expect(morse?.history).toEqual([])

  await page.getByRole('button', { name: 'Done' }).click()
  await expect(page.locator('.topic-primary')).toContainText('Test')
  await expect(page.getByRole('button', { name: /^Go over/ })).toHaveCount(0)
})
