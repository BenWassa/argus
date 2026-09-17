import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { seedLibrary } from '../src/domain/library/catalogSeed'
import type { Topic } from '../src/domain/library/topic'

/**
 * Targeted practice, end to end through the real route model (#92 batch 5).
 *
 * The component tests already prove what practice asks and that it writes
 * nothing. What only a browser can prove is the seam between them: that the
 * end screen's offer actually reaches `App.start` with the right items, that
 * the resulting entry replaces the finished check rather than stacking on it,
 * and that a reload of a practice entry falls back to its origin instead of
 * silently restarting a run.
 */

const STORE_KEY = 'argus.library.v5'
const SPLASH_KEY = 'argus-splash-seen'
const NATO_ID = 'nato-phonetic'

const shippedCatalog = JSON.parse(
  readFileSync(fileURLToPath(new URL('../src/domain/library/shippedCatalog.json', import.meta.url)), 'utf8'),
) as { topicIds: string[] }

const seeded = seedLibrary()
const source = seeded.topics.find((topic) => topic.id === NATO_ID)
if (!source) throw new Error('Seeded NATO topic missing')

/** Read today, so the Test is due right now. */
const nato: Topic = {
  ...source,
  status: 'learning',
  learningAt: '2026-01-01T00:00:00.000Z',
  drilledAt: null,
  completedAt: null,
  lastTestedAt: null,
  spotCheckedAt: null,
  history: [],
}

const LIBRARY = JSON.stringify({
  version: 5,
  topics: [nato],
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

async function route(page: Page) {
  return page.evaluate(
    () =>
      (
        window.history.state as {
          route: { kind: string; mode?: string; target?: { kind: string; itemIds?: string[] } }
        }
      ).route,
  )
}

async function storedTopic(page: Page) {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw).topics as Topic[])[0] : null
  }, STORE_KEY)
}

/**
 * Run the whole NATO deck, marking the first `wrongCount` cards incorrect.
 *
 * Reveal is space and the grades are the arrow keys the swipe maps onto, which
 * keeps this driving the shipped interaction rather than a test-only path.
 */
async function runDeck(page: Page, wrongCount: number) {
  for (let i = 0; i < nato.items.length; i += 1) {
    if ((await page.locator('.session-done').count()) > 0) break
    await expect(page.locator('.flip-card')).toBeVisible()
    const prompt = await page.locator('#prompt-heading').textContent()
    await page.keyboard.press(' ')
    await page.keyboard.press(i < wrongCount ? 'ArrowLeft' : 'ArrowRight')
    // The card leaves under a spring and the next index moves only once that
    // exit completes, so a fixed delay would drop grades on a slow machine.
    // Wait for the prompt to actually turn over — or for the run to end, which
    // removes the heading entirely and is why this reads the count first.
    await expect
      .poll(
        async () => {
          if ((await page.locator('.session-done').count()) > 0) return 'done'
          return page.locator('#prompt-heading').textContent().catch(() => null)
        },
        { timeout: 15000 },
      )
      .not.toBe(prompt)
  }
  await expect(page.locator('.session-done')).toBeVisible()
}

async function startCheck(page: Page) {
  await page.getByRole('button', { name: /NATO phonetic alphabet/ }).first().click()
  await expect(page.locator('.flip-card')).toBeVisible()
}

/**
 * These are route and evidence contracts rather than rendering ones, and each
 * drives a full twenty-six card deck. Running them on all four viewports would
 * triple the browser suite to re-prove the same logic, so they run on one.
 * Practice's phone rendering is covered by the same responsive rules as every
 * other session surface.
 */
test.beforeEach(async ({}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-pointer', 'route contract, not a layout contract')
})

test('a missed check offers practice, which asks those items and banks nothing', async ({
  page,
}) => {
  await openApp(page)
  await startCheck(page)

  const before = await storedTopic(page)
  await runDeck(page, 2)

  // The end screen names the damage in items, not in directions or percentages.
  const offer = page.getByRole('button', { name: 'Practise 2 items' })
  await expect(offer).toBeVisible()

  const afterCheck = await storedTopic(page)
  expect(afterCheck?.history.length).toBe(1)
  expect(afterCheck?.lastTestedAt).not.toBe(before?.lastTestedAt)

  await offer.click()

  // The practice entry replaced the finished check rather than stacking on it,
  // and it carries exactly the two items that were missed.
  const practiceRoute = await route(page)
  expect(practiceRoute.kind).toBe('run')
  expect(practiceRoute.mode).toBe('learn')
  expect(practiceRoute.target?.kind).toBe('practice')
  expect(practiceRoute.target?.itemIds).toHaveLength(2)

  await expect(page.locator('.practice-question')).toBeVisible()

  // Work through it. Every answer right, so it ends after exactly two.
  for (let i = 0; i < 2; i += 1) {
    await page.getByRole('button', { name: 'Reveal answer' }).click()
    await page.getByRole('button', { name: 'Got it' }).click()
  }

  await expect(page.getByRole('heading', { name: 'Practice done' })).toBeVisible()

  // The whole point: practice changed nothing the check had just written.
  const afterPractice = await storedTopic(page)
  expect(afterPractice).toEqual(afterCheck)
})

test('practice hands back to the check rather than banking on its own', async ({ page }) => {
  await openApp(page)
  await startCheck(page)
  await runDeck(page, 1)

  await page.getByRole('button', { name: 'Practise 1 item' }).click()
  await page.getByRole('button', { name: 'Reveal answer' }).click()
  await page.getByRole('button', { name: 'Got it' }).click()

  await expect(page.getByRole('heading', { name: 'Practice done' })).toBeVisible()
  const summary = await page.locator('.practice-summary').textContent()
  expect(summary).toContain('Nothing was recorded and nothing moved')

  await page.getByRole('button', { name: 'Take the check' }).click()
  await expect(page.locator('.flip-card')).toBeVisible()
})

test('a reloaded practice entry falls back to its origin instead of restarting', async ({
  page,
}) => {
  await openApp(page)
  await startCheck(page)
  await runDeck(page, 1)
  await page.getByRole('button', { name: 'Practise 1 item' }).click()
  await expect(page.locator('.practice-question')).toBeVisible()

  await page.reload()

  // Practice persists nothing, so restoring it would silently restart a run the
  // learner did not ask for. It falls back the way replay and checkpoints do.
  await expect(page.locator('.practice-question')).toHaveCount(0)
  const restored = await route(page)
  expect(restored.kind).not.toBe('run')
})

test('a clean check offers no practice at all', async ({ page }) => {
  await openApp(page)
  await startCheck(page)
  await runDeck(page, 0)

  await expect(page.locator('.practice-offer')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Back to today' })).toBeVisible()
})
