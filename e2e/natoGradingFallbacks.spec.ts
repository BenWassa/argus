import { expect, test } from '@playwright/test'
import {
  assertNoAnswerLeaked,
  cardNumber,
  committingTravel,
  currentPrompt,
  dragCard,
  openNatoTest,
  reveal,
  watchForAnswerLeaks,
} from './support'

test.describe('keyboard and screen-reader grading', () => {
  test.beforeEach(async ({ page }) => {
    await openNatoTest(page)
    await watchForAnswerLeaks(page)
  })

  test('both key bindings still grade, and still advance one card each', async ({ page }) => {
    for (const key of ['ArrowLeft', '1', 'ArrowRight', '2']) {
      const prompt = await currentPrompt(page)
      await page.keyboard.press('Space')
      await expect(page.locator('.flip-card')).toHaveAttribute('aria-expanded', 'true')
      await page.keyboard.press(key)
      await expect(page.locator('#prompt-heading')).not.toHaveText(prompt)
    }
    expect(await cardNumber(page)).toBe(5)
    await assertNoAnswerLeaked(page, 4)
  })

  test('the Missed / Got it pair is reachable by tab and visible once revealed', async ({ page }) => {
    await reveal(page)
    const miss = page.getByRole('button', { name: 'Missed' })
    const hit = page.getByRole('button', { name: 'Got it' })
    await expect(miss).toBeVisible()
    await expect(hit).toBeVisible()
    // Arrows mirror the swipe and the arrow keys; the names stay plain.
    await expect(miss).toContainText('←')
    await expect(hit).toContainText('→')

    await miss.focus()
    const box = await miss.boundingBox()
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44)

    const prompt = await currentPrompt(page)
    await page.keyboard.press('Enter')
    await expect(page.locator('#prompt-heading')).not.toHaveText(prompt)
    expect(await cardNumber(page)).toBe(2)
    await assertNoAnswerLeaked(page)
  })

  test('one pair of grade buttons sits in the thumb area, below the card', async ({ page }) => {
    await reveal(page)
    await expect(page.getByRole('button', { name: 'Didn’t get it' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Mark incorrect' })).toHaveCount(0)

    const pair = page.locator('.grade-pair')
    await expect(pair).toBeVisible()
    await expect(pair).toContainText('Missed')
    await expect(pair).toContainText('Got it')

    const pairBox = await pair.boundingBox()
    const cardBox = await page.locator('.flip-card').boundingBox()
    expect(pairBox!.y).toBeGreaterThan(cardBox!.y)
    const viewport = page.viewportSize()!
    expect(pairBox!.y + pairBox!.height).toBeLessThanOrEqual(viewport.height + 1)
  })
})

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  test.beforeEach(async ({ page }) => {
    await openNatoTest(page)
    await watchForAnswerLeaks(page)
  })

  test('grades by swipe and by key, with the same meaning and no flash', async ({ page }) => {
    const first = await currentPrompt(page)
    await reveal(page)
    await dragCard(page, { dx: -(await committingTravel(page)), steps: 6, pause: 8 })
    await expect(page.locator('#prompt-heading')).not.toHaveText(first)
    expect(await cardNumber(page)).toBe(2)
    await expect(page.locator('.flip-card')).toHaveAttribute('aria-expanded', 'false')

    const second = await currentPrompt(page)
    await page.keyboard.press('Space')
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('#prompt-heading')).not.toHaveText(second)
    expect(await cardNumber(page)).toBe(3)
    await assertNoAnswerLeaked(page, 3)
  })

  test('still springs back from an ambiguous drag without scoring', async ({ page }) => {
    const first = await currentPrompt(page)
    await reveal(page)
    await dragCard(page, { dx: 40, steps: 10, pause: 14 })
    await expect(page.locator('#prompt-heading')).toHaveText(first)
    expect(await cardNumber(page)).toBe(1)
    await assertNoAnswerLeaked(page)
  })

  test('carries no decorative rotation on the card', async ({ page }) => {
    await reveal(page)
    await dragCard(page, { dx: -50, steps: 6, pause: 8, hold: true })
    const rotation = await page.locator('.flip-card').evaluate((node) => {
      const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform)
      return Math.abs(Math.round(Math.atan2(matrix.m12, matrix.m11) * (180 / Math.PI)))
    })
    expect(rotation).toBeLessThan(1)
    await page.mouse.up()
  })
})
