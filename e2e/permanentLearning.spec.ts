import { readLocalLibrary } from './helpers/readLocalLibrary'
import { expect, test } from '@playwright/test'
import { seedLibrary } from '../src/domain/library/catalogSeed'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const { topicIds: SHIPPED_CATALOG_TOPIC_IDS } = JSON.parse(readFileSync(fileURLToPath(new URL('../src/domain/library/shippedCatalog.json', import.meta.url)), 'utf8')) as { topicIds: string[] }

const completedAt = '2026-01-01T00:00:00.000Z'
const source = seedLibrary().topics.find(topic => topic.id === 'nato-phonetic')!

test('a later missed Test keeps learned progress and creates no repair obligation', async ({ page }) => {
  const topic = { ...source, status: 'completed', completedAt, history: [
    { at: completedAt, correct: 26, total: 26, resolvedTo: 'completed' },
  ] }
  await page.addInitScript(library => {
    localStorage.setItem('argus-splash-seen', 'true')
    localStorage.setItem('argus.library.v5', JSON.stringify(library))
  }, { version: 5, topics: [topic], catalogDelivered: [...SHIPPED_CATALOG_TOPIC_IDS] })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./')
  await expect(page.locator('.today-plate')).toHaveCount(0)
  await page.getByRole('button', { name: 'Library', exact: true }).click()
  await page.getByRole('button', { name: /^NATO Alphabet/ }).click()
  await page.getByRole('navigation', { name: 'Study' }).getByRole('button', { name: 'Final Test', exact: true }).click()
  for (let index = 0; index < 26; index += 1) {
    await page.getByRole('button', { name: /^Prompt: .*Reveal answer\.$/ }).click()
    await page.getByRole('button', { name: /^Answer:/ }).waitFor()
    await page.keyboard.press(index < 3 ? 'ArrowLeft' : 'ArrowRight')
    await page.waitForFunction(() =>
      [...document.querySelectorAll('button[aria-label]')].some(node => /^Prompt: .*Reveal answer\.$/.test(node.getAttribute('aria-label') ?? '')) ||
      [...document.querySelectorAll('h2[aria-label]')].some(node => /of 26 correct$/.test(node.getAttribute('aria-label') ?? '')),
    )
  }
  await expect(page.getByRole('heading', { name: '23 of 26 correct' })).toBeVisible()
  await expect(page.locator('.test-outcome')).toHaveText('Learned')
  await expect(page.getByRole('button', { name: /^Practise|Review lesson/ })).toHaveCount(0)
  const saved = await readLocalLibrary(page).then((library) => library.topics.find((value) => value.id === topic.id)!)
  expect(saved.status).toBe('completed')
  expect(saved.completedAt).toBe(completedAt)
  expect(saved.history.at(-1)).toMatchObject({ correct: 23, total: 26, resolvedTo: 'completed' })
  expect(saved.history.at(-1)?.missedItemIds).toHaveLength(3)
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await expect(page.locator('.topic-state')).toHaveText('✓Learned')
  // A learned topic reads every lesson done.
  await expect(page.locator('.screen-header-readout')).toHaveText('7 / 7')
  await expect(page.locator('.topic-lessons .spine-row.is-done')).toHaveCount(7)
  await expect(page.getByRole('button', { name: 'Review', exact: true })).toBeVisible()
  await expect(page.getByText('Needs repair')).toHaveCount(0)
  await page.getByRole('button', { name: 'Home', exact: true }).click()
  await expect(page.locator('.today-plate')).toHaveCount(0)
})
