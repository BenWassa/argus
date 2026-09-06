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

  test('the grade actions are reachable by tab and visible once focused', async ({ page }) => {
    await reveal(page)
    const miss = page.getByRole('button', { name: 'Mark incorrect' })
    const hit = page.getByRole('button', { name: 'Mark correct' })
    await expect(miss).toBeAttached()
    await expect(hit).toBeAttached()

    await miss.focus()
    // Visually hidden until focused, then a real, visible control rather than a
    // trap a keyboard user cannot see.
    const clip = await miss.evaluate((node) => getComputedStyle(node).clipPath)
    expect(clip === 'none' || clip === '').toBe(true)
    const box = await miss.boundingBox()
    expect(box?.height ?? 0).toBeGreaterThan(20)

    const prompt = await currentPrompt(page)
    await page.keyboard.press('Enter')
    await expect(page.locator('#prompt-heading')).not.toHaveText(prompt)
    expect(await cardNumber(page)).toBe(2)
    await assertNoAnswerLeaked(page)
  })

  test('the bottom hint replaces the grading buttons rather than joining them', async ({ page }) => {
    await reveal(page)
    await expect(page.getByRole('button', { name: 'Got it' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Didn’t get it' })).toHaveCount(0)

    const rail = page.locator('.grade-hint-rail')
    await expect(rail).toBeVisible()
    await expect(rail).toContainText('Incorrect')
    await expect(rail).toContainText('Correct')

    // The hint sits in the thumb area, below the card, where the buttons were.
    const railBox = await rail.boundingBox()
    const cardBox = await page.locator('.flip-card').boundingBox()
    expect(railBox!.y).toBeGreaterThan(cardBox!.y)
    const viewport = page.viewportSize()!
    expect(railBox!.y + railBox!.height).toBeLessThanOrEqual(viewport.height + 1)
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
