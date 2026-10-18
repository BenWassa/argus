import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { seedLibrary } from '../src/domain/library/catalogSeed'
import type { Topic } from '../src/domain/library/topic'
import type { ItemLessonStore } from '../src/domain/morse/progress'
import { MORSE_LETTERS, type MorseLetter } from '../src/domain/morse/code'

/**
 * Post-acquisition Fluency, end to end through the real route model (#119).
 *
 * The unit tests already prove the selection, the measures and the import
 * boundary. What only a browser can prove is the seam: that the topic page
 * offer reaches `App.start` with a Fluency target, that a run keys real Morse
 * through a real pointer against a real AudioContext, that finishing one
 * writes `morseFluency` and *only* `morseFluency`, and that a reloaded entry
 * falls back to its origin rather than silently restarting a run.
 *
 * The evidence claim is the point of the file. Practice can assert storage is
 * byte-identical because it writes nothing; Fluency legitimately writes
 * statistics, so the equivalent proof is narrower and has to be made field by
 * field: everything that is not `morseFluency` comes out unchanged.
 */

const STORE_KEY = 'argus.library.v5'
const SPLASH_KEY = 'argus-splash-seen'
const MORSE_ID = 'international-morse-letters-printed'

const shippedCatalog = JSON.parse(
  readFileSync(fileURLToPath(new URL('../src/domain/library/shippedCatalog.json', import.meta.url)), 'utf8'),
) as { topicIds: string[] }

const seeded = seedLibrary()
const source = seeded.topics.find((topic) => topic.id === MORSE_ID)
if (!source) throw new Error('Seeded Morse topic missing')

/**
 * A learner who has finished the alphabet: every letter settled in Learn and
 * the acquisition anchor set. That is exactly the state Fluency is gated on.
 */
const lessonProgress: ItemLessonStore = {}
for (const item of source.items) {
  if (item.id) lessonProgress[item.id] = 'settled'
}

const morse: Topic = {
  ...source,
  status: 'learning',
  learningAt: '2026-01-01T00:00:00.000Z',
  acquisitionReadyAt: '2026-02-01T00:00:00.000Z',
  drilledAt: null,
  completedAt: null,
  lastTestedAt: null,
  spotCheckedAt: null,
  history: [],
  lessonProgress,
}

const LIBRARY = JSON.stringify({
  version: 5,
  topics: [morse],
  catalogDelivered: [...shippedCatalog.topicIds].sort(),
})

async function openApp(page: Page, library = LIBRARY) {
  await page.addInitScript(
    ([stored, storeKey, splashKey]) => {
      window.localStorage.setItem(splashKey, 'true')
      window.localStorage.setItem(storeKey, stored)
    },
    [library, STORE_KEY, SPLASH_KEY] as const,
  )
  await page.goto('./')
}

/** The same learner, but their alphabet was finished today: no check is due. */
function betweenChecks(): string {
  const now = new Date().toISOString()
  return JSON.stringify({
    version: 5,
    // Banked: the course is finished, and checked whenever the learner chooses.
    topics: [{
      ...morse,
      status: 'completed',
      learningAt: now,
      acquisitionReadyAt: now,
      drilledAt: now,
      completedAt: now,
      lastTestedAt: now,
    }],
    catalogDelivered: [...shippedCatalog.topicIds].sort(),
  })
}

/**
 * The Morse topic page, reached through Library — which is where a learner who
 * has finished the alphabet would go looking.
 */
async function openTopic(page: Page, library = LIBRARY) {
  await openApp(page, library)
  await page.locator('.nav-btn', { hasText: 'Library' }).click()
  await page.locator('.index-row').first().click()
  await expect(page.locator('.topic-title')).toBeVisible()
}

async function openChallenges(page: Page) {
  await openTopic(page)
  await page.getByRole('button', { name: 'Groups, Listen, available' }).click()
  await expect(page.locator('.fluency-run')).toBeVisible()
}

async function storedTopic(page: Page): Promise<Topic | null> {
  return page.evaluate((key) => {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw).topics as Topic[])[0] : null
  }, STORE_KEY)
}

/**
 * Key one element on the shared Morse key with a real pointer.
 *
 * Hold duration is what chooses the element, exactly as it does for the
 * learner, so this drives the shipped interaction rather than a test hook.
 */
