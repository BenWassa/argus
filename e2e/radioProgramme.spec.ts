import { expect, test, type Page } from '@playwright/test'

/**
 * The Canadian radio text programme (#150) in the shipped app. The expected
 * answers are typed from RAMN 2026 Part 4 and RIC-22, not read back from the
 * catalog, so the run checks the shipped app against the sources.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('argus-splash-seen', 'true'))
})

async function openTopic(page: Page, title: string) {
  await page.goto('./')
  await page.locator('.nav-btn', { hasText: 'Library' }).click()
  await page.getByRole('button', { name: new RegExp(title) }).first().click()
}

async function noSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
}

for (const [title, items] of [
  ['Radio Procedure', 15],
  ['Marine Calling', 4],
  ['Marine Priority Calls', 9],
] as const) {
  test(`${title}: shows its ${items} items and reads without sideways scroll`, async ({ page }) => {
    await openTopic(page, title)
    await expect(page.locator('.topic-title')).toHaveText(title)
    await expect(page.locator('.topic-state-meta')).toContainText(`${items} items`)
    await expect(page.locator('.topic-recall-cards > li')).toHaveCount(items)
    await noSidewaysScroll(page)
    await page.getByRole('button', { name: 'Sources and limitations' }).click()
    await expect(page.locator('.sources-notes')).toContainText('Not')
    await noSidewaysScroll(page)
  })
}

/** RAMN 2026 Part 4 §§4.1.2–4.1.4 and Figure 4-1: the question → the published answer. */
const PRIORITY_KEY: [RegExp, string][] = [
  [/order of priority/, 'Distress → Urgency → Safety → All other communications'],
  [/does MAYDAY announce/, 'A mobile unit or person is threatened by grave and imminent danger and requests immediate assistance'],
  [/does PAN PAN announce/, 'The calling station has a very urgent message to transmit concerning the safety of a mobile unit or a person'],
  [/does SÉCURITÉ announce/, 'The calling station has an important navigational or meteorological warning to transmit'],
  [/marine distress call/, 'MAYDAY (three times) → THIS IS → Ship name (three times) → Call sign or other identification → MMSI (if a DSC distress alert was sent)'],
  [/marine distress message/, 'MAYDAY → Ship name → Call sign or other identification → MMSI (if a DSC distress alert was sent) → Position → Nature of distress → Assistance needed → Other useful information → OVER'],
  [/marine urgency call/, 'PAN PAN (three times) → ALL STATIONS or a specific station (three times) → THIS IS → Station name (three times) → Call sign or other identification → MMSI (if a DSC urgency announcement was sent)'],
  [/marine safety call/, 'SÉCURITÉ (three times) → ALL STATIONS (three times) → THIS IS → Station name (three times) → Call sign or other identification → MMSI (if a DSC safety announcement was sent) → Brief description of the safety message → Channel or frequency for the safety broadcast → OUT'],
  [/safety message itself sent/, 'On the working frequency announced at the end of the safety call'],
]

test('answering all nine Marine Priority Calls correctly banks a clean run, with long options readable', async ({ page }) => {
  await openTopic(page, 'Marine Priority Calls')
  const primary = page.locator('.topic-primary')
  await expect(primary).toHaveText('Test')
  await primary.click()

  const seen = new Set<string>()
  for (let asked = 0; asked < 9; asked += 1) {
    await expect(page.getByText('Choose one')).toBeVisible()
    const body = (await page.locator('main').innerText()).replace(/\s+/g, ' ')
    const hit = PRIORITY_KEY.find(([pattern]) => pattern.test(body))
    expect(hit, `unrecognised question: ${body.slice(0, 160)}`).toBeDefined()
    seen.add(hit![1])
    await noSidewaysScroll(page)
    const option = page.getByRole('button', { name: hit![1], exact: true })
    await expect(option).toBeVisible()
    await option.click()
    await expect(page.getByText('Correct')).toBeVisible()
    await expect(page.locator('.test-verdict')).toHaveCount(0, { timeout: 4000 }).catch(() => undefined)
  }
  expect(seen.size).toBe(9)
})
