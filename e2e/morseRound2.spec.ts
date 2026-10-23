import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { seedLibrary } from '../src/domain/library/catalogSeed'
import type { Topic } from '../src/domain/library/topic'
import { lessonPackets } from '../src/domain/morse/curriculum/lesson'

/**
 * Morse round 2 (#263): one drawn mark for Morse everywhere, a miss that keeps
 * its stimulus, a desktop header that is never covered by the tray, a short
 * landscape path with room for three rows, and Listen material that keeps to
 * taught letters part way through the course.
 */

const STORE_KEY = 'argus.library.v5'
const SPLASH_KEY = 'argus-splash-seen'
const MORSE_ID = 'international-morse-letters-printed'
const shippedCatalog = JSON.parse(
  readFileSync(fileURLToPath(new URL('../src/domain/library/shippedCatalog.json', import.meta.url)), 'utf8'),
) as { topicIds: string[] }
const source = seedLibrary().topics.find((topic) => topic.id === MORSE_ID)!
const PATTERN_TO_LETTER = new Map(source.items.map((item) => [item.answer.replace(/\s/g, ''), item.prompt]))
const RHYTHM_TO_LETTER = new Map(source.items.map((item) => [[...item.answer.replace(/\s/g, '')].map((mark) => mark === '.' ? 'dit' : 'dah').join(' '), item.prompt]))

function learner(lessons: number): { library: string; taught: Set<string> } {
  const taught = new Set<string>(lessonPackets().slice(0, lessons).flatMap((packet) => packet.characters))
  const topic: Topic = {
    ...source,
    status: 'learning',
    learningAt: '2026-01-01T00:00:00.000Z',
    lessonProgress: Object.fromEntries(source.items.filter((item) => taught.has(item.prompt)).map((item) => [item.id!, 'settled'])),
  }
  return { taught, library: JSON.stringify({ version: 5, topics: [topic], catalogDelivered: [...shippedCatalog.topicIds].sort() }) }
}

async function openTopic(page: Page, library: string, css = '') {
  await page.addInitScript(([stored, storeKey, splashKey, style]) => {
    window.localStorage.setItem(splashKey, 'true')
    window.localStorage.setItem(storeKey, stored)
    if (style) document.addEventListener('DOMContentLoaded', () => {
      const sheet = document.createElement('style')
      sheet.textContent = style
      document.head.append(sheet)
    })
  }, [library, STORE_KEY, SPLASH_KEY, css] as const)
  await page.goto('./')
  await page.locator('.nav-btn', { hasText: 'Library' }).click()
  await page.locator('.index-row').first().click()
  await expect(page.locator('.topic-title')).toBeVisible()
}

/** Every drawn mark in `scope`: one height, one centre line, dahs three dits long. */
async function expectMarksOnOneLine(page: Page, scope: string) {
  const boxes = await page.locator(`${scope} .morse-mark`).evaluateAll((marks) => marks.map((mark) => {
    const box = mark.getBoundingClientRect()
    return { dah: mark.classList.contains('is-dah'), width: box.width, height: box.height, centre: box.top + box.height / 2 }
  }))
  expect(boxes.length).toBeGreaterThan(0)
  for (const box of boxes) {
    expect(Math.abs(box.height - boxes[0].height), 'one height').toBeLessThanOrEqual(0.5)
    expect(Math.abs(box.centre - boxes[0].centre), 'one centre line').toBeLessThanOrEqual(0.5)
    expect(box.width / box.height).toBeCloseTo(box.dah ? 3 : 1, 1)
  }
  return boxes
}

