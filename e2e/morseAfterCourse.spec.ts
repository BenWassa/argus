import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { lessonPackets } from '../src/domain/morse/curriculum/lesson'
import { seedLibrary } from '../src/domain/library/catalogSeed'
import type { Topic } from '../src/domain/library/topic'
import type { ItemLessonStore, MorseReviewProgress } from '../src/domain/morse/progress'

/** Historical course completion needs no fabricated scored Test evidence. */

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

test('the completed legacy course is Learned without a consolidation run or required Test', async ({ page }) => {
  await openMorse(page)
  await expect(page.getByRole('button', { name: /A–Z Test, available/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /^Go over/ })).toHaveCount(0)
  await expect(page.getByText('Learned · Test optional', { exact: true })).toBeVisible()

  const stored = await page.evaluate((key) => JSON.parse(window.localStorage.getItem(key) ?? '{}'), STORE_KEY)
  const morse = (stored.topics as Topic[]).find((topic) => topic.id === MORSE_ID)
  expect(morse?.history).toEqual([])
  expect(Object.values(morse?.lessonProgress ?? {}).every((support) => support === 'settled')).toBe(true)

  await page.reload()
  await page.locator('.nav-btn', { hasText: 'Library' }).click()
  await page.getByRole('button', { name: /International Morse/ }).click()
  await expect(page.getByRole('button', { name: /A–Z Test, available/ })).toBeVisible()
})
