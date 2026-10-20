import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { seedLibrary } from '../src/domain/library/catalogSeed'
import type { Topic } from '../src/domain/library/topic'
import { lessonPackets } from '../src/domain/morse/curriculum/lesson'

/**
 * Open path, safe content (#257). The owner's rule is "no forced path": every
 * level stays open. What a browser proves here is that an open level never
 * puts an untaught letter in front of a part-way learner, that anything that
 * cannot start says why in one line instead of doing nothing, and that the
 * header keeps the course status in view when the path opens at the position.
 */

const STORE_KEY = 'argus.library.v5'
const SPLASH_KEY = 'argus-splash-seen'
const MORSE_ID = 'international-morse-letters-printed'

const shippedCatalog = JSON.parse(
  readFileSync(fileURLToPath(new URL('../src/domain/library/shippedCatalog.json', import.meta.url)), 'utf8'),
) as { topicIds: string[] }

const source = seedLibrary().topics.find((topic) => topic.id === MORSE_ID)
if (!source) throw new Error('Seeded Morse topic missing')

/** A learner with the first `lessons` lessons settled. */
function learner(lessons: number): { library: string; taught: Set<string> } {
  const taught = new Set<string>(lessonPackets().slice(0, lessons).flatMap((packet) => packet.characters))
  const topic: Topic = {
    ...source!,
    status: lessons ? 'learning' : 'unstarted',
    learningAt: lessons ? '2026-01-01T00:00:00.000Z' : null,
    lessonProgress: Object.fromEntries(source!.items.filter((item) => taught.has(item.prompt)).map((item) => [item.id!, 'settled'])),
  }
  return {
    taught,
    library: JSON.stringify({ version: 5, topics: [topic], catalogDelivered: [...shippedCatalog.topicIds].sort() }),
  }
}

async function openTopic(page: Page, library: string) {
  await page.addInitScript(([stored, storeKey, splashKey]) => {
    window.localStorage.setItem(splashKey, 'true')
    window.localStorage.setItem(storeKey, stored)
  }, [library, STORE_KEY, SPLASH_KEY] as const)
  await page.goto('./')
  await page.locator('.nav-btn', { hasText: 'Library' }).click()
  await page.locator('.index-row').first().click()
  await expect(page.locator('.topic-title')).toBeVisible()
}

test('a 10 / 26 learner opens Words · Key and sends only taught letters', async ({ page }) => {
  const { library, taught } = learner(5)
  await openTopic(page, library)
  await page.getByRole('button', { name: 'Words, Key, available' }).click()
  await expect(page.locator('.send-run')).toBeVisible()
  const target = (await page.locator('.send-target').getAttribute('aria-label'))!.replace(/^Send /, '')
  expect([...target.replace(/\s/g, '')].filter((letter) => !taught.has(letter))).toEqual([])
})

test('a locked level says why in one line and starts nothing', async ({ page }) => {
  const { library } = learner(5)
  await openTopic(page, library)
  // Locked pips are aria-disabled, which Playwright will not click; a learner's tap still lands.
  await page.getByRole('button', { name: 'Numbers, Listen, locked' }).click({ force: true })
  await expect(page.locator('[data-node-id="tier-numbers"] [role="status"]')).toHaveText(/Numbers come after all 26 letters/i)
  await expect(page.locator('.session-frame')).toHaveCount(0)
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('a fresh learner can start every mode, and Skip ahead lives in the Begin plate', async ({ page }) => {
  const { library } = learner(0)
  await openTopic(page, library)
  const tray = page.getByRole('navigation', { name: 'Play' })
  for (const name of ['Key', 'Listen', 'Read', 'Free play']) {
    await expect(tray.getByRole('button', { name, exact: true })).not.toHaveAttribute('aria-disabled', 'true')
  }
  await expect(page.locator('[data-node-id="start"]').getByRole('button', { name: 'Skip ahead' })).toBeVisible()
  await expect(page.locator('[data-node-id="test"]').getByRole('button', { name: 'Test early' })).toBeVisible()
  await tray.getByRole('button', { name: 'Key', exact: true }).click()
  await expect(page.locator('.session-frame')).toBeVisible()
  await expect(page.locator('.lesson-glyph')).toHaveText(/^[EI]$/)
})

test('Back, the title and n / 26 stay pinned when the path opens or scrolls', async ({ page }) => {
  const { library } = learner(5)
  await openTopic(page, library)
  await expect(page.getByRole('button', { name: /Lesson 6, .*current/ })).toBeInViewport()
  await expect(page.locator('.topic-title')).toBeInViewport()
  await expect(page.locator('.topic-morse-header .screen-header-readout')).toBeInViewport()
  await expect(page.locator('.topic-morse-header .screen-header-readout')).toHaveText('10 / 26')
  await expect(page.getByRole('button', { name: 'A–Z', exact: true })).toBeInViewport()
  const header = await page.locator('.topic-morse-header').boundingBox()
  const position = await page.getByRole('button', { name: /Lesson 6, .*current/ }).boundingBox()
  expect(position!.y).toBeGreaterThanOrEqual(header!.y + header!.height)
  const back = page.getByRole('button', { name: 'Back to previous screen' })
  await expect(back).toBeInViewport()
  for (const size of ['100%', '200%']) {
    await page.evaluate((fontSize) => {
      document.documentElement.style.fontSize = fontSize
      window.scrollTo(0, document.body.scrollHeight)
    }, size)
    await expect(back).toBeInViewport()
    await expect(page.locator('.topic-title')).toBeInViewport()
    await expect(page.getByRole('button', { name: 'A–Z', exact: true })).toBeInViewport()
    expect(await back.evaluate((element) => {
      const box = element.getBoundingClientRect()
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      return hit === element || element.contains(hit)
    })).toBe(true)
    expect((await back.boundingBox())!.height).toBeGreaterThanOrEqual(44)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await back.click()
  await expect(page.getByRole('heading', { name: 'Library', exact: true })).toBeVisible()
})
