import { mkdir, writeFile } from 'node:fs/promises'
import { chromium } from 'playwright'

const baseUrl = 'http://127.0.0.1:4173/argus/'
const outDir = 'artifacts/issue-28-morse'
const topicId = 'international-morse-letters-printed'
const storageKey = 'argus.library.v5'
const claim = 'Can independently recall all A–Z printed Morse mappings in both directions.'
const mappings = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---',
  K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-',
  U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..',
}
const reverse = Object.fromEntries(Object.entries(mappings).map(([letter, pattern]) => [pattern, letter]))

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function canonical(pattern) {
  return [...pattern].map((mark) => mark === '.' ? '·' : '—').join(' ')
}

function normalizePattern(text) {
  return text.replaceAll('·', '.').replaceAll('—', '-').replace(/\s+/g, '')
}

async function seedPage(context) {
  const page = await context.newPage()
  await page.addInitScript(() => sessionStorage.setItem('argus-splash-seen', 'true'))
  await page.goto(baseUrl)
  return page
}

async function openMorseTopic(page) {
  await page.getByRole('button', { name: 'Library', exact: true }).click()
  const row = page.locator(`[data-row="${topicId}"]`)
  await row.waitFor()
  await row.click()
  await page.getByRole('heading', { name: 'International Morse — Letters', exact: true }).waitFor()
  const scope = (await page.locator('.topic-scope').textContent())?.trim()
  assert(scope === claim, `Completion claim drifted: ${JSON.stringify(scope)}`)
  const itemFact = await page.locator('.topic-facts').getByText('26', { exact: true }).count()
  assert(itemFact > 0, 'Topic does not expose 26 items')
}

async function openLearn(page) {
  await openMorseTopic(page)
  await page.locator('.mode-btn').filter({ hasText: 'Learn' }).click()
  await page.locator('.learn-sheet').waitFor()
}

async function assertNoOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  assert(metrics.scrollWidth <= metrics.innerWidth, `${label}: horizontal overflow ${metrics.scrollWidth} > ${metrics.innerWidth}`)
}

async function capture(page, name) {
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true })
}

async function learnAcceptance(browser) {
  for (const [name, viewport, textScale, reducedMotion] of [
    ['morse-learn-390', { width: 390, height: 844 }, false, 'no-preference'],
    ['morse-learn-430-200pct', { width: 430, height: 932 }, true, 'no-preference'],
    ['morse-learn-390-reduced-motion', { width: 390, height: 844 }, false, 'reduce'],
  ]) {
    const context = await browser.newContext({ viewport, reducedMotion })
    const page = await seedPage(context)
    await openLearn(page)
    if (textScale) await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
    assert(await page.locator('.morse-packet').count() === 13, `${name}: expected 13 Learn packets`)
    assert(await page.locator('.morse-card svg').count() > 0, `${name}: mnemonic SVGs missing`)
    assert(await page.locator('.morse-rhythm').count() > 0, `${name}: textual rhythm fallback missing`)
    assert(await page.getByRole('button', { name: /^Play / }).count() > 0, `${name}: explicit audio controls missing`)
    if (reducedMotion === 'reduce') {
      assert(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), `${name}: reduced-motion media query not active`)
      assert(await page.locator('.morse-notation').count() > 0, `${name}: reduced motion removed sequence notation`)
    }
    await assertNoOverflow(page, name)
    await capture(page, name)
    await context.close()
  }

  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await page.addInitScript(() => {
    sessionStorage.setItem('argus-splash-seen', 'true')
    Object.defineProperty(window, 'AudioContext', { value: undefined, configurable: true })
    Object.defineProperty(window, 'webkitAudioContext', { value: undefined, configurable: true })
  })
  await page.goto(baseUrl)
  await openLearn(page)
  await page.getByRole('button', { name: /^Play / }).first().click()
  const error = page.locator('.morse-audio-error')
  await error.waitFor()
  assert((await error.textContent())?.includes('written pattern'), 'Audio failure did not explain the independent written fallback')
  assert(await page.locator('.morse-notation').first().isVisible(), 'Audio failure hid canonical notation')
  assert(await page.locator('.morse-rhythm').first().isVisible(), 'Audio failure hid spoken-rhythm text')
  await capture(page, 'morse-audio-unavailable-390')
  await context.close()
}

async function answerCard(page) {
  const rung = ((await page.locator('.test-rung-name').textContent()) ?? '').trim()
  const prompt = ((await page.locator('#prompt-heading').textContent()) ?? '').trim()

  if (rung === 'Prompted recognition' || rung === 'Delayed choice' || rung === 'Reduced cue') {
    const wanted = canonical(mappings[prompt])
    const options = page.locator('.test-option')
    await options.first().waitFor({ timeout: 3500 })
    let clicked = false
    for (let i = 0; i < await options.count(); i += 1) {
      const option = options.nth(i)
      const shown = ((await option.locator('span[aria-hidden="true"]').textContent()) ?? '').trim()
      if (shown === wanted) {
        await option.click()
        clicked = true
        break
      }
    }
    assert(clicked, `${rung}: correct option ${wanted} not found for ${prompt}`)
  } else if (rung === 'Free production') {
    for (const mark of mappings[prompt]) {
      await page.getByRole('button', { name: mark === '.' ? 'Add a dit' : 'Add a dah' }).click()
    }
    await page.getByRole('button', { name: 'Submit' }).click()
  } else if (rung === 'Free reception') {
    const letter = reverse[normalizePattern(prompt)]
    assert(Boolean(letter), `No reverse mapping for ${prompt}`)
    await page.locator('#character-entry').fill(letter)
    await page.getByRole('button', { name: 'Submit' }).click()
  } else {
    throw new Error(`Unexpected rung: ${rung}`)
  }

  const feedback = page.locator('.test-feedback')
  await feedback.waitFor()
  assert((await feedback.textContent())?.includes('Correct'), `${rung}: correct answer was not graded correct`)
  await page.getByRole('button', { name: 'Next' }).click()
  return rung
}

