import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const baseUrl = 'http://127.0.0.1:4173/argus/'
const outDir = 'artifacts/issue-11-content'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function openSeedLearn(browser, topicId, viewport, options = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: options.reducedMotion ?? 'no-preference' })
  const page = await context.newPage()
  await page.addInitScript(() => sessionStorage.setItem('argus-splash-seen', 'true'))
  await page.goto(baseUrl)
  await page.getByRole('button', { name: 'Library' }).click()
  await page.locator(`[data-row="${topicId}"]`).click()
  await page.getByRole('button', { name: /^Learn/ }).click()
  await page.locator('.learn-sheet').waitFor()
  if (options.doubleText) await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  return { context, page }
}

async function assertNoPageOverflow(page, label) {
  const metrics = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }))
  assert(metrics.scrollWidth <= metrics.innerWidth, `${label}: page overflow ${metrics.scrollWidth} > ${metrics.innerWidth}`)
}

async function capture(page, name) {
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true })
}

async function verifyOoda(browser, viewport, name, options = {}) {
  const { context, page } = await openSeedLearn(browser, 'ooda-loop', viewport, options)
  assert(await page.getByText('Briefing', { exact: true }).isVisible(), `${name}: briefing label missing`)
  assert(await page.getByRole('heading', { name: 'The four functions' }).isVisible(), `${name}: function section missing`)
  assert(await page.getByRole('heading', { name: 'Relationships that matter' }).isVisible(), `${name}: relationships section missing`)
  assert(await page.getByRole('heading', { name: 'Common simplification' }).isVisible(), `${name}: simplification section missing`)
  assert(await page.getByRole('heading', { name: 'Service incident under uncertainty' }).isVisible(), `${name}: integrated case missing`)
  assert(await page.locator('.learn-definitions dt').count() === 4, `${name}: OODA definitions incomplete`)
  assert(await page.locator('.learn-sources li').count() === 2, `${name}: provenance sources incomplete`)
  assert(await page.getByRole('heading', { name: 'Recall reference' }).isVisible(), `${name}: Recall reference separator missing`)
  assert(await page.locator('.sheet-items li').count() === 4, `${name}: OODA scored boundary is not exactly four items`)
  assert(await page.locator('.flip-card').count() === 0, `${name}: Learn acquired hidden-answer card styling`)
  await assertNoPageOverflow(page, name)
  await capture(page, name)
  await context.close()
}

async function verifyPrimarySurvey(browser, viewport, name, options = {}) {
  const { context, page } = await openSeedLearn(browser, 'primary-survey', viewport, options)
  assert(await page.getByText('Briefing', { exact: true }).isVisible(), `${name}: briefing label missing`)
  assert(await page.getByRole('heading', { name: 'Operating principles' }).isVisible(), `${name}: operating principles missing`)
  assert(await page.locator('.learn-table tbody tr').count() === 5, `${name}: ABCDE reference table incomplete`)
  assert(await page.getByRole('heading', { name: 'Deterioration during supervised clinical care' }).isVisible(), `${name}: integrated case missing`)
  assert(await page.getByRole('heading', { name: 'Limitations' }).isVisible(), `${name}: safety limitations missing`)
  assert(await page.getByText(/not first-aid or clinical training/).isVisible(), `${name}: explicit training limitation missing`)
  assert(await page.locator('.learn-sources li').count() === 2, `${name}: authoritative provenance incomplete`)
  assert(await page.locator('.sheet-items li').count() === 5, `${name}: Primary Survey scored boundary is not exactly five items`)
  await assertNoPageOverflow(page, name)
  await capture(page, name)
  await context.close()
}

async function verifyCompactTopic(browser, topicId, expectedItems, sourceHost, name) {
  const { context, page } = await openSeedLearn(browser, topicId, { width: 390, height: 844 })
  assert(await page.getByText('Concise support', { exact: true }).isVisible(), `${name}: concise support label missing`)
  assert(await page.locator('.learn-section').count() === 0, `${name}: compact topic gained briefing sections`)
  assert(await page.locator('.learn-case').count() === 0, `${name}: compact topic gained a case study`)
  assert(await page.locator('.sheet-items li').count() === expectedItems, `${name}: finite mapping count changed`)
  const href = await page.locator('.learn-sources a').first().getAttribute('href')
  assert(Boolean(href?.includes(sourceHost)), `${name}: authoritative source missing`)
  await assertNoPageOverflow(page, `${name} 390px`)
  await capture(page, `${name}-390`)
  await context.close()
}

async function verifyTestBoundary(browser, topicId, expectedPrompts, label) {
  const { context, page } = await openSeedLearn(browser, topicId, { width: 390, height: 844 })
  await page.getByRole('button', { name: 'Test me' }).click()
  await page.locator('button.flip-card').waitFor()
  const seen = new Set()
  for (let i = 0; i < expectedPrompts.length; i += 1) {
    const prompt = (await page.locator('.flip-front .flip-value').textContent())?.trim() ?? ''
    seen.add(prompt)
    assert(expectedPrompts.includes(prompt), `${label}: Learn-only content leaked into Test: ${JSON.stringify(prompt)}`)
    await page.locator('button.flip-card').click()
    const gotIt = page.getByRole('button', { name: 'Got it' })
    await gotIt.waitFor()
    await gotIt.click()
    if (i < expectedPrompts.length - 1) await page.locator('button.flip-card').waitFor()
  }
  assert(seen.size === expectedPrompts.length, `${label}: Test did not cover the complete finite boundary`)
  await context.close()
}

await mkdir(outDir, { recursive: true })
const browser = await chromium.launch({ headless: true })
try {
  await verifyCompactTopic(browser, 'nato-phonetic', 26, 'nato.int', 'nato')
  await verifyCompactTopic(browser, 'cardinal-bearings', 8, 'noaa.gov', 'bearings')
  await verifyOoda(browser, { width: 390, height: 844 }, 'ooda-390')
  await verifyOoda(browser, { width: 430, height: 932 }, 'ooda-430-200pct', { doubleText: true })
  await verifyOoda(browser, { width: 1440, height: 900 }, 'ooda-1440')
  await verifyOoda(browser, { width: 390, height: 844 }, 'ooda-390-reduced-motion', { reducedMotion: 'reduce' })
  await verifyPrimarySurvey(browser, { width: 390, height: 844 }, 'primary-survey-390')
  await verifyPrimarySurvey(browser, { width: 430, height: 932 }, 'primary-survey-430-200pct', { doubleText: true })
  await verifyTestBoundary(browser, 'ooda-loop', ['Stage 1 — name and core function', 'Stage 2 — name and core function', 'Stage 3 — name and core function', 'Stage 4 — name and core function'], 'OODA')
  await verifyTestBoundary(browser, 'primary-survey', ['Step 1 (A)', 'Step 2 (B)', 'Step 3 (C)', 'Step 4 (D)', 'Step 5 (E)'], 'Primary Survey')
  console.log('Issue #11 rendered content acceptance passed.')
} finally {
  await browser.close()
}
