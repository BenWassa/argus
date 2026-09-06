import { expect, test } from '@playwright/test'
import {
  ANSWER_FOR,
  assertNoAnswerLeaked,
  cardNumber,
  committingTravel,
  currentPrompt,
  dragCard,
  openNatoTest,
  reveal,
  watchForAnswerLeaks,
} from './support'

test.beforeEach(async ({ page }) => {
  await openNatoTest(page)
  await watchForAnswerLeaks(page)
})

test('an unrevealed card has no answer to leak', async ({ page }) => {
  await expect(page.locator('.flip-card')).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('.flip-value-answer')).toHaveText('')
  await assertNoAnswerLeaked(page)
})

test('a right swipe grades correct, exits once, and hands over an unrevealed card', async ({ page }) => {
  const first = await currentPrompt(page)
  await reveal(page)
  await expect(page.locator('.flip-value-answer')).toHaveText(ANSWER_FOR.get(first)!)

  await dragCard(page, { dx: await committingTravel(page) })

  await expect(page.locator('#prompt-heading')).not.toHaveText(first)
  expect(await cardNumber(page)).toBe(2)
  await expect(page.locator('.flip-card')).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('.flip-value-answer')).toHaveText('')
  await assertNoAnswerLeaked(page)
})

test('a left swipe grades incorrect and advances exactly one card', async ({ page }) => {
  const first = await currentPrompt(page)
  await reveal(page)
  await dragCard(page, { dx: -(await committingTravel(page)) })

  await expect(page.locator('#prompt-heading')).not.toHaveText(first)
  expect(await cardNumber(page)).toBe(2)
  await assertNoAnswerLeaked(page)
})

test('the drag cue trends red left and green right, and arms at the commit distance', async ({ page }) => {
  await reveal(page)
  const stage = page.locator('.card-stage')
  const miss = page.locator('.grade-cue-miss')
  const hit = page.locator('.grade-cue-hit')

  const opacity = (selector: string) =>
    page.locator(selector).evaluate((node) => Number(getComputedStyle(node).opacity))

  expect(await opacity('.grade-cue-miss')).toBeLessThan(0.05)
  expect(await opacity('.grade-cue-hit')).toBeLessThan(0.05)

  // Held part-way left: the incorrect cue is showing, the correct one is not,
  // and the treatment is not yet armed.
  await dragCard(page, { dx: -40, steps: 8, pause: 12, hold: true })
  expect(await opacity('.grade-cue-miss')).toBeGreaterThan(0.2)
  expect(await opacity('.grade-cue-hit')).toBeLessThan(0.05)
  await expect(stage).not.toHaveClass(/is-armed/)
  await expect(miss).toHaveText(/Incorrect/)
  await expect(hit).toHaveText(/Correct/)

  // Past the commit distance the pending grade becomes legible before release.
  const travel = await committingTravel(page)
  const box = await page.locator('.flip-card').boundingBox()
  await page.mouse.move(Math.max(3, (box?.x ?? 0) + (box?.width ?? 0) / 2 - travel), (box?.y ?? 0) + (box?.height ?? 0) / 2)
  await expect(stage).toHaveClass(/is-armed-incorrect/)
  await page.mouse.up()

  await expect(page.locator('#prompt-heading')).not.toHaveText('')
  await assertNoAnswerLeaked(page)
})

test('a short, ambiguous drag springs back and scores nothing', async ({ page }) => {
  const first = await currentPrompt(page)
  await reveal(page)
  await dragCard(page, { dx: -40, steps: 10, pause: 14 })

  await expect(page.locator('#prompt-heading')).toHaveText(first)
  expect(await cardNumber(page)).toBe(1)
  await expect(page.locator('.flip-card')).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('.card-stage')).not.toHaveClass(/is-armed/)
  // The card comes back to rest, and is immediately gradable again.
  await expect
    .poll(async () =>
      page.locator('.flip-card').evaluate((node) => {
        const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform)
        return Math.abs(matrix.m41)
      }),
    )
    .toBeLessThan(1)

  await dragCard(page, { dx: await committingTravel(page) })
  await expect(page.locator('#prompt-heading')).not.toHaveText(first)
  await assertNoAnswerLeaked(page)
})

test('vertical movement never grades a card', async ({ page }) => {
  const first = await currentPrompt(page)
  await reveal(page)

  // A page-scroll gesture that happens to carry sideways travel.
  await dragCard(page, { dx: 120, dy: 260, steps: 12, pause: 6 })
  await expect(page.locator('#prompt-heading')).toHaveText(first)
  expect(await cardNumber(page)).toBe(1)

  // And a fast vertical flick.
  await dragCard(page, { dx: 40, dy: -200, steps: 3 })
  await expect(page.locator('#prompt-heading')).toHaveText(first)
  expect(await cardNumber(page)).toBe(1)
  await assertNoAnswerLeaked(page)
})

test('a quick flick commits without a full-width throw', async ({ page }) => {
  const first = await currentPrompt(page)
  await reveal(page)
  await dragCard(page, { dx: 56, steps: 3 })

  await expect(page.locator('#prompt-heading')).not.toHaveText(first)
  expect(await cardNumber(page)).toBe(2)
  await assertNoAnswerLeaked(page)
})

test('a cancelled pointer leaves a usable, ungraded card', async ({ page }) => {
  const first = await currentPrompt(page)
  await reveal(page)
  await dragCard(page, { dx: -60, steps: 8, pause: 10, cancel: true })

  await expect(page.locator('#prompt-heading')).toHaveText(first)
  expect(await cardNumber(page)).toBe(1)
  await expect(page.locator('.flip-card')).toHaveAttribute('aria-expanded', 'true')

  // Still the same card, and still gradable.
  await dragCard(page, { dx: await committingTravel(page) })
  await expect(page.locator('#prompt-heading')).not.toHaveText(first)
  expect(await cardNumber(page)).toBe(2)
  await assertNoAnswerLeaked(page)
})

test('one physical gesture produces at most one grade, however fast the next one comes', async ({ page }) => {
  const first = await currentPrompt(page)
  await reveal(page)
  const travel = await committingTravel(page)

  // Commit, then immediately try to grade the card that is still leaving.
  await dragCard(page, { dx: travel, steps: 4 })
  await dragCard(page, { dx: -travel, steps: 4 })
  await page.keyboard.press('ArrowRight')

  await expect(page.locator('#prompt-heading')).not.toHaveText(first)
  await expect.poll(() => cardNumber(page)).toBe(2)
  await expect(page.locator('.flip-card')).toHaveAttribute('aria-expanded', 'false')
  await assertNoAnswerLeaked(page)
})

test('swiping repeatedly through many cards never flashes an answer or skips one', async ({ page }) => {
  const seen: string[] = []
  for (let card = 1; card <= 8; card += 1) {
    expect(await cardNumber(page)).toBe(card)
    const prompt = await currentPrompt(page)
    expect(seen).not.toContain(prompt)
    seen.push(prompt)

    await reveal(page)
    await dragCard(page, { dx: (card % 2 === 0 ? -1 : 1) * (await committingTravel(page)), steps: 4 })
    await expect(page.locator('#prompt-heading')).not.toHaveText(prompt)
  }
  await assertNoAnswerLeaked(page, 8)
})
