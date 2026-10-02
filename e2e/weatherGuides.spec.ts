import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('argus-splash-seen', 'true'))
})

async function open(page: import('@playwright/test').Page, title: string) {
  await page.goto('./')
  await page.locator('.nav-btn', { hasText: 'Library' }).click()
  await page.getByRole('button', { name: new RegExp(title) }).click()
}

async function revealFold(page: import('@playwright/test').Page, title: string) {
  const fold = page.locator('details').filter({ has: page.locator('summary', { hasText: title }) }).first()
  if (await fold.count()) await fold.locator('summary').click()
}

test('Beaufort guide loads approved images and manually advances without page overflow', async ({ page }) => {
  await open(page, 'Beaufort Scale')
  await revealFold(page, 'Read the wind at a glance')
  const guide = page.getByRole('region', { name: 'Visual field guide' }).first()
  await expect(guide).toBeVisible()
  await expect(guide.locator('img')).toHaveCount(4)
  expect(await guide.locator('img').first().evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth === 700)).toBe(true)
  await guide.getByRole('button', { name: 'Next guide image' }).click()
  await expect(guide.locator('.visual-guide-position')).toHaveText('4–6 · 2 of 4')
  await guide.locator('.visual-guide-rail').focus()
  await page.keyboard.press('ArrowRight')
  await expect(guide.locator('.visual-guide-position')).toHaveText('7–9 · 3 of 4')
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0)
})

test('Clouds keeps photographs credited and outside the textual Test', async ({ page }) => {
  await open(page, 'Cloud Genera')
  await revealFold(page, 'High clouds')
  const guide = page.getByRole('region', { name: 'Visual field guide' }).first()
  await expect(guide.locator('img')).toHaveCount(3)
  await expect(guide.getByText(/Photo: Jebulon, CC BY-SA 3.0/)).toBeVisible()
  await page.locator('.topic-primary').click()
  await expect(page.locator('.flip-card')).toBeVisible()
  await expect(page.locator('.flip-card img')).toHaveCount(0)
  await expect(page.locator('#prompt-heading')).toHaveText(/^(Ci|Cc|Cs|Ac|As|Ns|St|Sc|Cu|Cb)$/)
})
