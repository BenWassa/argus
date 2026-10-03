import { expect, test, type Page } from '@playwright/test'

/**
 * Maritime II (#148) in the shipped app. The expected meanings are typed from the
 * research note, so the run checks the shipped app against the source table.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('argus-splash-seen', 'true'))
})

async function openTopic(page: Page) {
  await page.goto('./')
  await page.locator('.nav-btn', { hasText: 'Library' }).click()
  await page.getByRole('button', { name: /Signal Flags/ }).first().click()
}

async function noSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
}

/** Research note §3D: each flag's design in words → its retained meaning. */
const KEY: [RegExp, string][] = [
  [/swallow-tailed flag divided vertically/, 'A (Alfa) — Diver down; keep well clear and proceed slowly'],
  [/plain red swallow-tailed/, 'B (Bravo) — Taking in, discharging or carrying dangerous goods'],
  [/yellow, a wider blue band, then yellow/, 'D (Delta) — Keep clear; vessel manoeuvring with difficulty'],
  [/white rectangular flag with a large red diamond/, 'F (Foxtrot) — Vessel disabled; communicate with me'],
  [/equal horizontal bands: blue, white, blue/, 'J (Juliett) — On fire with dangerous cargo, or leaking dangerous cargo; keep well clear'],
  [/yellow and black on the top row/, 'L (Lima) — You should stop your vessel immediately'],
  [/blue rectangular flag with a white diagonal cross/, 'M (Mike) — My vessel is stopped and making no way through the water'],
  [/upper hoist corner to its lower fly corner/, 'O (Oscar) — Man overboard'],
  [/red and white on the top row/, 'U (Uniform) — You are running into danger'],
  [/white rectangular flag with a red diagonal cross/, 'V (Victor) — Assistance required'],
  [/three nested rectangles/, 'W (Whiskey) — Medical assistance required'],
  [/diagonal stripes alternating yellow and red/, 'Y (Yankee) — Vessel is dragging anchor'],
]

test('Learn groups the twelve flags by use, shows each with its text, and does not scroll sideways', async ({ page }) => {
  await openTopic(page)
  for (const heading of ['Warnings to others', 'Vessel state', 'Assistance', 'Pairs that get mixed up', 'Alphabetical reference']) {
    const fold = page.locator('details').filter({ has: page.locator('summary', { hasText: heading }) }).first()
    await expect(fold).not.toHaveAttribute('open', '')
    await fold.locator('summary').click()
    await expect(fold).toHaveAttribute('open', '')
  }
  await expect(page.locator('.learn-entry')).toHaveCount(12)
  await expect(page.locator('.learn-entry .figure-signal-flag')).toHaveCount(12)
  // Letter, meaning and design are text, beside the picture.
  const alfa = page.locator('.learn-entry').filter({ hasText: 'Alfa' })
  await expect(alfa.locator('.learn-entry-marker')).toHaveText('A')
  await expect(alfa).toContainText('Diver down; keep well clear and proceed slowly')
  await expect(alfa).toContainText('swallow-tailed flag divided vertically')
  await expect(page.locator('.topic-recall-cards > li.has-visual')).toHaveCount(12)
  await page.getByRole('button', { name: 'Sources and limitations' }).click()
  await expect(page.locator('.sources-notes')).toContainText('not an official sub-code')
  await noSidewaysScroll(page)
})

test('answering all twelve flags correctly banks a clean run', async ({ page }) => {
  await openTopic(page)
  const primary = page.locator('.topic-primary')
  await expect(primary).toHaveText('Test')
  await primary.click()

  const seen = new Set<string>()
  for (let asked = 0; asked < 12; asked += 1) {
    await expect(page.getByText('Choose one')).toBeVisible()
    const alt = (await page.locator('.choice-card [role="img"]').getAttribute('aria-label')) ?? ''
    const hit = KEY.find(([pattern]) => pattern.test(alt))
    expect(hit, `unrecognised flag description: ${alt}`).toBeDefined()
    seen.add(hit![1])
    // The description never names the letter or meaning, and the flag is on screen.
    expect(alt).not.toMatch(/Alfa|Bravo|Delta|Foxtrot|Juliett|Lima|Mike|Oscar|Uniform|Victor|Whiskey|Yankee/)
    await expect(page.locator('.choice-card .figure-signal-flag')).toBeVisible()
    await noSidewaysScroll(page)
    const option = page.getByRole('button', { name: hit![1], exact: true })
    await expect(option).toBeEnabled()
    await option.click()
    await expect(page.getByText('Correct')).toBeVisible()
    await expect(page.locator('.test-verdict')).toHaveCount(0, { timeout: 4000 }).catch(() => undefined)
  }
  expect(seen.size).toBe(12)
  const history = () =>
    page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('argus.library.v5')!).topics.find(
          (t: { id: string }) => t.id === 'signal-flags',
        ).history,
    )
  await expect.poll(async () => (await history()).length, { timeout: 8000 }).toBe(1)
  expect((await history())[0]).toMatchObject({ correct: 12, total: 12 })
})
