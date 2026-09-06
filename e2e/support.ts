import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, type Page } from '@playwright/test'
import { seedLibrary } from '../src/lib/seed'
import { swipeCommitDistance } from '../src/features/test/swipeGrade'

// Read as a file rather than imported, so this helper stays loadable by
// Playwright's plain-Node transpiler as well as by Vite.
const shippedCatalog = JSON.parse(
  readFileSync(fileURLToPath(new URL('../src/lib/shippedCatalog.json', import.meta.url)), 'utf8'),
) as { topicIds: string[] }

const STORE_KEY = 'argus.library.v5'
const SPLASH_KEY = 'argus-splash-seen'

const seeded = seedLibrary()
const nato = seeded.topics.find((topic) => topic.id === 'nato-phonetic')
if (!nato) throw new Error('the seeded library no longer ships the NATO topic')

export const NATO_ITEMS = nato.items
export const NATO_ANSWERS = nato.items.map((item) => item.answer)
export const ANSWER_FOR = new Map(nato.items.map((item) => [item.prompt, item.answer]))

/**
 * A library holding only the NATO topic, already due, so Today offers exactly
 * one thing and the run under test is unambiguous. Everything else about the
 * topic — items, order, status, history — is the shipped content untouched.
 */
const LIBRARY = JSON.stringify({
  version: 5,
  topics: [nato],
  catalogDelivered: [...shippedCatalog.topicIds].sort(),
})

export async function openNatoTest(page: Page) {
  await page.addInitScript(
    ([library, storeKey, splashKey]) => {
      window.sessionStorage.setItem(splashKey, 'true')
      window.localStorage.setItem(storeKey, library)
    },
    [LIBRARY, STORE_KEY, SPLASH_KEY] as const,
  )
  await page.goto('./')
  await page.getByRole('button', { name: /^Test one topic/ }).click()
  await expect(page.locator('.flip-card')).toBeVisible()
}

export function promptOf(page: Page) {
  return page.locator('#prompt-heading')
}

export async function currentPrompt(page: Page): Promise<string> {
  return (await promptOf(page).textContent()) ?? ''
}

export async function reveal(page: Page) {
  await page.locator('.flip-card').click()
  await expect(page.locator('.flip-card')).toHaveAttribute('aria-expanded', 'true')
}

export interface DragOptions {
  /** Signed horizontal travel. Negative is a left/incorrect swipe. */
  dx: number
  /** Signed vertical travel over the same gesture. */
  dy?: number
  /** Number of pointer moves. Few and fast reads as a flick. */
  steps?: number
  /** Milliseconds between moves. Present makes the drag deliberate and slow. */
  pause?: number
  /** End with `pointercancel` instead of releasing. */
  cancel?: boolean
  /** Stop half way and leave the pointer down. */
  hold?: boolean
}

/**
 * Drag the card with a real pointer. Playwright's mouse produces the same
 * pointer events a finger does, which is what the recogniser actually listens
 * to, so one helper covers touch and desktop input alike.
 */
export async function dragCard(page: Page, options: DragOptions) {
  const { dx, dy = 0, steps = 12, pause, cancel, hold } = options
  const card = page.locator('.flip-card')
  const box = await card.boundingBox()
  if (!box) throw new Error('the card has no box to drag')

  const viewport = page.viewportSize() ?? { width: 800, height: 600 }
  const clampX = (value: number) => Math.min(viewport.width - 3, Math.max(3, value))
  const clampY = (value: number) => Math.min(viewport.height - 3, Math.max(3, value))

  // Start off-centre against the direction of travel so the whole gesture fits
  // on a 320px screen without leaving the viewport.
  const startX = clampX(box.x + box.width / 2 - Math.sign(dx) * Math.min(Math.abs(dx) / 2, box.width * 0.3))
  const startY = clampY(box.y + box.height / 2 - Math.sign(dy) * Math.min(Math.abs(dy) / 2, box.height * 0.3))

  await page.mouse.move(startX, startY)
  await page.mouse.down()
  for (let step = 1; step <= steps; step += 1) {
    await page.mouse.move(clampX(startX + (dx * step) / steps), clampY(startY + (dy * step) / steps))
    if (pause) await page.waitForTimeout(pause)
  }
  if (hold) return
  if (cancel) {
    await page.dispatchEvent('.flip-card', 'pointercancel', { pointerId: 1, isPrimary: true })
    return
  }
  await page.mouse.up()
}

/** Travel that is unambiguously past the commit distance for this card. */
export async function committingTravel(page: Page): Promise<number> {
  const box = await page.locator('.flip-card').boundingBox()
  if (!box) throw new Error('the card has no box to measure')
  return swipeCommitDistance(box.width) + 34
}

/**
 * Watch the live document for the whole of a run and record every distinct
 * (prompt, answers present) pairing it passes through — on every animation
 * frame and on every mutation, so a single-frame flash is caught.
 */
export async function watchForAnswerLeaks(page: Page) {
  await page.evaluate((answers) => {
    const scope = window as unknown as {
      __argusLeakWatch: { samples: { prompt: string | null; seen: string[] }[]; takes: number }
    }
    scope.__argusLeakWatch = { samples: [], takes: 0 }
    const watch = scope.__argusLeakWatch
    const take = () => {
      watch.takes += 1
      const markup = document.body.innerHTML
      const prompt = document.getElementById('prompt-heading')?.textContent ?? null
      const seen = answers.filter((answer) => markup.includes(answer))
      const previous = watch.samples[watch.samples.length - 1]
      if (!previous || previous.prompt !== prompt || previous.seen.join('|') !== seen.join('|')) {
        watch.samples.push({ prompt, seen })
      }
    }
    const frame = () => {
      take()
      requestAnimationFrame(frame)
    }
    frame()
    new MutationObserver(take).observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
    })
  }, NATO_ANSWERS)
}

/**
 * The whole confidentiality claim, checked against every distinct state the
 * document actually passed through: at most one answer is ever present, and it
 * always belongs to the prompt on screen at that instant.
 */
export async function assertNoAnswerLeaked(page: Page, minimumPrompts = 1) {
  // Give the watcher a couple of frames past whatever just happened, so the
  // tail of an exit transition is sampled rather than assumed.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      }),
  )
  const watch = await page.evaluate(
    () =>
      (
        window as unknown as {
          __argusLeakWatch: { samples: { prompt: string | null; seen: string[] }[]; takes: number }
        }
      ).__argusLeakWatch,
  )
  // The watcher was genuinely running for the whole run, not stalled at zero.
  expect(watch.takes).toBeGreaterThan(2)
  const prompts = new Set(watch.samples.map((sample) => sample.prompt))
  expect(prompts.size).toBeGreaterThanOrEqual(minimumPrompts)

  for (const sample of watch.samples) {
    const allowed = sample.prompt ? ANSWER_FOR.get(sample.prompt) : undefined
    expect(
      sample.seen,
      `prompt ${JSON.stringify(sample.prompt)} had answers ${JSON.stringify(sample.seen)} on screen`,
    ).toEqual(sample.seen.length === 0 ? [] : [allowed])
  }
}

/** The `Test · N of 26` counter, as a number. */
export async function cardNumber(page: Page): Promise<number> {
  const text = (await page.locator('.session-bar .tabular').textContent()) ?? ''
  const match = /(\d+) of/.exec(text)
  return match ? Number(match[1]) : Number.NaN
}
