import { chromium } from 'playwright'

const baseUrl = 'http://127.0.0.1:4173/argus/'
const old = '2026-08-30T12:00:00.000Z'
const library = {
  version: 3,
  topics: [
    {
      id: 'issue-15-regression',
      title: 'Test card regression',
      scope: 'Representative short, medium and long Test-card content.',
      track: 'learning',
      items: [
        { prompt: 'Kilo', answer: 'K' },
        { prompt: 'What does the O in OODA stand for?', answer: 'Observe the changing situation.' },
        {
          prompt: 'Scan for immediate danger, then check responsiveness and breathing before moving on.',
          answer: 'Use the full ABCDE sequence and reassess after each intervention before moving on.',
        },
      ],
      status: 'learning',
      createdAt: old,
      drilledAt: null,
      learningAt: old,
      completedAt: null,
      lastTestedAt: null,
      spotCheckedAt: null,
      history: [],
    },
  ],
}

const expectedScale = (text) => {
  const length = text.trim().length
  if (length <= 16) return 'short'
  if (length <= 56) return 'medium'
  return 'long'
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function openTest(browser, viewport, reducedMotion = 'no-preference') {
  const context = await browser.newContext({ viewport, reducedMotion })
  const page = await context.newPage()
  await page.addInitScript(({ seededLibrary }) => {
    sessionStorage.setItem('argus-splash-seen', 'true')
    localStorage.setItem('argus.library.v3', JSON.stringify(seededLibrary))
  }, { seededLibrary: library })
  await page.goto(baseUrl)
  await page.locator('button.index-row').click()
  await page.locator('button.flip-card').waitFor()
  return { context, page }
}

async function verifyViewport(browser, width, height) {
  const { context, page } = await openTest(browser, { width, height })
  const seenPrompts = new Set()

  for (let i = 0; i < library.topics[0].items.length; i += 1) {
    const card = page.locator('button.flip-card')
    const prompt = page.locator('.flip-front .flip-value')
    const promptText = (await prompt.textContent())?.trim() ?? ''
    const promptClass = (await prompt.getAttribute('class')) ?? ''
    const scale = expectedScale(promptText)
    seenPrompts.add(promptText)

    assert(
      scale === 'short' ? !promptClass.includes('is-') : promptClass.includes(`is-${scale}`),
      `${width}px: prompt class mismatch for ${JSON.stringify(promptText)}: ${promptClass}`,
    )

    await card.hover()
    const hoverBackground = await card.evaluate((node) => getComputedStyle(node).backgroundColor)
    assert(
      hoverBackground === 'rgba(0, 0, 0, 0)',
      `${width}px: Test card hover background leaked global button styling: ${hoverBackground}`,
    )

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }))
    assert(
      overflow.scrollWidth <= overflow.innerWidth,
      `${width}px: horizontal overflow ${overflow.scrollWidth} > ${overflow.innerWidth}`,
    )

    await card.click()
    const answer = page.locator('.flip-back .flip-value')
    const answerText = (await answer.textContent())?.trim() ?? ''
    const answerClass = (await answer.getAttribute('class')) ?? ''
    const answerScale = expectedScale(answerText)
    assert(
      answerScale === 'short' ? !answerClass.includes('is-') : answerClass.includes(`is-${answerScale}`),
      `${width}px: answer class mismatch for ${JSON.stringify(answerText)}: ${answerClass}`,
    )

    const metrics = await prompt.evaluate((node) => {
      const style = getComputedStyle(node)
      return { fontSize: style.fontSize, lineHeight: style.lineHeight, textAlign: style.textAlign }
    })
    console.log(`${width}px ${scale}: ${JSON.stringify(promptText)} ->`, metrics)

    const gotIt = page.getByRole('button', { name: 'Got it' })
    if (i < library.topics[0].items.length - 1) {
      await gotIt.click()
      await page.locator('button.flip-card').waitFor()
    } else {
      await gotIt.click()
    }
  }

  assert(seenPrompts.size === library.topics[0].items.length, `${width}px: not every card rendered`)
  await context.close()
}

async function verifyKeyboardAndReducedMotion(browser) {
  const { context, page } = await openTest(browser, { width: 390, height: 844 }, 'reduce')
  const innerTransition = await page.locator('.flip-inner').evaluate((node) => getComputedStyle(node).transitionDuration)
  const transitionSeconds = Number.parseFloat(innerTransition)
  assert(
    Number.isFinite(transitionSeconds) && transitionSeconds <= 0.001,
    `reduced motion: flip transition is ${innerTransition}`,
  )

  await page.keyboard.press('Space')
  await page.getByRole('button', { name: 'Got it' }).waitFor()
  await page.keyboard.press('ArrowRight')
  await page.locator('button.flip-card').waitFor()
  assert(await page.locator('button.flip-card').isVisible(), 'keyboard scoring did not advance to the next card')
  await context.close()
}

const browser = await chromium.launch({ headless: true })
try {
  await verifyViewport(browser, 390, 844)
  await verifyViewport(browser, 430, 932)
  await verifyViewport(browser, 1440, 900)
  await verifyKeyboardAndReducedMotion(browser)
  console.log('Issue #15 browser acceptance passed.')
} finally {
  await browser.close()
}
