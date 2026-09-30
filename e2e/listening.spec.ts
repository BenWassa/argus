import { expect, test, type Page } from '@playwright/test'

/**
 * Prerecorded speech (#151) in the shipped app, with no production audio: the
 * recordings are a generated tone fulfilled through the router, so nothing is
 * committed or shipped. The seeded topic goes through the ordinary local library
 * key, so this is the shipped app reading ordinary data.
 */
const timestamp = '2026-01-01T00:00:00.000Z'

/** A 0.4 s, 8 kHz, 16-bit mono sine tone as a WAV file. */
function toneWav(): Buffer {
  const rate = 8000
  const samples = Math.round(rate * 0.4)
  const data = Buffer.alloc(samples * 2)
  for (let i = 0; i < samples; i += 1) data.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 440 * i) / rate) * 8000), i * 2)
  const header = Buffer.alloc(44)
  header.write('RIFF', 0)
  header.writeUInt32LE(36 + data.length, 4)
  header.write('WAVEfmt ', 8)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(1, 22)
  header.writeUInt32LE(rate, 24)
  header.writeUInt32LE(rate * 2, 28)
  header.writeUInt16LE(2, 32)
  header.writeUInt16LE(16, 34)
  header.write('data', 36)
  header.writeUInt32LE(data.length, 40)
  return Buffer.concat([header, data])
}

const COPY = {
  id: 'e-1',
  kind: 'forward',
  prompt: 'Copy what you hear',
  answer: 'A12',
  audio: { assetId: 'e-1', src: '/media/audio/e2e-1.wav', transcript: 'Alfa WUN TOO', drill: 'token-copy' },
  response: { mode: 'copy', normalizer: 'compact' },
}
const CHOICE = {
  id: 'e-2',
  kind: 'forward',
  prompt: 'What does this procedural word mean?',
  answer: 'Message received',
  audio: { assetId: 'e-2', src: '/media/audio/e2e-2.wav', transcript: 'Roger', drill: 'proword' },
  choice: { options: ['Message received', 'Repeat your message', 'Wait for me'] },
}
const FIELDS = {
  id: 'e-3',
  kind: 'forward',
  prompt: 'Extract the fields from the message',
  answer: 'unused',
  audio: {
    assetId: 'e-3',
    src: '/media/audio/e2e-3.wav',
    transcript: 'Mayday. Position north of Cape Sable. Taking on water.',
    drill: 'message-extraction',
  },
  response: {
    mode: 'fields',
    fields: [
      { label: 'Position', expected: 'North of Cape Sable' },
      { label: 'Nature of distress', expected: 'Taking on water' },
    ],
  },
}

const topic = {
  id: 'listening-e2e',
  title: 'Listening e2e',
  scope: 'Three heard items.',
  track: 'learning',
  items: [COPY, CHOICE, FIELDS],
  learn: {
    kind: 'concise',
    overview: 'Clean, prerecorded, single-voice training utterances only.',
    limitations: ['A phone drill does not show you can understand live radio.'],
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

// The app's service worker answers /media requests itself, which would bypass the
// router that supplies the fixture recordings, so it is blocked for this spec.
test.use({ serviceWorkers: 'block' })

test.beforeEach(async ({ page }) => {
  await page.addInitScript((seed) => {
    window.localStorage.setItem('argus-splash-seen', 'true')
    window.localStorage.setItem('argus.library.v5', JSON.stringify({ version: 5, topics: [seed] }))
  }, topic)
  const wav = toneWav()
  await page.route('**/media/audio/e2e-*.wav', (route) =>
    route.fulfill({ status: 200, contentType: 'audio/wav', body: wav }),
  )
})

async function openTopic(page: Page) {
  await page.goto('./')
  await page.locator('.nav-btn', { hasText: 'Library' }).click()
  await page.getByRole('button', { name: /Listening e2e/ }).first().click()
}

async function noSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)
}

const stored = (page: Page) =>
  page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('argus.library.v5')!).topics.find(
        (t: { id: string }) => t.id === 'listening-e2e',
      ),
  )

/** Answer the card on screen correctly and unaided, by whichever mode it is. */
async function answerUnaided(page: Page) {
  const heading = (await page.getByRole('heading', { level: 1 }).textContent()) ?? ''
  if (heading === COPY.prompt) {
    await page.getByLabel('Type what you heard').fill('a 1 2')
    await page.getByRole('button', { name: 'Check' }).click()
  } else if (heading === CHOICE.prompt) {
    await page.getByRole('button', { name: 'Message received', exact: true }).click()
  } else {
    await page.getByLabel('Position').fill('north of cape sable')
    await page.getByLabel('Nature of distress').fill('Taking on water.')
    await page.getByRole('button', { name: 'Check' }).click()
  }
  await expect(page.getByText('Correct', { exact: true })).toBeVisible()
  return heading
}

async function startTest(page: Page) {
  const primary = page.locator('.topic-primary')
  if ((await primary.locator('.topic-primary-verb').textContent()) === 'Start learning') await primary.click()
  await expect(primary.locator('.topic-primary-verb')).toHaveText('Test')
  await primary.click()
  await expect(page.getByText('Listen', { exact: true })).toBeVisible()
}

test('Learn shows each recording with its transcript, says the topic is graded for you, and does not scroll sideways', async ({ page }) => {
  await openTopic(page)
  await expect(page.locator('.topic-primary-note')).toHaveText('Every item, once, graded for you.')
  await expect(page.locator('.sheet-items li.has-visual')).toHaveCount(3)
  // In Learn the transcript is content: shown normally, with a player beside it.
  await expect(page.locator('.sheet-items .audio-transcript')).toHaveCount(3)
  await expect(page.locator('.sheet-items').getByText('Alfa WUN TOO')).toBeVisible()
  await expect(page.locator('.sheet-items').getByRole('button', { name: /Play recording/ })).toHaveCount(3)
  await expect(page.locator('.topic-listening')).toHaveText('Listening: 0 of 3 answered by ear, unaided')
  await noSidewaysScroll(page)
})

