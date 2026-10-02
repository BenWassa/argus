import { expect, test } from '@playwright/test'

test('recall leads, support opens in place and the primary stays reachable', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('argus-splash-seen', 'true'))
  await page.goto('./')
  await page.locator('.nav-btn', { hasText: 'Library' }).click()
  await page.getByRole('button', { name: /Beaufort Scale/ }).click()

  await expect(page.locator('.topic-hero-fallback')).toBeVisible()
  await expect(page.locator('#topic-reference-head')).toHaveText('What to remember')
  await expect(page.locator('.topic-recall-cards > li')).toHaveCount(13)
  await expect(page.locator('.topic-primary')).toHaveText('Test')
  await expect(page.locator('.topic details[open]')).toHaveCount(0)
  await expect(page.locator('.learn-entry').first()).not.toBeVisible()
  await page.locator('summary', { hasText: 'The scale' }).click()
  await expect(page.locator('.learn-entry').first()).toBeVisible()
  await expect(page.locator('.learn-entry').nth(7).locator('.learn-entry-title')).toHaveText('Near gale')
  await page.locator('.topic-admin').scrollIntoViewIfNeeded()
  await expect(page.locator('.topic-primary')).toBeInViewport()

  // Enlarged text must reflow without losing the action or content.
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
  await expect(page.locator('.topic-primary')).toBeInViewport()
  await page.evaluate(() => { document.documentElement.style.fontSize = '' })
  await page.locator('.topic-primary').click()
  await expect(page.locator('.flip-card')).toBeVisible()
})