test('Read draws its pattern as marks on one centre line, and a miss keeps it above the correction', async ({ page }, info) => {
  const { library } = learner(5)
  await openTopic(page, library)
  await expectMarksOnOneLine(page, '.mode-tray-tile[data-tile-id="read"]')
  await page.getByRole('navigation', { name: 'Play' }).getByRole('button', { name: 'Read', exact: true }).click()
  const stimulus = page.locator('.letter-practice-stimulus [role="img"]')
  await expect(stimulus).toBeVisible()
  const boxes = await expectMarksOnOneLine(page, '.letter-practice-stimulus')
  // Card-value scale: a dit is a real mark, never a speck of type.
  if (info.project.name.startsWith('phone-')) expect(boxes[0].height).toBeGreaterThanOrEqual(14)

  const letter = RHYTHM_TO_LETTER.get((await stimulus.getAttribute('aria-label'))!)!
  const offered = await page.getByRole('group', { name: 'Choose the letter' }).getByRole('button').evaluateAll(buttons => buttons.map(b => b.textContent!))
  const wrong = offered.find(candidate => candidate !== letter)!
  await page.getByRole('button', { name: `Letter ${wrong}` }).click()
  const miss = page.getByRole('status').filter({ hasText: 'Not that one' })
  await expect(miss).toContainText(`You said ${wrong}`)
  await expect(stimulus).toBeInViewport()
  await expect(page.getByRole('button', { name: 'Continue' })).toBeInViewport()
  const stimulusBox = (await stimulus.boundingBox())!
  const missBox = (await miss.boundingBox())!
  expect(stimulusBox.y + stimulusBox.height).toBeLessThanOrEqual(missBox.y)
  await expectMarksOnOneLine(page, '.letter-practice-stimulus')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('a Send miss uses the same correction as Read', async ({ page }) => {
  const { library } = learner(5)
  await openTopic(page, library)
  await page.getByRole('button', { name: 'Words, Key, available' }).click()
  const target = (await page.locator('.send-target').getAttribute('aria-label'))!.replace(/^Send /, '')
  const pattern = [...PATTERN_TO_LETTER].find(([, glyph]) => glyph === target[0])![0]
  for (const mark of pattern) await page.keyboard.press(mark === '.' ? '-' : '.')
  const miss = page.locator('.session-miss')
  await expect(miss).toContainText('Not that one')
  await expect(miss).toContainText('You keyed')
  await expect(miss.getByRole('button', { name: 'Continue' })).toBeInViewport()
  await expect(page.locator('.morse-key')).toBeHidden()
})

test('the desktop header stays above the sticky tray when the path opens at the position', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) < 980, 'desktop layout only')
  const { library } = learner(5)
  await openTopic(page, library)
  await expect(page.getByRole('button', { name: /Lesson 6, .*current/ })).toBeInViewport()
  const header = (await page.locator('.topic-morse-header').boundingBox())!
  const tray = (await page.locator('.mode-tray-dock').boundingBox())!
  expect(header.y).toBeGreaterThanOrEqual(-0.5)
  expect(tray.y).toBeGreaterThanOrEqual(header.y + header.height - 0.5)
  // Nothing covers the title, the reading or A–Z.
  for (const selector of ['.topic-title', '.topic-morse-header .screen-header-readout', '.topic-morse-reference']) {
    const covered = await page.locator(selector).evaluate((element) => {
      const box = element.getBoundingClientRect()
      const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      return !hit || !(element === hit || element.contains(hit))
    })
    expect(covered, selector).toBe(false)
  }
  const position = (await page.getByRole('button', { name: /Lesson 6, .*current/ }).boundingBox())!
  expect(position.y).toBeGreaterThanOrEqual(tray.y + tray.height)
})

for (const width of [740, 640]) {
  test(`short landscape at ${width}x360 shows at least three path rows (Linux fonts)`, async ({ page }) => {
    test.skip(page.viewportSize()?.height !== 360, 'short landscape only')
    await page.setViewportSize({ width, height: 360 })
    const { library } = learner(5)
    await openTopic(page, library, '* { font-family: Verdana, sans-serif !important; }')
    await expect(page.getByRole('button', { name: /Lesson 6, .*current/ })).toBeInViewport()
    await expect(page.locator('.topic-morse-header .screen-header-readout')).toBeInViewport()
    const free = await page.evaluate(() => ({
      top: document.querySelector('.topic-morse-header')!.getBoundingClientRect().bottom,
      bottom: document.querySelector('.mode-tray-dock')!.getBoundingClientRect().top,
    }))
    const rows = await page.locator('.spine > li').evaluateAll((items, { top, bottom }) => items
      .map((item) => item.getBoundingClientRect())
      .filter((box) => box.top >= top - 0.5 && box.bottom <= bottom + 0.5).length, free)
    expect(rows).toBeGreaterThanOrEqual(3)
    // Every tile keeps its 44px floor.
    for (const tile of await page.locator('.mode-tray-tile').all()) expect((await tile.boundingBox())!.height).toBeGreaterThanOrEqual(44)
  })
}

test('Copy and Groups at 10 / 26 put only taught letters in front of the learner', async ({ page }) => {
  test.setTimeout(60_000)
  const { library, taught } = learner(5)
  await openTopic(page, library)
  await page.getByRole('button', { name: 'Words, Listen, available' }).click()
  await expect(page.locator('.copy-run .lesson-task')).toHaveText('Copy')
  await page.getByRole('button', { name: 'Play', exact: true }).click()
  await page.getByLabel('What you heard').fill('XQXQ')
  await page.getByRole('button', { name: 'Check' }).click()
  const copied = (await page.locator('.copy-expected').textContent())!.replace(/\s/g, '')
  expect([...copied].filter((letter) => !taught.has(letter))).toEqual([])
  await page.getByRole('button', { name: 'Close' }).click()

  await page.getByRole('button', { name: 'Groups, Listen, available' }).click()
  await expect(page.locator('.fluency-run .lesson-task')).toHaveText(/Groups|Letters/)
  await page.getByRole('button', { name: 'Play', exact: true }).click()
  // Key dahs until the group is judged; T is the one five-dah-proof miss for most groups.
  for (let press = 0; press < 12 && !(await page.locator('.fluency-miss, .fluency-feedback.is-correct').count()); press += 1) {
    await page.keyboard.press('-')
    await page.waitForTimeout(900)
  }
  const heard = (await page.locator('.fluency-miss .fluency-answer, .fluency-feedback.is-correct .session-correct').first().textContent())!.replace(/[\s✓]/g, '').replace('Correct', '')
  expect(heard.length).toBeGreaterThan(0)
  expect([...heard].filter((letter) => !taught.has(letter))).toEqual([])
})
