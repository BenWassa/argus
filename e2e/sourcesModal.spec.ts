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
  await expect(dialog.locator('section').first().getByRole('heading')).toHaveText('Scope and limits')
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
  ['Primary Survey', 'not first-aid or clinical training'],
  ['Firearm Safety', 'not handling a firearm'],
]) {
  test(`${title} keeps its safety scope in the sources sheet and visible on Learn`, async ({ page }) => {
    await page.getByRole('button', { name: new RegExp(title) }).click()
    await page.getByRole('button', { name: 'Sources and limitations', exact: true }).click()
    await expect(page.getByRole('dialog', { name: 'Sources and limitations' }).locator('section').first()).toContainText(boundary)
    await page.keyboard.press('Escape')
    await page.getByRole('navigation', { name: 'Study' }).getByRole('button', { name: 'Learn', exact: true }).click()
    await expect(page.locator('.topic-scope')).toContainText(boundary)
    await expect(page.locator('.topic-scope')).toBeVisible()
    await expect(page.locator('.topic-reading details, .topic-reading summary')).toHaveCount(0)
  })
}


test('a topic with scope and sources closes on browser Back without leaving the topic', async ({ page }) => {
  // A user-authored fixture keeps coverage independent of catalogue changes.
  await page.evaluate(() => {
    const key = 'argus.library.v5'
    const library = JSON.parse(localStorage.getItem(key)!)
    library.topics.push({
      ...library.topics[0],
      id: 'sources-only-fixture', title: 'Sources-only fixture', origin: 'user',
      learn: { kind: 'concise', sources: [{ label: 'Reference', url: 'https://example.com/reference' }] },
    })
    localStorage.setItem(key, JSON.stringify(library))
  })
  await page.reload()
  await page.getByRole('button', { name: /Sources-only fixture/ }).click()
  const opener = page.getByRole('button', { name: 'Sources and limitations', exact: true })
  await opener.click()
  await expect(page.getByRole('dialog', { name: 'Sources and limitations', exact: true })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.locator('.topic-title')).toHaveText('Sources-only fixture')
  await expect(opener).toBeFocused()
})
