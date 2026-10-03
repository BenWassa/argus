import { expect, test, type Page } from '@playwright/test'

/**
 * Maritime I (#147) in the shipped app. The expected answers below are typed out
 * from the research note, not read back from the catalog, so these tests check
 * the shipped app against the source table rather than against itself.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('argus-splash-seen', 'true'))
})

async function openTopic(page: Page, title: string) {
  await page.goto('./')
  await page.locator('.nav-btn', { hasText: 'Library' }).click()
  await page.getByRole('button', { name: new RegExp(title.replace(/[.*+?^${}()|[\]\\&]/g, '\\$&')) }).first().click()
}

async function startTest(page: Page) {
  const primary = page.locator('.topic-primary')
  await expect(primary).toHaveText('Test')
  await primary.click()
}

async function noSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
}

/** Research note §C: the text alternative → what the shapes mean. */
const SHAPE_KEY: Record<string, string> = {
  'One black shape: ball.': 'Vessel at anchor',
  'Two black shapes in a vertical line, top to bottom: ball, then ball.': 'Vessel not under command',
  'Three black shapes in a vertical line, top to bottom: ball, then diamond, then ball.':
    'Vessel restricted in her ability to manoeuvre',
  'Three black shapes in a vertical line, top to bottom: ball, then ball, then ball.': 'Vessel aground',
  'Two black shapes in a vertical line, top to bottom: cone with its apex down, then cone with its apex up, with their apexes together.':
    'Vessel engaged in fishing (trawling or other fishing)',
}

/** Research note §B1: the observer's position in the prompt → the lights seen. */
const ASPECT_KEY: [RegExp, string][] = [
  [/dead ahead/, 'Masthead light, red sidelight and green sidelight'],
  [/starboard bow/, 'Masthead light and green sidelight'],
  [/starboard beam/, 'Masthead light and green sidelight'],
  [/starboard quarter/, 'Sternlight only'],
  [/dead astern/, 'Sternlight only'],
  [/port quarter/, 'Sternlight only'],
  [/port beam/, 'Masthead light and red sidelight'],
  [/port bow/, 'Masthead light and red sidelight'],
]

for (const [title, items, figures] of [
  ['Navigation Lights & Aspect', 16, 16],
  ['Vessel Day Shapes', 5, 5],
] as const) {
  test(`${title}: Learn shows its bank and diagrams with no sideways scroll`, async ({ page }) => {
    await openTopic(page, title)
    await expect(page.locator('.topic-recall-cards > li')).toHaveCount(items)
    await expect(page.locator('.topic-recall-cards > li.has-visual')).toHaveCount(figures)
    await page.getByRole('button', { name: 'Sources and limitations' }).click()
    await expect(page.locator('.sources-notes')).toContainText('does not show that you can navigate safely')
    await expect(page.locator('.sources-notes')).toContainText('proves nothing')
    await noSidewaysScroll(page)
  })
}

test('the Learn-only orientation prerequisite and the light sectors are taught before any scoring', async ({ page }) => {
  await openTopic(page, 'Navigation Lights & Aspect')
  const orient = page.locator('summary', { hasText: 'Orient the vessel' })
  await expect(orient).toBeVisible()
  await expect(page.locator('.learn-definitions dt').filter({ hasText: '22.5° abaft the beam' })).not.toBeVisible()
  await orient.click()
  await expect(page.locator('.learn-definitions dt').filter({ hasText: '22.5° abaft the beam' })).toBeVisible()
  await expect(page.getByRole('img', { name: /Port is labelled on the left/ })).toBeVisible()
  await page.locator('summary', { hasText: 'How the light sectors work' }).click()
  await expect(page.locator('.figure-sector')).toHaveCount(4)
  for (const sector of await page.locator('.figure-sector').all()) await expect(sector).toBeVisible()
  // The scored set remains visible before the optional explanatory folds.
  await expect(page.locator('#topic-reference-head')).toHaveText('What to remember')
})

