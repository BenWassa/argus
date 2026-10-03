import { expect, test } from '@playwright/test'

// Layout and focus in a real browser: the shared dialog's centred mode must
// remain usable on small phones, short landscape and at enlarged text.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('argus-splash-seen', 'true'))
  await page.goto('./')
  await page.locator('.nav-btn', { hasText: 'Library' }).click()
})

test('sources modal centres, scrolls at 200% text, traps focus and returns it on dismissal', async ({ page }) => {
  await page.getByRole('button', { name: /SCUBA Equipment/ }).click()
  const opener = page.getByRole('button', { name: 'Sources and limitations', exact: true })
  await expect(page.locator('.learn-notes')).toHaveCount(0)
  await opener.click()
  const dialog = page.getByRole('dialog', { name: 'Sources and limitations' })
  const close = page.getByRole('button', { name: 'Close sources and limitations' })
  await expect(close).toBeFocused()
  await expect(dialog.locator('.learn-sources li')).toHaveCount(9)
  await expect(dialog.locator('section').first().getByRole('heading')).toHaveText('Limitations')
  const box = await dialog.boundingBox()
  const viewport = page.viewportSize()!
  expect(Math.abs(box!.x + box!.width / 2 - viewport.width / 2)).toBeLessThanOrEqual(1)
  expect(Math.abs(box!.y + box!.height / 2 - viewport.height / 2)).toBeLessThanOrEqual(1)
  await page.keyboard.press('Shift+Tab')
  await expect(dialog.locator('a').last()).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(close).toBeFocused()

  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  await expect(close).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0)
  const body = dialog.locator('.sheet-body')
  expect(await body.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0)
  await dialog.locator('a').last().scrollIntoViewIfNeeded()
  await expect(dialog.locator('a').last()).toBeInViewport()
  await expect(close).toBeInViewport()
  await page.screenshot({ path: `test-results/sources-modal-${test.info().project.name}-200.png` })
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(opener).toBeFocused()
  await opener.click()
  await close.click()
  await expect(dialog).toHaveCount(0)
  await expect(opener).toBeFocused()
})

for (const [title, boundary] of [
  ['Firearm Safety', 'not handling a firearm'],
]) {
  test(`${title} keeps its safety scope visible with support closed`, async ({ page }) => {
    await page.getByRole('button', { name: new RegExp(title) }).click()
    await expect(page.locator('.topic-scope')).toContainText(boundary)
    await expect(page.locator('.topic-scope')).toBeVisible()
    await expect(page.locator('.topic details[open]')).toHaveCount(0)
  })
}
