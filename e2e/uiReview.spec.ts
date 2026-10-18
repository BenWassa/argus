import { expect, test } from '@playwright/test'

// The dock must remain usable when text enlargement changes navigation height.
test('topic action clears navigation and final controls remain reachable with enlarged text', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Library', exact: true }).click()
  await page.locator('[data-row]').first().click()
  for (const size of ['100%', '200%']) {
    await page.evaluate((value) => { document.documentElement.style.fontSize = value }, size)
    await expect.poll(async () => {
      const action = await page.locator('.topic-primary').boundingBox()
      const nav = await page.locator('.nav').boundingBox()
      if (!action || !nav) return false
      // Desktop navigation is a side rail; phone navigation is below the action.
      return page.viewportSize()!.width >= 980 || action.y + action.height <= nav.y
    }).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    const target = await page.getByRole('button', { name: 'Delete topic', exact: true }).boundingBox()
    const dock = await page.locator('.topic-action-bar').boundingBox()
    expect(target!.y + target!.height).toBeLessThanOrEqual(dock!.y)
  }
})

test('desktop destinations stay together in the side rail', async ({ page }) => {
  test.skip(page.viewportSize()!.width < 980, 'Desktop rail only')
  await page.goto('./')
  const first = await page.locator('.nav-btn').first().boundingBox()
  const last = await page.locator('.nav-btn').last().boundingBox()
  expect(last!.y - first!.y).toBeLessThan(120)
})

test('Library names and Roles status symbols reflow with enlarged text', async ({ page }) => {
  await page.goto('./')
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  await page.getByRole('button', { name: 'Library', exact: true }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('button', { name: 'Roles', exact: true }).click()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  const overlaps = await page.locator('.role-topic button').evaluateAll((rows) => rows.some((row) => {
    const marker = row.querySelector('.role-topic-mark')!
    const title = row.querySelector('.role-topic-title')!
    const range = document.createRange()
    range.selectNodeContents(marker)
    return range.getBoundingClientRect().right > title.getBoundingClientRect().left
  }))
  expect(overlaps).toBe(false)
})

test('a Test launched from the end of a long topic opens at the session header', async ({ page }) => {
  await page.goto('./')
  await page.getByRole('button', { name: 'Library', exact: true }).click()
  await page.locator('[data-row]').first().click()
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  await page.locator('.topic-primary').click()
  await expect(page.locator('.session-bar')).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
})
