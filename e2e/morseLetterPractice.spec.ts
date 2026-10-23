import { readLocalLibrary } from './helpers/readLocalLibrary'
import { expect, test } from '@playwright/test'
import { seedLibrary } from '../src/domain/library/catalogSeed'
import { readFileSync } from 'node:fs'
const catalog = JSON.parse(readFileSync('src/domain/library/shippedCatalog.json', 'utf8'))

const source = seedLibrary().topics.find(t => t.id === 'international-morse-letters-printed')!
const RHYTHM_TO_LETTER = new Map(source.items.map(item => [[...item.answer.replace(/\s/g, '')].map(mark => mark === '.' ? 'dit' : 'dah').join(' '), item.prompt]))
async function readTarget(page: import('@playwright/test').Page) {
  return RHYTHM_TO_LETTER.get((await page.locator('.letter-practice-stimulus [role="img"]').getAttribute('aria-label'))!)!
}
const topic = { ...source, status: 'completed', completedAt: '2026-10-01T00:00:00Z', acquisitionReadyAt: '2026-10-01T00:00:00Z', lessonProgress: Object.fromEntries(source.items.map(i => [i.id!, 'settled'])) }

test('direct letter practice, durable isolation, correction and return', async ({ page }, info) => {
  await page.addInitScript(library => {
    localStorage.setItem('argus-splash-seen', 'true')
    localStorage.setItem('argus.library.v5', JSON.stringify(library))
  }, { version: 5, topics: [topic], catalogDelivered: catalog.topicIds })
  await page.goto('./')
  await page.getByRole('button', { name: 'Library', exact: true }).click()
  await page.getByRole('button', { name: /Morse/ }).first().click()
  const folder = 'docs/open/morse/assets/morse-221'
  if (process.env.ARGUS_221_BASELINE) {
    if (info.project.name.startsWith('phone-')) await page.screenshot({ path: `${folder}/${info.project.name}-before.png`, fullPage: true })
    return
  }
  await expect(page.getByRole('button', { name: 'Read', exact: true })).toBeVisible()
  if (info.project.name.startsWith('phone-')) await page.screenshot({ path: `${folder}/${info.project.name}-topic.png`, fullPage: true })
  const before = await readLocalLibrary(page).then((library) => library.topics[0])
  await page.getByRole('button', { name: 'Read', exact: true }).click()
  await expect(page.locator('.session-frame-title').filter({ hasText: /^Read$/ })).toBeVisible()
  if (info.project.name.startsWith('phone-')) await page.screenshot({ path: `${folder}/${info.project.name}-active.png`, fullPage: true })
  const target = await readTarget(page)
  const tiles = page.getByRole('group', { name: 'Choose the letter' }).getByRole('button')
  expect(await tiles.count()).toBe(4)
  const wrong = (await tiles.evaluateAll(buttons => buttons.map(b => b.textContent!))).find(letter => letter !== target)!
  await page.getByRole('button', { name: `Letter ${wrong}` }).click()
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible()
  await expect(page.locator('.morse-character-support')).toBeVisible()
  if (info.project.name.startsWith('phone-')) await page.screenshot({ path: `${folder}/${info.project.name}-correction.png`, fullPage: true })
  await page.waitForTimeout(1200)
  await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible()
  const after = await readLocalLibrary(page).then((library) => library.topics[0])
  // Read is answered by choice (#279): its record is morseRecognition, never typed-recall practice.
  const { morseRecognition, ...formalAfter } = after
  const stream = (morseRecognition as unknown as { streams: Record<string, { characters: Record<string, { outcomes: boolean[] }> }> }).streams['read/practice']
  expect(stream.characters[target].outcomes).toEqual([false])
  expect(formalAfter).toEqual(before)
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.getByRole('button', { name: 'Close', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Read', exact: true })).toBeVisible()
})

test('a complete read round repeats freely and large text fits', async ({ page }, info) => {
  await page.addInitScript(library => {
    localStorage.setItem('argus-splash-seen', 'true')
    localStorage.setItem('argus.library.v5', JSON.stringify(library))
  }, { version: 5, topics: [topic], catalogDelivered: catalog.topicIds })
  await page.goto('./')
  await page.getByRole('button', { name: 'Library', exact: true }).click()
  await page.getByRole('button', { name: /Morse/ }).first().click()
  await page.getByRole('button', { name: 'Read', exact: true }).click()
  for (let n = 1; n <= 10; n++) {
    await expect(page.getByRole('progressbar')).toHaveAttribute('aria-label', `${n} of 10`)
    // The shared marks keep their notation as text: one character per mark (#263).
    const pattern = await page.locator('.letter-practice-stimulus .morse-marks').textContent()
    const expected = source.items.find(item => item.answer.replace(/\s/g, '').replace(/-/g, '—').replace(/\./g, '·') === pattern?.replace(/\s/g, ''))!.prompt
    await page.getByRole('button', { name: `Letter ${expected}` }).click()
    await expect(page.getByRole('status')).toContainText('Correct')
  }
  await expect(page.getByRole('heading', { name: '10 of 10 correct' })).toBeVisible()
  if (info.project.name.startsWith('phone-')) await page.screenshot({ path: `docs/open/morse/assets/morse-221/${info.project.name}-complete.png`, fullPage: true })
  await page.getByRole('button', { name: 'Again' }).click()
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-label', '1 of 10')
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  await page.getByRole('button', { name: 'Help' }).click()
  if (info.project.name.startsWith('phone-')) await page.screenshot({ path: `docs/open/morse/assets/morse-221/${info.project.name}-large-text.png`, fullPage: true })
  const overflowing = await page.evaluate(() => [...document.querySelectorAll('*')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).map(el => `${el.tagName}.${el.className}: ${el.getBoundingClientRect().right}`))
  expect(overflowing).toEqual([])
})
