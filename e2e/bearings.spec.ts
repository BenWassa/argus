import { expect, test, type Page } from '@playwright/test'

/**
 * The Compass & Bearings programme (#149) in the shipped app: each new topic
 * opens from Library, reads without sideways scroll at phone widths, and tests
 * as objectively graded choices. The diagrams are drawn from the same
 * deterministic data the answer keys come from.
 */
const TOPICS = [
  { title: 'Whole-Circle Bearings', items: 12, figures: 12 },
  { title: 'Reciprocal Bearings', items: 12, figures: 2 },
  { title: 'True & Magnetic North', items: 16, figures: 0 },
  { title: 'Grid North & Map Bearings', items: 12, figures: 4 },
] as const

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('argus-splash-seen', 'true'))
})

async function openTopic(page: Page, title: string) {
  await page.goto('./')
  await page.locator('.nav-btn', { hasText: 'Library' }).click()
  await page.getByRole('button', { name: new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).first().click()
}

/** An unstarted topic asks to be started before it offers its Test. */
async function startTest(page: Page) {
  const primary = page.locator('.topic-primary')
  if ((await primary.locator('.topic-primary-verb').textContent()) === 'Start learning') await primary.click()
  await expect(primary.locator('.topic-primary-verb')).toHaveText('Test')
  await primary.click()
}

async function noSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
}

for (const topic of TOPICS) {
  test(`${topic.title}: Learn reads without sideways scroll and lists its bank`, async ({ page }) => {
    await openTopic(page, topic.title)
    await expect(page.locator('.sheet-items li')).toHaveCount(topic.items)
    await expect(page.locator('.sheet-items li.has-visual')).toHaveCount(topic.figures)
    await expect(page.locator('#topic-reference-head')).toHaveText('What to remember')
    // Limitations state the boundary outside any picture.
    await expect(page.locator('.learn-notes')).toContainText('does not show that you can navigate safely')
    await noSidewaysScroll(page)
  })
}

test('the topics Test as graded choices, with the diagram on screen where the bank has one', async ({ page }) => {
  await openTopic(page, 'Whole-Circle Bearings')
  await startTest(page)
  await expect(page.getByText('Choose one')).toBeVisible()
  await expect(page.locator('.choice-card .visual .figure-angle-dial')).toBeVisible()
  await expect(page.locator('.choice-option')).toHaveCount(4)
  await expect(page.getByRole('button', { name: /reveal/i })).toHaveCount(0)
  await noSidewaysScroll(page)
  // The text alternative names the diagram but does not state a bearing.
  const alt = await page.locator('.choice-card [role="img"]').getAttribute('aria-label')
  expect(alt).not.toMatch(/\d{3}°/)
})

test('a calculation topic tests as choices with no diagram', async ({ page }) => {
  await openTopic(page, 'True & Magnetic North')
  await startTest(page)
  await expect(page.getByText('Choose one')).toBeVisible()
  await expect(page.locator('.choice-card .visual')).toHaveCount(0)
  await expect(page.locator('.choice-option').first()).toBeVisible()
  await noSidewaysScroll(page)
})

test('the existing eight-point topic is untouched and the five bearing topics are all in the Library', async ({ page }) => {
  await page.goto('./')
  await page.locator('.nav-btn', { hasText: 'Library' }).click()
  for (const title of ['Compass Bearings', ...TOPICS.map((t) => t.title)]) {
    await expect(page.getByRole('button', { name: new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).first()).toBeVisible()
  }
})
