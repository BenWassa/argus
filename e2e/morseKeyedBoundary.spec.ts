import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { seedLibrary } from '../src/lib/seed'
import type { Topic } from '../src/lib/types'

/**
 * What JSDOM cannot prove about the keyed Morse boundary (#87).
 *
 * The owner-reported defect was a real finger on a real compositor: tapping
 * quickly through the end of one retrieval produced an answer on the next one,
 * which surfaced as an apparently random verdict the learner never keyed. The
 * unit suite proves the gate closes; this proves that a genuine rapid pointer
 * sequence cannot get through it, and that the key does not repaint itself
 * into a touch-highlight state on the way.
 */

const STORE_KEY = 'argus.library.v5'
const SPLASH_KEY = 'argus-splash-seen'
const MORSE_ID = 'international-morse-letters-printed'

const shippedCatalog = JSON.parse(
  readFileSync(fileURLToPath(new URL('../src/lib/shippedCatalog.json', import.meta.url)), 'utf8'),
) as { topicIds: string[] }

const seeded = seedLibrary()
const source = seeded.topics.find((topic) => topic.id === MORSE_ID)
if (!source) throw new Error('Seeded Morse topic missing')

const morse: Topic = {
  ...source,
  status: 'unstarted',
  drilledAt: null,
  learningAt: null,
  completedAt: null,
  lastTestedAt: null,
  spotCheckedAt: null,
  history: [],
  lessonProgress: Object.fromEntries(
    source.items.map((item) => {
      if (!item.id) throw new Error('Seeded Morse item missing id')
      return [item.id, 'settled']
    }),
  ),
}

const LIBRARY = JSON.stringify({
  version: 5,
  topics: [morse],
  catalogDelivered: [...shippedCatalog.topicIds].sort(),
})

/**
 * A tap driven entirely inside the page's own JS context.
 *
 * Two separate Playwright mouse commands each cost a CDP round trip, and
 * under parallel test load that round trip can occasionally exceed the 300ms
 * hold threshold, misclassifying a tap as a hold. Dispatching both events from
 * one `evaluate` call keeps the down-to-up gap at native-call speed, so the
 * test exercises the tap/hold boundary rather than host scheduling.
 */
async function tapKey(page: Page) {
  await page.locator('.morse-key').evaluate((element) => {
    const options = { pointerId: 1, button: 0, isPrimary: true, bubbles: true, cancelable: true }
    element.dispatchEvent(new PointerEvent('pointerdown', options))
    element.dispatchEvent(new PointerEvent('pointerup', options))
  })
}

/**
 * A stray press exactly as it lands in the real world: on whatever exists at
 * that instant, or on nothing. `Locator.evaluate()` waits for `.morse-key` to
 * attach, which would let a press queued during a gap fire the moment the
 * *next* key mounts, defeating the very race this is meant to test. A direct
 * `document.querySelector` snapshot has no such wait.
 */
async function strayTap(page: Page) {
  await page.evaluate(() => {
    const key = document.querySelector('.morse-key') as HTMLButtonElement | null
    if (!key || key.disabled) return
    const options = { pointerId: 1, button: 0, isPrimary: true, bubbles: true, cancelable: true }
    key.dispatchEvent(new PointerEvent('pointerdown', options))
    key.dispatchEvent(new PointerEvent('pointerup', options))
  })
}

async function openCheckpoint(page: Page) {
  await page.addInitScript(
    ([library, storeKey, splashKey]) => {
      window.sessionStorage.setItem(splashKey, 'true')
      window.localStorage.setItem(storeKey, library)
    },
    [LIBRARY, STORE_KEY, SPLASH_KEY] as const,
  )
  await page.goto('./')
  await page.locator('.docket .index-row').click()
  await page.getByRole('button', { name: 'Start word checkpoint after lesson 4' }).click()
  await expect(page.getByText('Warm-up 1 of 4', { exact: true })).toBeVisible()
}

test('a hit is acknowledged instead of vanishing in the frame it was recorded', async ({ page }) => {
  await openCheckpoint(page)

  // E is one dit.
  await page.keyboard.type('.')
  await expect(page.getByRole('status')).toContainText('Correct')
  await expect(page.getByText('Warm-up 2 of 4', { exact: true })).toBeVisible({ timeout: 3_000 })
})

test('rapid tapping through the boundary cannot answer the letter that follows', async ({ page }) => {
  await openCheckpoint(page)

  // E is one dit.
  await tapKey(page)
  await expect(page.getByRole('status')).toContainText('Correct')

  // Hammer the same spot while the verdict is still standing and through the
  // transition behind it. These are the presses a finger still moving through
  // the boundary would genuinely produce.
  for (let press = 0; press < 8; press += 1) {
    await strayTap(page)
  }

  // Warm-up 2 is T. It must arrive un-answered: none of those presses may have
  // been spent on a letter that was not yet on screen.
  await expect(page.getByText('Warm-up 2 of 4', { exact: true })).toBeVisible({ timeout: 4_000 })
  await expect(page.locator('.morse-checkpoint-feedback')).toHaveCount(0)

  // And it is still answerable normally once the boundary has resolved.
  await expect(page.locator('.morse-key')).toBeEnabled({ timeout: 4_000 })
  await page.keyboard.type('-')
  await expect(page.getByRole('status')).toContainText('Correct')
})

test('the key is answerable, then absent under a verdict, then answerable again', async ({ page }) => {
  await openCheckpoint(page)

  await expect(page.locator('.morse-checkpoint-answer')).not.toHaveAttribute('inert', /.*/)
  await expect(page.locator('.morse-key')).toBeEnabled()

  await page.keyboard.type('.')
  await expect(page.getByRole('status')).toContainText('Correct')
  // While the verdict stands there is no key on the surface at all, so there
  // is nothing for a stray press to land on.
  await expect(page.locator('.morse-key')).toHaveCount(0)

  await expect(page.getByText('Warm-up 2 of 4', { exact: true })).toBeVisible({ timeout: 3_000 })
  await expect(page.locator('.morse-key')).toBeEnabled({ timeout: 3_000 })
  await expect(page.locator('.morse-checkpoint-answer')).not.toHaveAttribute('inert', /.*/)
})

test('the key keeps its own material through a press and never latches a touch state', async ({ page }) => {
  await openCheckpoint(page)
  const key = page.locator('.morse-key')

  const material = () => key.evaluate((element) => {
    const style = getComputedStyle(element)
    return {
      background: style.backgroundImage,
      highlight: style.getPropertyValue('-webkit-tap-highlight-color'),
    }
  })

  const resting = await material()
  expect(resting.background).toContain('gradient')
  // Chrome paints a blue wash over a tapped control unless this is cleared.
  expect(resting.highlight).toMatch(/rgba\(0, 0, 0, 0\)|transparent/)

  const box = await key.boundingBox()
  if (!box) throw new Error('Morse key has no box')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()

  // Held down: the key reports itself depressed, and its material is the same
  // brass it was at rest rather than a different hue.
  await expect(key).toHaveAttribute('data-pressed', 'true')
  expect((await material()).background).toBe(resting.background)

  await page.mouse.up()

  // Released, with the pointer still resting on it: no latched hover repaint.
  await expect(page.locator('.morse-key')).toHaveCount(0, { timeout: 4_000 })
})
