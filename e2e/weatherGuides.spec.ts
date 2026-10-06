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
  const images = guide.locator('img')
  await expect(images).toHaveCount(4)
  await expect.poll(() => images.evaluateAll((nodes) => nodes.every((node) => {
    const image = node as HTMLImageElement
    return image.complete && image.naturalWidth === 700 && image.naturalHeight === 300
  }))).toBe(true)
  expect(await images.evaluateAll((nodes) => nodes.map((node) => new URL((node as HTMLImageElement).src).pathname))).toEqual([
    '/media/beaufort/beaufort-0-3.avif',
    '/media/beaufort/beaufort-4-6.avif',
    '/media/beaufort/beaufort-7-9.avif',
    '/media/beaufort/beaufort-10-12.avif',
  ])
  expect(await images.evaluateAll((nodes) => nodes.every((node) => node.getBoundingClientRect().width <= 700.5))).toBe(true)
  await expect(guide.getByRole('button', { name: 'Show 0–3: Calm → gentle breeze' })).toHaveAttribute('aria-current', 'step')
  await guide.getByRole('button', { name: 'Next guide image' }).click()
  await expect(guide.locator('.visual-guide-position')).toHaveText('4–6 · 2 of 4')
  await guide.locator('.visual-guide-rail').focus()
  await page.keyboard.press('ArrowRight')
  await expect(guide.locator('.visual-guide-position')).toHaveText('7–9 · 3 of 4')
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0)
})

test('Clouds loads all ten credited photos without page overflow and keeps them outside the textual Test', async ({ page }) => {
  await open(page, 'Cloud Genera')
  await expect(page.getByText(/Test scores vocabulary only/)).toBeVisible()

  for (const [heading, count] of [['High clouds', 3], ['Middle clouds', 3], ['Low-base clouds', 4]] as const) {
    await revealFold(page, heading)
    const fold = page.locator('details').filter({ has: page.locator('summary', { hasText: heading }) }).first()
    const guide = fold.getByRole('region', { name: 'Visual field guide' })
    await expect(guide).toBeVisible()
    await expect(guide.locator('img')).toHaveCount(count)
    await expect.poll(() => guide.locator('img').evaluateAll((images) =>
      images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth === 700)
    )).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0)
  }

  const highGuide = page.locator('details').filter({ has: page.locator('summary', { hasText: 'High clouds' }) }).first()
    .getByRole('region', { name: 'Visual field guide' })
  await expect(highGuide.getByText(/Photo: Jebulon, CC BY-SA 3.0/)).toBeVisible()

  await page.locator('.topic-primary').click()
  await expect(page.locator('.flip-card')).toBeVisible()
  await expect(page.locator('.flip-card img')).toHaveCount(0)
  await expect(page.locator('#prompt-heading')).toHaveText(/^(Ci|Cc|Cs|Ac|As|Ns|St|Sc|Cu|Cb)$/)
})