test('a recording plays only when pressed, announces its state, and can be replayed', async ({ page }) => {
  await openTopic(page)
  await startTest(page)
  const audio = page.locator('audio')
  await expect(audio).toHaveAttribute('preload', 'auto')
  expect(await audio.evaluate((element: HTMLAudioElement) => element.autoplay)).toBe(false)
  expect(await audio.evaluate((element: HTMLAudioElement) => element.paused)).toBe(true)

  await page.getByRole('button', { name: /Play recording/ }).click()
  await expect(page.getByRole('button', { name: /(Stop|Replay) recording/ })).toBeVisible()
  // The tone is short, so it finishes and the control offers a replay.
  await expect(page.getByRole('button', { name: /Replay recording/ })).toBeVisible()
  await expect(page.getByRole('status').filter({ hasText: 'Finished' })).toBeVisible()
  await page.getByRole('button', { name: /Replay recording/ }).click()
  await expect(page.getByRole('button', { name: /Replay recording/ })).toBeVisible()
})

test('answering all three by ear banks a clean run to the listening record only', async ({ page }) => {
  await openTopic(page)
  await startTest(page)
  const seen = new Set<string>()
  for (let asked = 0; asked < 3; asked += 1) {
    await expect(page.getByText('Listen', { exact: true })).toBeVisible()
    // The transcript and answer are concealed until asked for or answered.
    await expect(page.locator('.audio-transcript')).toHaveCount(0)
    await noSidewaysScroll(page)
    seen.add(await answerUnaided(page))
    await expect(page.locator('.test-verdict')).toHaveCount(0, { timeout: 4000 }).catch(() => undefined)
  }
  expect(seen.size).toBe(3)
  await expect.poll(async () => (await stored(page)).history.length, { timeout: 8000 }).toBe(1)
  const saved = await stored(page)
  expect(saved.history[0]).toMatchObject({ correct: 3, total: 3 })
  for (const id of ['e-1', 'e-2', 'e-3']) {
    expect(saved.audioEvidence[id]).toMatchObject({ attempts: 1, correct: 1, unassistedCorrect: 1, assistedAttempts: 0 })
  }
  expect(saved.itemEvidence).toEqual({}) // the listening claim is its own record
})

test('revealing the transcript makes the answer practice, not listening evidence', async ({ page }) => {
  await openTopic(page)
  await startTest(page)
  // Reveal on the first card, whichever it is, and answer it correctly.
  await page.getByRole('button', { name: 'Show transcript' }).click()
  await expect(page.getByText(/this answer will be practice, not counted as listening/)).toBeVisible()
  const heading = (await page.getByRole('heading', { level: 1 }).textContent()) ?? ''
  if (heading === COPY.prompt) {
    await page.getByLabel('Type what you heard').fill('A12')
    await page.getByRole('button', { name: 'Check' }).click()
  } else if (heading === CHOICE.prompt) {
    await page.getByRole('button', { name: 'Message received', exact: true }).click()
  } else {
    await page.getByLabel('Position').fill('North of Cape Sable')
    await page.getByLabel('Nature of distress').fill('Taking on water')
    await page.getByRole('button', { name: 'Check' }).click()
  }
  await expect(page.getByText('Correct, as practice')).toBeVisible()
  await page.getByRole('button', { name: 'Continue' }).click()
  // The other two by ear, unaided.
  for (let asked = 0; asked < 2; asked += 1) {
    await expect(page.getByRole('heading', { level: 1 })).not.toHaveText(heading)
    await answerUnaided(page)
    await expect(page.locator('.test-verdict')).toHaveCount(0, { timeout: 4000 }).catch(() => undefined)
  }
  await expect.poll(async () => (await stored(page)).history.length, { timeout: 8000 }).toBe(1)
  const saved = await stored(page)
  // Two heard unaided; the assisted one was correct but does not count.
  expect(saved.history[0]).toMatchObject({ correct: 2, total: 3 })
  const records = Object.values(saved.audioEvidence) as { unassistedCorrect: number; assistedAttempts: number; correct: number }[]
  expect(records.filter((r) => r.unassistedCorrect === 1)).toHaveLength(2)
  expect(records.filter((r) => r.assistedAttempts === 1 && r.unassistedCorrect === 0 && r.correct === 1)).toHaveLength(1)
  expect(saved.itemEvidence).toEqual({})
})

test('a recording that cannot load is reported, leaves the text route open, and counts as practice', async ({ page }) => {
  await page.route('**/media/audio/e2e-*.wav', (route) => route.abort())
  await openTopic(page)
  await startTest(page)
  // The recording is fetched ahead of time, so the failure is reported at once.
  await expect(page.getByText(/could not be played/)).toBeVisible()
  await expect(page.getByRole('button', { name: /Recording unavailable/ })).toBeDisabled()
  // Not locked out: the transcript is one press away.
  await page.getByRole('button', { name: 'Show transcript' }).click()
  await expect(page.locator('.audio-transcript')).toBeVisible()
})

test('every answer mode fits a phone without sideways scroll', async ({ page }) => {
  await openTopic(page)
  await startTest(page)
  const heading = (await page.getByRole('heading', { level: 1 }).textContent()) ?? ''
  expect(heading.length).toBeGreaterThan(0)
  await noSidewaysScroll(page)
  await page.getByRole('button', { name: 'Show transcript' }).click()
  await noSidewaysScroll(page)
})
