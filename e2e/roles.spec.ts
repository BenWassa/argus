import { expect, test } from '@playwright/test'
import { seedLibrary } from '../src/domain/library/catalogSeed'
import { COMMUNICATOR } from '../src/domain/roles/definitions'

const STORE = 'argus.library.v5'
const IDS = new Set<string>(COMMUNICATOR.pathways.flatMap((path) => [...path.topicIds]))
const baseline = seedLibrary().topics.map((topic) =>
  IDS.has(topic.id) ? {
    ...topic, origin: 'catalog' as const, status: 'unstarted' as const,
    drilledAt: null, completedAt: null, learningAt: null, history: [],
  } : topic,
)

async function openWith(page: import('@playwright/test').Page, earned = false, decay = false) {
  const topics = baseline.map((topic) => !IDS.has(topic.id) ? topic : earned ? {
    ...topic,
    status: decay && topic.id === 'nato-phonetic' ? 'decayed' : 'completed',
    completedAt: '2026-10-07T12:00:00Z',
  } : topic)
  const json = JSON.stringify({ version: 5, topics, catalogDelivered: [...IDS] })
  await page.addInitScript(([value, key]) => {
    localStorage.setItem(key, value)
    localStorage.setItem('argus-splash-seen', 'true')
  }, [json, STORE] as const)
  await page.goto('./')
  await page.getByRole('button', { name: 'Roles', exact: true }).click()
}

test('single-role destination shows all three open pathways and no premature badge', async ({ page }) => {
  await openWith(page)
  await expect(page.getByRole('heading', { name: 'Communicator', level: 1 })).toBeVisible()
  await expect(page.getByText('Communicator not yet earned')).toBeVisible()
  await expect(page.getByText('0 of 7 topics complete')).toBeVisible()
  for (const heading of ['Codes & Signalling', 'Radio Fundamentals', 'Marine Communications']) {
    await expect(page.getByRole('heading', { name: heading, level: 2 })).toBeVisible()
  }
  const allButtons = page.locator('.role-topic button')
  await expect(allButtons).toHaveCount(7)
  await expect(page.locator('.roles-medallion.is-unearned')).toBeVisible()
  await page.getByRole('button', { name: /Marine Priority Calls/i }).click()
  await expect(page.getByRole('heading', { name: 'Marine Priority Calls', level: 1 })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Communicator', level: 1 })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
})

test('earned award stays earned after retention decay', async ({ page }) => {
  await openWith(page, true, true)
  await expect(page.getByText('Communicator earned', { exact: true })).toBeVisible()
  await expect(page.getByText('7 of 7 topics complete')).toBeVisible()
  await expect(page.getByText('Some topics need refreshing. Your badge remains earned.')).toBeVisible()
  await expect(page.locator('.roles-medallion.is-earned')).toBeVisible()
  await expect(page.locator('.roles-path-count', { hasText: 'Complete' })).toHaveCount(3)
})
