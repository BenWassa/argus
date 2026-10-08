import { test, expect } from '@playwright/test'
import { seedLibrary } from '../src/domain/library/catalogSeed'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const { topicIds: SHIPPED_CATALOG_TOPIC_IDS } = JSON.parse(readFileSync(fileURLToPath(new URL('../src/domain/library/shippedCatalog.json', import.meta.url)), 'utf8')) as { topicIds: string[] }

const seed = seedLibrary()
const base = seed.topics.find(({ id }) => id === 'nato-phonetic')!
const topics = Array.from({ length: 4 }, (_, i) => ({ ...base, id: `home-${i}`, title: `Active topic ${i + 1}`,
  status: i === 0 ? 'decayed' : 'learning', completedAt: i === 0 ? '2026-09-01T12:00:00Z' : null,
  learningAt: '2026-10-02T15:00:00Z', drilledAt: null, lastTestedAt: null, history: [],
}))

test('Home keeps truthful readings, bounded topics and accessible navigation at enlarged text', async ({ page }, testInfo) => {
  await page.addInitScript((library) => {
    localStorage.setItem('argus-splash-seen', 'true')
    localStorage.setItem('argus.library.v5', JSON.stringify(library))
  }, { version: 5, topics, catalogDelivered: [...SHIPPED_CATALOG_TOPIC_IDS] })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./')
  await expect(page.getByRole('button', { name: 'Home', exact: true })).toHaveAttribute('aria-current', 'page')
  await expect(page.locator('.home-readout').getByText('Completed')).toBeVisible()
  await expect(page.locator('.home-readout dd').nth(0)).toHaveText('1')
  await expect(page.locator('.home-readout dd').nth(1)).toHaveText('3')
  await expect(page.locator('.home-readout time')).toHaveAttribute('datetime', '2026-10-02T15:00:00.000Z')
  await expect(page.locator('.today-plate')).toHaveCount(3)
  await expect(page.getByText('Needs repair')).toBeVisible()
  await expect(page.locator('.docket .gauge-track')).toHaveCount(0)
  await expect(page.locator('.home-dial-arc')).toHaveCount(0)
  if (testInfo.project.name === 'phone-390') await page.screenshot({ path: '/tmp/argus-home-390.png', fullPage: true })
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  const overflow = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }))
  expect(overflow.scroll).toBeLessThanOrEqual(overflow.width)
  await expect(page.getByRole('button', { name: 'Home', exact: true })).toBeInViewport()
  await page.getByRole('button', { name: '+ Add something to learn' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByLabel('Title', { exact: true })).toBeVisible()
})