async function runPass(page, expectedRung, passNumber) {
  await openMorseTopic(page)
  await page.locator('.mode-btn.is-primary').click()
  await page.locator('.progressive-card').waitFor()
  const seen = new Set()
  for (let i = 0; i < 26; i += 1) {
    await page.locator('.progressive-card').waitFor()
    seen.add(await answerCard(page))
  }
  const heading = page.locator('.session-done h1')
  await heading.waitFor()
  assert(seen.size === 1 && seen.has(expectedRung), `Pass ${passNumber}: expected only ${expectedRung}, saw ${[...seen].join(', ')}`)
  const doneText = (await page.locator('.session-done').textContent()) ?? ''
  if (passNumber < 9) assert(!doneText.includes('Completed'), `Pass ${passNumber}: completion leaked before reverse A–Z coverage`)
  if (passNumber === 9) assert(doneText.includes('Completed'), 'Final reverse-direction pass did not bank completion')
  await page.getByRole('button', { name: 'Back to today' }).click()
}

async function ageTopic(page, field, days) {
  await page.evaluate(({ storageKey, topicId, field, days }) => {
    const raw = localStorage.getItem(storageKey)
    if (!raw) throw new Error(`Missing ${storageKey}`)
    const library = JSON.parse(raw)
    const topic = library.topics.find((candidate) => candidate.id === topicId)
    if (!topic) throw new Error(`Missing topic ${topicId}`)
    topic[field] = new Date(Date.now() - days * 86_400_000).toISOString()
    localStorage.setItem(storageKey, JSON.stringify(library))
  }, { storageKey, topicId, field, days })
  await page.reload()
}

async function progressionAcceptance(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await seedPage(context)
  const rungs = [
    'Prompted recognition', 'Prompted recognition',
    'Delayed choice', 'Delayed choice',
    'Reduced cue', 'Reduced cue',
    'Free production', 'Free production', 'Free reception',
  ]

  for (let pass = 1; pass <= rungs.length; pass += 1) {
    await runPass(page, rungs[pass - 1], pass)
    if (pass === 1) await ageTopic(page, 'learningAt', 2)
    if (pass === 2) await ageTopic(page, 'drilledAt', 31)
  }

  await page.waitForTimeout(100)
  const final = await page.evaluate(({ storageKey, topicId }) => {
    const library = JSON.parse(localStorage.getItem(storageKey))
    const morse = library.topics.find((candidate) => candidate.id === topicId)
    return {
      version: library.version,
      morseTopicCount: library.topics.filter((candidate) => candidate.id === topicId).length,
      status: morse.status,
      scope: morse.scope,
      itemCount: morse.items.length,
      kinds: [...new Set(morse.items.map((item) => item.kind))],
      historyTotals: morse.history.map((attempt) => attempt.total),
      directionsComplete: morse.items.every((item) => {
        const evidence = morse.itemEvidence?.[item.id]
        return (evidence?.directions?.['prompt-to-answer']?.correct ?? 0) > 0 &&
          (evidence?.directions?.['answer-to-prompt']?.correct ?? 0) > 0
      }),
    }
  }, { storageKey, topicId })

  assert(final.version === 5, 'Final browser library is not v5')
  assert(final.morseTopicCount === 1, 'Temporary #23 topic was not absorbed in place')
  assert(final.status === 'completed', `Final status is ${final.status}, not completed`)
  assert(final.scope === claim, 'Final stored completion claim drifted')
  assert(final.itemCount === 26, `Final stored deck has ${final.itemCount} units`)
  assert(final.kinds.length === 1 && final.kinds[0] === 'bidirectional', `Unexpected item kinds: ${final.kinds.join(',')}`)
  assert(final.historyTotals.length === 9 && final.historyTotals.every((total) => total === 26), 'Scheduler history no longer records 26-unit attempts')
  assert(final.directionsComplete, 'At least one A–Z mapping lacks evidence in one printed direction')

  await openMorseTopic(page)
  await capture(page, 'morse-completed-390')
  await writeFile(`${outDir}/progression.json`, JSON.stringify(final, null, 2))
  await context.close()
}

await mkdir(outDir, { recursive: true })
const browser = await chromium.launch({ headless: true })
try {
  await learnAcceptance(browser)
  await progressionAcceptance(browser)
  console.log('Issue #28 rendered/mobile curriculum acceptance passed.')
} finally {
  await browser.close()
}