test('day shapes: answering every shape correctly banks a clean run', async ({ page }) => {
  await openTopic(page, 'Vessel Day Shapes')
  await startTest(page)
  for (let asked = 0; asked < 5; asked += 1) {
    await expect(page.getByText('Choose one')).toBeVisible()
    const alt = await page.locator('.choice-card [role="img"]').getAttribute('aria-label')
    const answer = SHAPE_KEY[alt!]
    expect(answer, `unexpected stimulus: ${alt}`).toBeDefined()
    // The shapes are black on a light ground, and the answer is not in the alt.
    await expect(page.locator('.choice-card .figure-day-shape').first()).toBeVisible()
    expect(alt).not.toContain('Vessel')
    const option = page.getByRole('button', { name: answer, exact: true })
    await expect(option).toBeEnabled()
    await option.click()
    await expect(page.getByText('Correct')).toBeVisible()
    await expect(page.getByText('Correct')).toHaveCount(0, { timeout: 4000 }).catch(() => undefined)
  }
  await expect(page.locator('.choice-card')).toHaveCount(0)
  const history = () =>
    page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('argus.library.v5')!).topics.find(
          (t: { id: string }) => t.id === 'vessel-day-shapes',
        ).history,
    )
  await expect.poll(async () => (await history()).length).toBe(1)
  expect((await history())[0]).toMatchObject({ correct: 5, total: 5 })
})

test('light aspects: the observer is drawn, the key matches the research table, and nothing scrolls sideways', async ({ page }) => {
  await openTopic(page, 'Navigation Lights & Aspect')
  await startTest(page)
  let aspects = 0
  for (let asked = 0; asked < 16; asked += 1) {
    await expect(page.getByText('Choose one')).toBeVisible()
    const prompt = (await page.getByRole('heading', { level: 1 }).textContent()) ?? ''
    await noSidewaysScroll(page)
    const hit = ASPECT_KEY.find(([pattern]) => pattern.test(prompt))
    let answer: string
    if (hit) {
      aspects += 1
      answer = hit[1]
      await expect(page.locator('.choice-card .figure-observer')).toBeVisible()
      // Scored aspects do not draw the sectors that would give the answer away.
      await expect(page.locator('.choice-card .figure-sector')).toHaveCount(0)
    } else {
      // A light signature: read it from the text alternative (research note §B2).
      const alt = (await page.locator('.choice-card [role="img"]').getAttribute('aria-label')) ?? ''
      answer = SIGNATURE_KEY(alt)
    }
    const option = page.getByRole('button', { name: answer, exact: true })
    await expect(option).toBeEnabled()
    await option.click()
    await expect(page.getByText('Correct')).toBeVisible()
    await expect(page.locator('.test-verdict')).toHaveCount(0, { timeout: 4000 }).catch(() => undefined)
  }
  expect(aspects).toBe(8)
  const history = () =>
    page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('argus.library.v5')!).topics.find(
          (t: { id: string }) => t.id === 'navigation-lights',
        ).history,
    )
  await expect.poll(async () => (await history()).length, { timeout: 8000 }).toBe(1)
  expect((await history())[0]).toMatchObject({ correct: 16, total: 16 })
})

/** Research note §B2, keyed by what each arrangement looks like. */
function SIGNATURE_KEY(alt: string): string {
  const table: [RegExp, string][] = [
    [/white light on the centreline, forward.*red light.*green light.*white light at the stern/, 'Power-driven vessel underway (under 50 m)'],
    [/^A top-down plan of a vessel, bow at the top, with lights marked: a red light.*green light.*white light at the stern\.$/, 'Sailing vessel underway'],
    [/green above white/, 'Vessel trawling'],
    [/red above white\.$/, 'Vessel fishing, other than trawling'],
    [/^Two all-round lights in a vertical line: red above red\.$/, 'Vessel not under command'],
    [/red above white above red/, 'Vessel restricted in her ability to manoeuvre'],
    [/^One all-round light: white\.$/, 'Vessel at anchor (under 50 m)'],
    [/white above red above red/, 'Vessel aground (under 50 m)'],
  ]
  const hit = table.find(([pattern]) => pattern.test(alt))
  if (!hit) throw new Error(`unrecognised light arrangement: ${alt}`)
  return hit[1]
}
