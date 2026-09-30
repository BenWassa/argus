import { expect, test } from '@playwright/test'

/**
 * Structured Learn reading pages at real phone widths. The Beaufort page is the
 * first to use force entries (#128), which replaced two tables that had to be
 * read side by side; the point of the change is that nothing scrolls sideways.
 */
test('Beaufort reads as one entry per force, with no sideways scroll', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('argus-splash-seen', 'true'))
  await page.goto('./')
  await page.locator('.nav-btn', { hasText: 'Library' }).click()
  await page.getByRole('button', { name: /Beaufort Scale/ }).click()

  await expect(page.getByRole('heading', { name: 'The scale', level: 3 })).toBeVisible()
  await expect(page.locator('.learn-entry')).toHaveCount(13)
  const gale = page.locator('.learn-entry').nth(7)
  await expect(gale.locator('.learn-entry-marker')).toHaveText('7')
  await expect(gale.locator('.learn-entry-title')).toHaveText('Near gale')
  await expect(gale.locator('.learn-entry-meta')).toHaveText('28–33 knots')
  await expect(gale.locator('dt')).toHaveText(['At sea', 'On land'])
  await expect(page.locator('.learn-entry').nth(12).locator('.learn-entry-note')).toContainText('64 knots or more')
  await expect(page.locator('.learn-table')).toHaveCount(0)

  // Explanation, then what to remember, then provenance.
  const order = await page.evaluate(() => {
    const at = (selector: string) => {
      const node = document.querySelector(selector)
      return node ? node.getBoundingClientRect().top + window.scrollY : -1
    }
    return { scale: at('.learn-entries'), remember: at('#topic-reference-head'), notes: at('.learn-notes') }
  })
  expect(order.scale).toBeLessThan(order.remember)
  expect(order.remember).toBeLessThan(order.notes)
  await expect(page.locator('#topic-reference-head')).toHaveText('What to remember')

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
})