async function keyElement(page: Page, element: '.' | '-') {
  const key = page.locator('.morse-key')
  const box = await key.boundingBox()
  if (!box) throw new Error('the Morse key has no box')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.waitForTimeout(element === '-' ? 420 : 60)
  await page.mouse.up()
}

/**
 * Key dits until the control stops accepting them.
 *
 * The test cannot know what to answer — that is the point of a sound-first
 * surface, and a headless browser cannot hear. What it can do is drive the
 * real control to completion: the key disables itself the moment the pattern
 * reaches its expected length, so four dits always complete a one-to-four
 * element target. The answer is usually wrong, which is fine. The claims under
 * test are about what a *run* writes, and a miss exercises the correction path
 * as well as a hit would.
 */
async function keyUntilAnswered(page: Page) {
  for (let element = 0; element < 4; element += 1) {
    const key = page.locator('.morse-key')
    if ((await key.count()) === 0) return
    if (await key.isDisabled()) return
    await keyElement(page, '.')
    // Past the #87 boundary before looking again: an element offered while the
    // previous one is still committing is dropped by design, and a driver that
    // raced it would silently key fewer elements than it thinks.
    await page.waitForTimeout(140)
  }
}

/**
 * Drive a whole run to its summary.
 *
 * Polls for whichever of the three states the page actually reaches — a
 * pending prompt, a correction waiting to be dismissed, or the summary —
 * rather than assuming a fixed number of steps per prompt. The same approach
 * `morseCheckpointHandoff` takes, and for the same reason: a real pointer
 * against a real response boundary does not advance on a schedule.
 */
async function runToSummary(page: Page) {
  for (let step = 0; step < 60; step += 1) {
    if ((await page.locator('.fluency-summary').count()) > 0) return

    const cont = page.getByRole('button', { name: 'Continue' })
    if ((await cont.count()) > 0) {
      if (await cont.isEnabled()) await cont.click()
      await page.waitForTimeout(240)
      continue
    }

    const play = page.getByRole('button', { name: /^Play/ })
    if ((await play.count()) > 0 && (await play.isEnabled())) await play.click()
    await expect(page.locator('.morse-key')).toBeEnabled({ timeout: 8000 })
    await keyUntilAnswered(page)
    await page.waitForTimeout(240)
  }
  throw new Error('the fluency run never reached its summary')
}

