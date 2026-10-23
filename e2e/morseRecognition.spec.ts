import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { seedLibrary } from '../src/domain/library/catalogSeed'
import type { Topic } from '../src/domain/library/topic'
import { lessonPackets } from '../src/domain/morse/curriculum/lesson'

/**
 * Four-choice letter recognition (#279): Read and Listen answer with four large
 * tiles, never the phone keyboard; Speed is a variant inside them; the record
 * is its own and cannot reach Test, completion or typed-recall practice.
 */

const STORE_KEY = 'argus.library.v5'
const SPLASH_KEY = 'argus-splash-seen'
const MORSE_ID = 'international-morse-letters-printed'
const shippedCatalog = JSON.parse(
  readFileSync(fileURLToPath(new URL('../src/domain/library/shippedCatalog.json', import.meta.url)), 'utf8'),
) as { topicIds: string[] }
const source = seedLibrary().topics.find((topic) => topic.id === MORSE_ID)!
const RHYTHM_TO_LETTER = new Map(source.items.map((item) => [[...item.answer.replace(/\s/g, '')].map((mark) => mark === '.' ? 'dit' : 'dah').join(' '), item.prompt]))

function learner(lessons: number): string {
  const taught = new Set<string>(lessonPackets().slice(0, lessons).flatMap((packet) => packet.characters))
  const topic: Topic = {
    ...source,
    status: 'learning',
    learningAt: '2026-01-01T00:00:00.000Z',
    lessonProgress: Object.fromEntries(source.items.filter((item) => taught.has(item.prompt)).map((item) => [item.id!, 'settled'])),
  }
  return JSON.stringify({ version: 5, topics: [topic], catalogDelivered: [...shippedCatalog.topicIds].sort() })
}

async function openRead(page: Page, library: string) {
  await page.addInitScript(([stored, storeKey, splashKey]) => {
    window.localStorage.setItem(splashKey, 'true')
    window.localStorage.setItem(storeKey, stored)
  }, [library, STORE_KEY, SPLASH_KEY] as const)
  await page.goto('./')
  await page.locator('.nav-btn', { hasText: 'Library' }).click()
  await page.locator('.index-row').first().click()
  await expect(page.locator('.topic-title')).toBeVisible()
  await page.getByRole('navigation', { name: 'Play' }).getByRole('button', { name: 'Read', exact: true }).click()
  await expect(page.getByRole('group', { name: 'Choose the letter' })).toBeVisible()
}

const tiles = (page: Page) => page.getByRole('group', { name: 'Choose the letter' }).getByRole('button')
async function target(page: Page) {
  return RHYTHM_TO_LETTER.get((await page.locator('.letter-practice-stimulus [role="img"]').getAttribute('aria-label'))!)!
}
const stored = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).topics[0], STORE_KEY)

test('Read offers four large, stable tiles and no keyboard field', async ({ page }, info) => {
  await openRead(page, learner(6))
  await expect(tiles(page)).toHaveCount(4)
  await expect(page.locator('input, textarea')).toHaveCount(0)
  expect(await page.evaluate(() => document.activeElement?.tagName)).not.toMatch(/INPUT|TEXTAREA/)

  const boxes = await tiles(page).evaluateAll((buttons) => buttons.map((button) => {
    const box = button.getBoundingClientRect()
    return { x: box.x, y: box.y, w: box.width, h: box.height, bottom: box.bottom, right: box.right }
  }))
  const viewport = page.viewportSize()!
  const landscape = info.project.name === 'landscape-short'
  for (const box of boxes) {
    expect(box.h, 'target height').toBeGreaterThanOrEqual(landscape ? 48 : 64)
    expect(box.w, 'target width').toBeGreaterThanOrEqual(44)
    expect(box.right).toBeLessThanOrEqual(viewport.width)
  }
  const rows = new Set(boxes.map((box) => Math.round(box.y)))
  // 2x2 on every portrait and desktop size; one row of four only when the screen is short.
  expect(rows.size).toBe(landscape ? 1 : 2)
  expect(new Set(boxes.map((box) => Math.round(box.x))).size).toBe(landscape ? 4 : 2)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  // The tiles are reachable without scrolling the page.
  await expect(tiles(page).last()).toBeInViewport()
  const names = await tiles(page).evaluateAll((buttons) => buttons.map((button) => button.getAttribute('aria-label')))
  expect(new Set(names).size).toBe(4)
  expect(names.every((name) => /^Letter [A-Z]$/.test(name!))).toBe(true)
})

test('a tap grades once, locks the tiles and writes only the recognition record', async ({ page }) => {
  await openRead(page, learner(6))
  const before = await stored(page)
  const letter = await target(page)
  const tile = page.getByRole('button', { name: `Letter ${letter}`, exact: true })
  await tile.dblclick()
  await expect(page.getByRole('status')).toContainText('Correct')
  await expect(tiles(page)).toHaveCount(0)
  const after = await stored(page)
  expect(after.morseRecognition.streams['read/practice'].characters[letter].outcomes).toEqual([true])
  expect(after.morsePractice).toBeUndefined()
  const { morseRecognition: _recognition, ...formal } = after
  expect(formal).toEqual(before)
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-label', '2 of 10')
})

