import { expect, test } from '@playwright/test'

/**
 * The shared visual primitives (#146) at real phone widths: a Learn visual with
 * its text, and an objectively graded visual-choice Test that needs no
 * self-grading and never scrolls sideways. The topic is seeded through the
 * ordinary local library key, so this is the shipped app reading ordinary data.
 */
const timestamp = '2026-01-01T00:00:00.000Z'

const dial = (bearing: number, alt: string) => ({
  source: { kind: 'figure', figure: { kind: 'angle-dial', pointers: [{ bearing, label: 'A' }] } },
  alt,
  caption: `Pointer A at ${bearing}°.`,
})

const topic = {
  id: 'visual-e2e',
  title: 'Visual e2e',
  scope: 'Two dial questions.',
  track: 'learning',
  items: [
    {
      id: 'e-1',
      kind: 'forward',
      prompt: 'Which cardinal direction does pointer A face?',
      answer: 'East',
      choice: { options: ['North', 'East', 'South', 'West'] },
      stimulus: dial(90, 'A compass dial with one pointer, A, pointing right.'),
    },
    {
      id: 'e-2',
      kind: 'forward',
      prompt: 'Which cardinal direction does pointer A face?',
      answer: 'South',
      choice: { options: ['North', 'East', 'South', 'West'] },
      stimulus: dial(180, 'A compass dial with one pointer, A, pointing down.'),
    },
  ],
  learn: {
    kind: 'concise',
    overview: 'A dial shows a bearing.',
    sections: [{ heading: 'Reading a dial', blocks: [{ type: 'visual', visual: dial(45, 'A compass dial with one pointer, A, between north and east.') }] }],
  },
  status: 'learning',
  createdAt: timestamp,
  drilledAt: null,
  learningAt: timestamp,
  completedAt: null,
  lastTestedAt: null,
  spotCheckedAt: null,
  history: [],
  itemEvidence: {},
  origin: 'user',
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript((seed) => {
    window.localStorage.setItem('argus-splash-seen', 'true')
    window.localStorage.setItem('argus.library.v5', JSON.stringify({ version: 5, topics: [seed] }))
  }, topic)
})

async function noSidewaysScroll(page: import('@playwright/test').Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
}

test('Learn shows the visual with its caption and the text alternative, without overflow', async ({ page }) => {
  await page.goto('./')
  await page.locator('.nav-btn', { hasText: 'Library' }).click()
  await page.getByRole('button', { name: /Visual e2e/ }).click()

  await expect(page.getByRole('heading', { name: 'Reading a dial', level: 3 })).toBeVisible()
  await expect(
    page.getByRole('img', { name: 'A compass dial with one pointer, A, between north and east.' }).first(),
  ).toBeVisible()
  await expect(page.getByText('Pointer A at 45°.')).toBeVisible()
  // The scored set shows its own picture beside the prompt and answer.
  await expect(page.locator('.sheet-items li.has-visual')).toHaveCount(2)
  await noSidewaysScroll(page)
})

test('Test asks each visual item as a graded choice with no self-grade, and scores it', async ({ page }) => {
  await page.goto('./')
  await page.locator('.nav-btn', { hasText: 'Library' }).click()
  await page.getByRole('button', { name: /Visual e2e/ }).click()
  await page.locator('.topic-primary').click()

  for (let asked = 0; asked < 2; asked += 1) {
    await expect(page.getByText('Choose one')).toBeVisible()
    await expect(page.getByRole('button', { name: /reveal/i })).toHaveCount(0)
    const alt = await page.locator('.choice-card [role="img"]').getAttribute('aria-label')
    const answer = alt?.includes('right') ? 'East' : 'South'
    // Every option must be reachable on screen without scrolling the page sideways.
    await noSidewaysScroll(page)
    const option = page.getByRole('button', { name: answer, exact: true })
    await expect(option).toBeEnabled()
    await option.click()
    await expect(page.getByText('Correct')).toBeVisible()
    if (asked === 0) await expect(page.locator('.choice-card [role="img"]')).not.toHaveAttribute('aria-label', alt!)
  }

  // The last correct answer is acknowledged briefly, then the attempt banks.
  await expect(page.locator('.choice-card')).toHaveCount(0)
  const history = () =>
    page.evaluate(
      () =>
        JSON.parse(localStorage.getItem('argus.library.v5')!).topics.find(
          (t: { id: string }) => t.id === 'visual-e2e',
        ).history,
    )
  await expect.poll(async () => (await history()).length).toBe(1)
  expect((await history())[0]).toMatchObject({ correct: 2, total: 2 })
})

test('a wrong choice holds the correction until the learner continues', async ({ page }) => {
  await page.goto('./')
  await page.locator('.nav-btn', { hasText: 'Library' }).click()
  await page.getByRole('button', { name: /Visual e2e/ }).click()
  await page.locator('.topic-primary').click()

  const alt = await page.locator('.choice-card [role="img"]').getAttribute('aria-label')
  const wrong = alt?.includes('right') ? 'West' : 'North'
  await page.getByRole('button', { name: wrong, exact: true }).click()
  await expect(page.getByText('Not that one')).toBeVisible()
  await page.waitForTimeout(1500)
  await expect(page.getByText('Not that one')).toBeVisible()
  await noSidewaysScroll(page)
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByText('Not that one')).toHaveCount(0)
})
