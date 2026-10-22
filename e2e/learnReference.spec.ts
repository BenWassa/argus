import { expect, test } from '@playwright/test'

test('the items lead, Learn reads on its own screen and the tray stays reachable', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('argus-splash-seen', 'true'))
  await page.goto('./')
  await page.locator('.nav-btn', { hasText: 'Library' }).click()
  await page.getByRole('button', { name: /Beaufort Scale/ }).click()

  const tray = page.getByRole('navigation', { name: 'Study' })
  const test = page.locator('.topic-tray [data-tile-id="test"]')
  await expect(page.locator('.topic-items .topic-item')).toHaveCount(13)
  await expect(page.locator('.topic-items')).toContainText('Calm')
  await expect(test.locator('.mode-tray-label')).toHaveText('Test')
  await expect(page.locator('.topic details, .topic summary')).toHaveCount(0)
  await expect(page.locator('.topic-hero, .learn-entry')).toHaveCount(0)
  // Phones dock the tray above navigation; from 980px it sits in flow above the items.
  const docked = page.viewportSize()!.width < 980
  await page.locator('.sources-link').scrollIntoViewIfNeeded()
  if (docked) await expect(test).toBeInViewport()

  // Enlarged text must reflow without losing the tray or content.
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
  if (docked) await expect(test).toBeInViewport()
  await page.evaluate(() => { document.documentElement.style.fontSize = '' })
  await page.evaluate(() => window.scrollTo(0, 0))

  // Learn is its own screen, with Back to the topic.
  await tray.getByRole('button', { name: 'Learn', exact: true }).click()
  await expect(page.locator('.topic-reading')).toBeVisible()
  await expect(page.locator('.learn-entry').first()).toBeVisible()
  await expect(page.locator('.learn-entry').nth(7).locator('.learn-entry-title')).toHaveText('Near gale')
  await expect(page.locator('.topic-reading details, .topic-reading summary')).toHaveCount(0)
  await page.getByRole('button', { name: 'Back to topic' }).click()
  await expect(page.locator('.topic-title')).toHaveText('Beaufort Scale')
  await expect(page.locator('.topic-title')).toBeFocused()

  await test.click()
  await expect(page.locator('.flip-card')).toBeVisible()
})

test('ACTS PROVE reference matches its ordered Test', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('argus-splash-seen', 'true'))
  await page.goto('./')
  await page.locator('.nav-btn', { hasText: 'Library' }).click()
  await page.getByRole('button', { name: /Firearm Safety/ }).click()
  await expect(page.locator('.topic-item-group .spine-label')).toHaveText(['ACTS', 'PROVE'])
  await expect(page.locator('.topic-item .spine-node')).toHaveText(['A', 'C', 'T', 'S', 'P', 'R', 'O', 'V', 'E'])
  await expect(page.locator('.topic details, .topic summary')).toHaveCount(0)
  await page.locator('.topic-tray [data-tile-id="test"]').click()
  await expect(page.locator('.sequence-card')).toBeVisible()
})