test('a miss stays until Continue, with the tap-through guard and focus', async ({ page }) => {
  await openRead(page, learner(6))
  const letter = await target(page)
  const names = await tiles(page).evaluateAll((buttons) => buttons.map((button) => button.textContent!))
  const wrong = names.find((name) => name !== letter)!
  await page.getByRole('button', { name: `Letter ${wrong}`, exact: true }).click()
  await expect(page.locator('.session-miss')).toContainText(`You said ${wrong}`)
  await page.waitForTimeout(1500)
  await expect(page.getByRole('button', { name: 'Continue' })).toBeFocused()
  await expect(page.locator('.letter-practice-stimulus [role="img"]')).toBeVisible()
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-label', '2 of 10')
  await expect(tiles(page)).toHaveCount(4)
})

test('a physical keyboard answers by letter and Tab reaches the tiles', async ({ page }) => {
  await openRead(page, learner(6))
  const letter = await target(page)
  await page.keyboard.press('Tab')
  expect(await page.evaluate(() => document.activeElement?.closest('[role="group"]')?.getAttribute('aria-label') ?? document.activeElement?.textContent)).toBeTruthy()
  await page.keyboard.press(letter.toLowerCase())
  await expect(page.getByRole('status')).toContainText('Correct')
})

test('Speed is a ten-letter variant inside Read with its own stream and honest summary', async ({ page }) => {
  await openRead(page, learner(6))
  await page.getByRole('button', { name: 'Speed', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Speed', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('10 letters · no countdown')).toBeVisible()
  const before = await stored(page)
  for (let n = 1; n <= 10; n++) {
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-label', `${n} of 10`)
    await expect(tiles(page).first()).toBeEnabled()
    await page.getByRole('button', { name: `Letter ${await target(page)}`, exact: true }).click()
    await expect(page.getByRole('status')).toContainText('Correct')
  }
  await expect(page.getByRole('heading', { name: '10 of 10 correct' })).toBeVisible()
  await expect(page.getByText(/^Typical correct choice/)).toBeVisible()
  await expect(page.getByText('10 timed answers')).toBeVisible()
  await expect(page.locator('body')).not.toContainText(/\bscore\b|\brank\b|wpm/i)
  const after = await stored(page)
  expect(Object.keys(after.morseRecognition.streams)).toEqual(['read/speed'])
  const samples = Object.values<{ recentCorrectMs: number[] }>(after.morseRecognition.streams['read/speed'].characters).flatMap((c) => c.recentCorrectMs)
  expect(samples.length).toBeGreaterThan(0)
  expect(samples.every((ms) => Number.isInteger(ms) && ms >= 0 && ms <= 10_000)).toBe(true)
  for (const field of ['itemEvidence', 'history', 'lessonProgress', 'status', 'completedAt', 'lastTestedAt', 'morsePractice', 'morseFluency']) {
    expect(after[field], field).toEqual(before[field])
  }
  await page.getByRole('button', { name: 'Again' }).click()
  await expect(page.getByRole('button', { name: 'Speed', exact: true })).toHaveAttribute('aria-pressed', 'true')
})

test('only one taught letter is a teaching step, never a single-choice question', async ({ page }) => {
  const topic: Topic = {
    ...source, status: 'learning', learningAt: '2026-01-01T00:00:00.000Z',
    lessonProgress: { [source.items.find((item) => item.prompt === 'E')!.id!]: 'settled' },
  }
  await page.addInitScript(([stored, storeKey, splashKey]) => {
    window.localStorage.setItem(splashKey, 'true')
    window.localStorage.setItem(storeKey, stored)
  }, [JSON.stringify({ version: 5, topics: [topic], catalogDelivered: [...shippedCatalog.topicIds].sort() }), STORE_KEY, SPLASH_KEY] as const)
  await page.goto('./')
  await page.locator('.nav-btn', { hasText: 'Library' }).click()
  await page.locator('.index-row').first().click()
  await page.getByRole('navigation', { name: 'Play' }).getByRole('button', { name: 'Read', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Got it' })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Choose the letter' })).toHaveCount(0)
  expect((await stored(page)).morseRecognition).toBeUndefined()
})

test('200% text keeps every tile on screen', async ({ page }) => {
  await openRead(page, learner(6))
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  const overflowing = await page.evaluate(() => [...document.querySelectorAll('.letter-choice')]
    .filter((el) => el.getBoundingClientRect().right > innerWidth + 1 || el.getBoundingClientRect().left < -1).map((el) => el.textContent))
  expect(overflowing).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await expect(tiles(page).first()).toBeVisible()
})

test('Listen keeps the tiles unavailable until the sound has finished', async ({ page }) => {
  await openRead(page, learner(6))
  await page.getByRole('button', { name: 'Close' }).click()
  await page.getByRole('navigation', { name: 'Play' }).getByRole('button', { name: 'Listen', exact: true }).click()
  await expect(tiles(page)).toHaveCount(4)
  for (const tile of await tiles(page).all()) await expect(tile).toBeDisabled()
  await page.getByRole('button', { name: 'Play Morse sound' }).click()
  await expect(tiles(page).first()).toBeEnabled({ timeout: 10_000 })
  await expect(page.locator('input, textarea')).toHaveCount(0)
})
