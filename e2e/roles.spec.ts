import { expect, test } from '@playwright/test'
import { seedLibrary } from '../src/domain/library/catalogSeed'
import { COMMUNICATOR, NAVIGATOR } from '../src/domain/roles/definitions'

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

test('focused role shows all three open pathways and no premature badge', async ({ page }) => {
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
  await page.locator('.roles-medallion').evaluate((image: HTMLImageElement) => image.decode())
  await page.getByRole('button', { name: /Marine Priority Calls/i }).click()
  await expect(page.getByRole('heading', { name: 'Marine Priority Calls', level: 1 })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Communicator', level: 1 })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
})

test('Navigator selector offers only earnable roles and continues directly into a Test', async ({ page }) => {
  await openWith(page)
  const selector = page.getByRole('combobox', { name: 'Choose a role' })
  await expect(selector.locator('option')).toHaveText(['Communicator', 'Navigator'])
  await selector.selectOption('navigator')
  await expect(page.getByRole('heading', { name: 'Navigator', level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Direction & Bearings' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'North & Maps' })).toBeVisible()
  await expect(page.locator('.role-topic button')).toHaveCount(5)
  await expect(page.locator('.roles-medallion')).toHaveCount(0)
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
  const continueButton = page.getByRole('button', { name: /^Continue:/ })
  await expect(continueButton).toBeVisible()
  await continueButton.click()
  await expect(page.locator('.session-shell')).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('heading', { name: 'Navigator', level: 1 })).toBeVisible()
})

test('Navigator award survives deletion and reload; reset clears it', async ({ page }) => {
  const navigatorIds = new Set<string>(NAVIGATOR.pathways.flatMap((path) => [...path.topicIds]))
  const library = { version: 5, topics: baseline.map((topic) => navigatorIds.has(topic.id) ? { ...topic, origin: 'catalog', status: 'completed', completedAt: '2026-10-13T12:00:00.000Z' } : topic), catalogDelivered: [...IDS, ...navigatorIds] }
  await page.addInitScript(([value, key]) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, value)
    localStorage.setItem('argus-splash-seen', 'true')
  }, [JSON.stringify(library), STORE] as const)
  await page.goto('./')
  await page.getByRole('button', { name: 'Roles', exact: true }).click()
  await page.getByRole('combobox', { name: 'Choose a role' }).selectOption('navigator')
  await expect(page.getByText('Navigator earned', { exact: true })).toBeVisible()
  await page.evaluate((key) => {
    const library = JSON.parse(localStorage.getItem(key)!)
    library.topics = []
    localStorage.setItem(key, JSON.stringify(library))
  }, STORE)
  await page.reload()
  await page.getByRole('combobox', { name: 'Choose a role' }).selectOption('navigator')
  await expect(page.getByText('Navigator earned', { exact: true })).toBeVisible()
  await expect(page.getByText('0 of 5 topics complete')).toBeVisible()
  await page.getByRole('button', { name: 'Home', exact: true }).click()
  await page.getByRole('button', { name: /Profile/ }).click()
  await page.getByRole('button', { name: 'Reset learning data' }).click()
  await page.getByRole('dialog', { name: 'Reset learning data' }).getByRole('button', { name: 'Reset data', exact: true }).click()
  await page.getByRole('button', { name: 'Roles', exact: true }).click()
  await page.getByRole('combobox', { name: 'Choose a role' }).selectOption('navigator')
  await expect(page.getByText('Navigator not yet earned', { exact: true })).toBeVisible()
})

test('earned award stays earned after retention decay', async ({ page }) => {
  await openWith(page, true, true)
  await expect(page.getByText('Communicator earned', { exact: true })).toBeVisible()
  await expect(page.getByText('7 of 7 topics complete')).toBeVisible()
  await expect(page.getByText('Some topics need refreshing. Your badge remains earned.')).toBeVisible()
  await expect(page.locator('.roles-medallion.is-earned')).toBeVisible()
  await page.locator('.roles-medallion').evaluate((image: HTMLImageElement) => image.decode())
  await expect(page.locator('.roles-path-count', { hasText: 'Complete' })).toHaveCount(3)
})
