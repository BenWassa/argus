import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { MORSE_LETTERS, type MorseLetter } from '../src/lib/morse'
import { lessonPackets } from '../src/lib/morseLesson'
import { seedLibrary } from '../src/lib/seed'
import type { ItemLessonStore, Topic } from '../src/lib/types'

/**
 * #88: the word checkpoint after Lesson 4 must be offered automatically the
 * moment Lesson 4 settles, not discovered later as an "Available" row on the
 * path. JSDOM already proves the state machine (`MorseLesson.test.tsx`); this
 * proves a real pointer sequence on a real compositor reaches the same
 * invitation, that it is gated by the #87 transition boundary like every
 * other terminal screen, and that skipping it truly changes nothing.
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

function itemIdForGlyph(glyph: string): string {
  const item = source!.items.find((candidate) => candidate.prompt === glyph)
  if (!item?.id) throw new Error(`Missing item for ${glyph}`)
  return item.id
}

/** Settled through Lesson 3 only, so Lesson 4 — and its checkpoint — is the live boundary. */
const lessonProgress: ItemLessonStore = {}
for (const packet of lessonPackets().slice(0, 3)) {
  for (const glyph of packet.characters) lessonProgress[itemIdForGlyph(glyph)] = 'settled'
}

function library(): string {
  const morse: Topic = {
    ...source!,
    status: 'learning',
    drilledAt: null,
    learningAt: new Date().toISOString(),
    completedAt: null,
    lastTestedAt: null,
    spotCheckedAt: null,
    history: [],
    lessonProgress: { ...lessonProgress },
    // Listening questions are a separate DOM shape this spec isn't testing;
    // suppressing them keeps the drive loop on the one keyed-check shape it
    // knows how to answer, exactly like the equivalent JSDOM fixture.
    lessonSitting: { retrievals: 0, correct: 0, revisitItemIds: [], listeningSuppressed: true },
  }
  return JSON.stringify({
    version: 5,
    topics: [morse],
    catalogDelivered: [...shippedCatalog.topicIds].sort(),
  })
}

async function openLessonFour(page: Page) {
  await page.addInitScript(
    ([lib, storeKey, splashKey]) => {
      window.sessionStorage.setItem(splashKey, 'true')
      window.localStorage.setItem(storeKey, lib)
    },
    [library(), STORE_KEY, SPLASH_KEY] as const,
  )
  await page.goto('./')
  await page.locator('.docket .index-row').click()
  await page.getByRole('button', { name: /^(Start|Continue) lesson 4$/ }).click()
}

/**
 * Answer every introduction and keyed check in the current packet, correctly,
 * until either the checkpoint invitation or a guard failure. A real pointer
 * boundary (#87) separates every pair of retrievals, so this polls for
 * whichever of the two possible next states the page actually reaches rather
 * than assuming a fixed number of steps.
 */
async function driveLessonFourToInvitation(page: Page) {
  for (let step = 0; step < 40; step += 1) {
    if (await page.getByRole('button', { name: 'Start checkpoint' }).isVisible()) return

    const gotIt = page.getByRole('button', { name: 'Got it' })
    if (await gotIt.isVisible()) {
      await gotIt.click()
      continue
    }

    // Wait for the key to be live before reading the glyph: reading it first
    // risks a stale read from the outgoing target during the #87 transition,
    // paired against a key that has since armed for the next one.
    await expect(page.locator('.morse-key')).toBeEnabled({ timeout: 4_000 })
    const glyph = (await page.locator('.lesson-glyph').first().textContent())?.trim() as MorseLetter | undefined
    if (!glyph) throw new Error('Expected a keyed check glyph on screen.')
    await page.keyboard.type(MORSE_LETTERS[glyph])

    // Either the next retrieval arrives (another armed key/Got it), or this
    // was the completing answer and the invitation arrives instead. Waiting
    // on an *armed* key rather than on `.lesson-glyph` matters here: a wrong
    // answer's reteach feedback renders the same glyph class, which would
    // otherwise read as "the next question" while the verdict is still the
    // one standing on screen.
    await expect(
      page.locator('.morse-key:enabled, button:has-text("Got it"), button:has-text("Start checkpoint")').first(),
    ).toBeVisible({ timeout: 4_000 })
  }
  throw new Error('Did not reach the checkpoint invitation within 40 steps.')
}

test('Lesson 4 completion surfaces the checkpoint invitation automatically, gated like every other terminal screen', async ({ page }) => {
  await openLessonFour(page)
  await driveLessonFourToInvitation(page)

  await expect(page.getByRole('heading', { name: 'Lesson 4 complete' })).toBeVisible()
  await expect(page.getByText('Word checkpoint')).toBeVisible()
  const start = page.getByRole('button', { name: 'Start checkpoint' })
  const skip = page.getByRole('button', { name: 'Skip for now' })

  // The exact 180 ms inert interval is covered with fake timers at component
  // level. In a browser, reaching this assertion can legitimately consume
  // that whole interval, so assert the stable post-boundary state here.
  await expect(start).toBeEnabled({ timeout: 2_000 })
  await expect(page.locator('.lesson-exits[inert]')).toHaveCount(0)

  await skip.click()
  // Skipping changes nothing about the forward journey: Lesson 5 begins.
  await expect(page.getByText('Packet 5 of 13', { exact: true })).toBeVisible()
})

test('starting the invitation goes directly into the checkpoint', async ({ page }) => {
  await openLessonFour(page)
  await driveLessonFourToInvitation(page)
  await expect(page.getByRole('button', { name: 'Start checkpoint' })).toBeEnabled({ timeout: 2_000 })

  await page.getByRole('button', { name: 'Start checkpoint' }).click()
  await expect(page.getByText('Warm-up 1 of 4', { exact: true })).toBeVisible()

  // The exit seam back into the interrupted lesson is covered at unit level
  // (`MorseLesson.test.tsx`); this only needs to prove the real page reached
  // the checkpoint directly, with no stop at the lesson path in between.
  await expect(page.getByRole('heading', { name: 'Learn Morse A–Z' })).toHaveCount(0)
})

test('the checkpoint remains available on the path after the automatic invitation is skipped', async ({ page }) => {
  await openLessonFour(page)
  await driveLessonFourToInvitation(page)
  await expect(page.getByRole('button', { name: 'Skip for now' })).toBeEnabled({ timeout: 2_000 })
  await page.getByRole('button', { name: 'Skip for now' }).click()

  await expect(page.getByText('Packet 5 of 13', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Close' }).click()
  await expect(page.getByRole('button', { name: 'Start word checkpoint after lesson 4' })).toBeVisible()
})