test.describe('fluency', () => {
  test('offers four modes and one current Test on the path', async ({ page }) => {
    await openTopic(page)
    for (const name of ['Key', 'Listen', 'Read', 'Free play']) {
      await expect(page.getByRole('navigation', { name: 'Play' }).getByRole('button', { name, exact: true })).toBeVisible()
    }
    await expect(page.getByRole('button', { name: 'A–Z Test, available, current' })).toBeVisible()
    await expect(page.locator('.topic-primary, .topic-options')).toHaveCount(0)
  })

  test('keeps the banked Test on the path and later tiers available', async ({ page }) => {
    await openTopic(page, betweenChecks())
    await expect(page.getByRole('button', { name: 'A–Z Test, banked, current' })).toBeVisible()
    await page.getByRole('button', { name: 'Words, Key, available' }).click()
    await expect(page.locator('.send-run')).toBeVisible()
  })

  test('copies common words by ear and records only a copy best', async ({ page }) => {
    test.setTimeout(120_000)
    await openTopic(page, betweenChecks())
    const before = await storedTopic(page)
    await page.getByRole('button', { name: 'Words, Listen, available' }).click()
    await expect(page.getByText('Hear it, write it')).toBeVisible()
    for (let prompt = 0; prompt < 10; prompt += 1) {
      const play = page.getByRole('button', { name: /^Play$|Play once more/ })
      if (prompt === 0) await play.click()
      await page.getByLabel('What you heard').fill('E')
      await page.getByRole('button', { name: 'Check' }).click()
      const cont = page.getByRole('button', { name: 'Continue' })
      // A right answer moves on by itself; a wrong one waits to be read.
      await Promise.race([
        cont.waitFor({ state: 'visible', timeout: 4000 }).then(() => cont.click()).catch(() => undefined),
        page.locator('.copy-feedback.is-correct').waitFor({ timeout: 4000 }).catch(() => undefined),
      ])
      await page.waitForTimeout(1000)
    }

    await expect(page.getByRole('heading', { name: 'Common words done' })).toBeVisible()
    const after = await storedTopic(page)
    expect(after?.morseFluency?.bests['copy:common']).toBeGreaterThanOrEqual(0)
    expect(after?.status).toBe(before?.status)
    expect(after?.itemEvidence).toEqual(before?.itemEvidence)
    expect(after?.history).toEqual(before?.history)
  })

  test('opens Free Play directly and returns to the Topic without saving', async ({ page }) => {
    await openTopic(page)
    const before = await storedTopic(page)
    await page.getByRole('button', { name: 'Free play', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Free play' })).toBeVisible()
    await page.getByRole('button', { name: 'Close' }).click()
    await expect(page.locator('.topic-title')).toBeVisible()
    expect(await storedTopic(page)).toEqual(before)
  })

  test('sends visible words with the shared key and keeps the run formative', async ({ page }, testInfo) => {
    test.setTimeout(90_000)
    await openTopic(page, betweenChecks())
    const before = await storedTopic(page)
    // The main action opens Send directly. Its formative writing semantics are unchanged.
    await page.getByRole('button', { name: 'Words, Key, available' }).click()
    await expect(page.locator('.send-run')).toBeVisible()
    await expect(page.locator('.morse-key')).toBeVisible()

    if (testInfo.project.name === 'phone-390') {
      await expect(page.locator('.morse-key')).toBeInViewport()
      const vertical = await page.evaluate(() => ({
        scroll: document.documentElement.scrollHeight,
        client: document.documentElement.clientHeight,
      }))
      expect(vertical.scroll).toBeLessThanOrEqual(vertical.client)
    }

    // One complete finite run, answering from the visible highlighted target.
    for (let prompt = 0; prompt < 5; prompt += 1) {
      for (let guard = 0; guard < 8; guard += 1) {
        if ((await page.locator('.send-review-card').count()) > 0) break
        const current = (await page.locator('.send-target .is-current').textContent())?.trim() as MorseLetter | undefined
        if (!current) throw new Error('Spotlight word lost its current letter.')
        await expect(page.locator('.morse-key')).toBeEnabled({ timeout: 4_000 })
        await page.keyboard.type(MORSE_LETTERS[current], { delay: 80 })
        await page.waitForTimeout(1400)
      }

      await expect(page.locator('.send-review-card')).toBeVisible()
      await expect(page.getByText('Received as sent')).toBeVisible()
      await page.getByRole('button', { name: prompt < 4 ? 'Next' : 'Finish round' }).click()
    }

    await expect(page.locator('.send-summary-card')).toBeVisible()
    await expect(page.getByText('100%')).toBeVisible()

    const after = await storedTopic(page)
    expect(after?.morseFluency?.bests['send:words']).toBe(100)
    expect(after?.status).toBe(before?.status)
    expect(after?.lastTestedAt).toBe(before?.lastTestedAt)
    expect(after?.itemEvidence).toEqual(before?.itemEvidence)
    expect(after?.history).toEqual(before?.history)
    expect(after?.lessonProgress).toEqual(before?.lessonProgress)

    const overflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }))
    expect(overflow.scroll).toBeLessThanOrEqual(overflow.client)
  })

  test('continuous sending decodes pauses and explicit word gaps without saving incomplete rounds', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'phone-390', 'One phone exercises the shared continuous input path.')
    test.setTimeout(90_000)
    const library = JSON.parse(betweenChecks())
    library.topics[0].morseFluency = { rung: 6, characters: {}, bests: { 'send:words': 95 } }
    await openTopic(page, JSON.stringify(library))
    const before = await storedTopic(page)
    for (const title of ['Word flow', 'Dispatch']) {
      await page.getByRole('button', { name: title === 'Word flow' ? 'Words, Key, available' : 'Messages, Key, available' }).click()
      if (title === 'Word flow') {
        // A hold is still part of the letter, even when longer than the idle pause.
        await page.keyboard.type('.')
        const key = page.locator('.morse-key')
        const box = (await key.boundingBox())!
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
        await page.mouse.down()
        await page.waitForTimeout(1200)
        await page.mouse.up()
        await page.waitForTimeout(1150)
        await expect(page.locator('.send-output-value')).toHaveText('A')
        await page.getByRole('button', { name: 'Close', exact: true }).click()
        await expect(page.getByRole('heading', { name: 'International Morse Code' })).toBeVisible()
        await page.getByRole('button', { name: 'Words, Key, available' }).click()
      }
      const target = (await page.locator('.send-target').getAttribute('aria-label'))!.replace(/^Send /, '')
      for (let index = 0; index < target.length; index += 1) {
        const character = target[index]
        if (character === ' ') {
          await page.getByRole('button', { name: 'Space', exact: true }).click()
          continue
        }
        const pattern = MORSE_LETTERS[character as MorseLetter]
        if (index === 0) {
          // Real pointer holds classify dits/dahs; later letters use the keyboard fallback.
          for (const element of pattern) {
            await keyElement(page, element as '.' | '-')
            await page.waitForTimeout(140)
          }
        } else {
          await page.keyboard.type(pattern, { delay: 80 })
        }
        await page.waitForTimeout(1150)
      }
      if (title === 'Dispatch') await page.getByRole('button', { name: 'Finish', exact: true }).click()
      await expect(page.getByText('Received as sent')).toBeVisible()
      await expect(page.locator('.send-compare dd').nth(1)).toHaveText(target)
      await page.getByRole('button', { name: 'Close', exact: true }).click()
      await expect(page.getByRole('heading', { name: 'International Morse Code' })).toBeVisible()
    }
    expect(await storedTopic(page)).toEqual(before)
  })

  test('runs Groups and records only fluency statistics', async ({ page }) => {
    // Ten prompts of real pointer input against a real AudioContext, each
    // gated by the #87 response boundary. That is genuinely slow, and it is
    // the point: nothing here is driven through a test-only path.
    test.setTimeout(150_000)
    await openChallenges(page)
    const before = await storedTopic(page)

    // Ten prompts, each played and then keyed back. The answer is never on
    // screen before the learner gives it, so the only way to know what to key
    // is to have heard it — which a headless browser cannot do. Keying the
    // wrong thing is still a valid run: the boundary claim does not depend on
    // being right, and a miss exercises the correction path too.
    await runToSummary(page)

    await expect(page.locator('.fluency-summary')).toBeVisible()
    await expect(page.getByText(/changed your saved progress/)).toBeVisible()

    const after = await storedTopic(page)
    // Something was learned about the learner…
    expect(after?.morseFluency).toBeTruthy()
    // …and nothing else moved.
    expect(after?.status).toBe(before?.status)
    expect(after?.lastTestedAt).toBe(before?.lastTestedAt)
    expect(after?.completedAt).toBe(before?.completedAt)
    expect(after?.drilledAt).toBe(before?.drilledAt)
    expect(after?.spotCheckedAt).toBe(before?.spotCheckedAt)
    expect(after?.itemEvidence).toEqual(before?.itemEvidence)
    expect(after?.history).toEqual(before?.history)
    expect(after?.lessonProgress).toEqual(before?.lessonProgress)
    expect(after?.morseReview).toEqual(before?.morseReview)
    expect(after?.acquisitionReadyAt).toBe(before?.acquisitionReadyAt)
  })

  test('normalizes a historical hub entry to the topic without adding a history stop', async ({ page }) => {
    await openTopic(page)
    const index = await page.evaluate(() => window.history.state.index as number)
    await page.evaluate(topicId => {
      window.history.replaceState({ ...window.history.state, route: {
        kind: 'run', mode: 'learn', topicIds: [topicId],
        origin: { kind: 'section', view: 'library' }, target: { kind: 'fluency' },
      } }, '')
    }, MORSE_ID)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'International Morse Code' })).toBeVisible()
    expect(await page.evaluate(() => window.history.state)).toMatchObject({
      index, route: { kind: 'topic', topicId: MORSE_ID },
    })
    await expect(page.getByRole('heading', { name: 'After the alphabet' })).toHaveCount(0)
  })

  test('never prints the prompt before it is answered', async ({ page }) => {
    await openChallenges(page)

    // A sound-first surface. If the target were on screen this would be a
    // reading exercise, and the whole measurement would be meaningless.
    const target = page.locator('.fluency-target')
    const text = (await target.textContent()) ?? ''
    expect(text).not.toMatch(/\b[A-Z]\b/)
  })

})
