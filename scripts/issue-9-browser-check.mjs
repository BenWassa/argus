import { mkdir } from 'node:fs/promises'
import { chromium } from 'playwright'

const baseUrl = 'http://127.0.0.1:4173/argus/'
const outDir = 'artifacts/issue-9-learn'
const stamp = '2026-09-02T12:00:00.000Z'

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function seconds(cssDuration) {
  if (cssDuration.endsWith('ms')) return Number.parseFloat(cssDuration) / 1000
  return Number.parseFloat(cssDuration)
}

function baseTopic(overrides = {}) {
  return {
    id: 'issue-9-topic',
    title: 'Structured Learn acceptance',
    scope: 'Exactly two finite recall items; explanatory support is not scored.',
    track: 'learning',
    items: [
      { prompt: 'Finite prompt A', answer: 'Finite answer A' },
      { prompt: 'Finite prompt B', answer: 'Finite answer B' },
    ],
    status: 'unstarted',
    createdAt: stamp,
    drilledAt: null,
    learningAt: null,
    completedAt: null,
    lastTestedAt: null,
    spotCheckedAt: null,
    history: [],
    ...overrides,
  }
}

const concise = baseTopic({
  title: 'Concise support acceptance',
  learn: {
    kind: 'concise',
    overview: 'This small note gives context without turning a reference topic into an essay.',
    limitations: ['This is explanatory support; the two recall items remain the complete scored boundary.'],
    sources: [{ label: 'Acceptance reference', url: 'https://example.com/reference', note: 'Provenance stays visible.' }],
  },
})

const briefing = baseTopic({
  title: 'Briefing and case-study acceptance',
  scope: 'Exactly two finite recall items; a rich briefing explains relationships without expanding completion.',
  learn: {
    kind: 'briefing',
    overview: 'A compact field briefing can explain how a finite framework fits together while Test remains limited to the declared recall set.',
    sections: [
      {
        heading: 'Relationships before recall',
        blocks: [
          { type: 'paragraph', text: 'Explanatory paragraphs are short, explicit, and structurally separate from scored prompts.' },
          { type: 'bullets', items: ['Context belongs in Learn.', 'Only explicit items belong in Test.', 'Reference-only topics should not gain this structure unless it helps.'] },
          { type: 'steps', items: ['Read the bounded explanation.', 'Trace the relationships.', 'Recall only the declared finite set in Test.'] },
          {
            type: 'definitions',
            items: [
              { term: 'Scored boundary', definition: 'The finite scope and prompt/answer items that Test can score completely.' },
              { term: 'Explanatory support', definition: 'Learn-only context that improves understanding without silently changing completion.' },
            ],
          },
          {
            type: 'table',
            columns: ['Layer', 'Purpose', 'Scored?'],
            rows: [
              ['Learn support', 'Explain relationships, provenance and limitations in a compact reference briefing.', 'No'],
              ['Recall reference', 'Expose the complete finite prompt and answer set before testing.', 'Yes, through Test'],
            ],
          },
        ],
      },
    ],
    caseStudies: [
      {
        title: 'One integrated whole-framework case',
        scenario: 'A learner needs to connect several parts of a model in one changing situation rather than memorize isolated toy examples.',
        analysis: [
          {
            heading: 'Trace the model as one system',
            blocks: [
              { type: 'paragraph', text: 'The analysis follows relationships across the full case. It does not manufacture one disconnected example per stage merely to fill a template.' },
            ],
          },
        ],
        takeaway: 'Integrated application belongs in Learn; the explicit finite items still define what Test may score.',
      },
    ],
    limitations: [
      'Argus supports memory and rehearsal only; this briefing is not a credential or substitute for real training.',
      'The acceptance fixture demonstrates structure and does not ship substantive instructional content.',
    ],
    sources: [
      { label: 'Authoritative-source placeholder', url: 'https://example.com/authoritative', note: 'The renderer keeps provenance visible and subordinate.' },
    ],
  },
})

async function openLearn(browser, topic, viewport, options = {}) {
  const context = await browser.newContext({
    viewport,
    reducedMotion: options.reducedMotion ?? 'no-preference',
  })
  const page = await context.newPage()
  const library = { version: 4, topics: [topic] }
  await page.addInitScript(({ seededLibrary }) => {
    sessionStorage.setItem('argus-splash-seen', 'true')
    localStorage.setItem('argus.library.v4', JSON.stringify(seededLibrary))
  }, { seededLibrary: library })
  await page.goto(baseUrl)
  await page.locator('button.index-row').click()
  await page.locator('.learn-sheet').waitFor()
  if (options.doubleText) {
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%'
    })
  }
  return { context, page }
}

async function assertNoPageOverflow(page, label) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  assert(metrics.scrollWidth <= metrics.innerWidth, `${label}: page overflow ${metrics.scrollWidth} > ${metrics.innerWidth}`)
}

async function capture(page, name) {
  await page.screenshot({ path: `${outDir}/${name}.png`, fullPage: true })
}

async function verifyLegacyStorageMigration(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await page.addInitScript(({ legacyTopic }) => {
    sessionStorage.setItem('argus-splash-seen', 'true')
    localStorage.setItem('argus.library.v3', JSON.stringify({ version: 3, topics: [legacyTopic] }))
  }, { legacyTopic: baseTopic({ title: 'Legacy v3 reference-only topic' }) })
  await page.goto(baseUrl)
  await page.locator('button.index-row').waitFor()
  const migrated = await page.evaluate(() => JSON.parse(localStorage.getItem('argus.library.v4') ?? 'null'))
  assert(migrated?.version === 4, 'legacy storage: v3 library was not promoted to v4')
  assert(migrated.topics?.[0]?.learn === undefined, 'legacy storage: migration invented Learn support')
  await context.close()
}

async function verifyReferenceOnly(browser) {
  const { context, page } = await openLearn(browser, baseTopic({ title: 'Reference-only acceptance' }), { width: 390, height: 844 })
  assert(await page.locator('.learn-support').count() === 0, 'reference-only: rich support rendered unexpectedly')
  assert(await page.locator('.sheet-reference-title').count() === 0, 'reference-only: extra Recall reference heading should stay absent')
  assert((await page.locator('.sheet-count').textContent())?.trim() === '2 items', 'reference-only: compact item count changed')
  assert(await page.locator('.sheet-items li').count() === 2, 'reference-only: finite reference item count changed')
  await assertNoPageOverflow(page, 'reference-only 390px')
  await capture(page, 'reference-only-390')
  await context.close()
}

async function verifyConcise(browser) {
  const { context, page } = await openLearn(browser, concise, { width: 390, height: 844 })
  assert(await page.getByText('Concise support', { exact: true }).isVisible(), 'concise: support label missing')
  assert(await page.getByRole('heading', { name: 'Recall reference' }).isVisible(), 'concise: scored reference separator missing')
  assert(await page.getByRole('heading', { name: 'Limitations' }).isVisible(), 'concise: limitations missing')
  assert(await page.getByRole('heading', { name: 'Sources' }).isVisible(), 'concise: sources missing')
  assert(await page.locator('.sheet-items li').count() === 2, 'concise: support changed finite item count')
  await assertNoPageOverflow(page, 'concise 390px')
  await capture(page, 'concise-390')
  await context.close()
}

async function verifyBriefingViewport(browser, viewport, name, options = {}) {
  const { context, page } = await openLearn(browser, briefing, viewport, options)
  assert(await page.getByText('Briefing', { exact: true }).isVisible(), `${name}: briefing label missing`)
  assert(await page.getByRole('heading', { name: 'Relationships before recall' }).isVisible(), `${name}: section heading missing`)
  assert(await page.locator('.learn-definitions dt').count() === 2, `${name}: definitions missing`)
  assert(await page.locator('.learn-table th').count() === 3, `${name}: semantic table missing`)
  assert(await page.getByText('Case study', { exact: true }).isVisible(), `${name}: integrated case label missing`)
  assert(await page.getByRole('heading', { name: 'One integrated whole-framework case' }).isVisible(), `${name}: integrated case missing`)
  assert(await page.getByRole('heading', { name: 'Limitations' }).isVisible(), `${name}: limitations missing`)
  assert(await page.getByRole('heading', { name: 'Sources' }).isVisible(), `${name}: sources missing`)
  assert(await page.locator('.sheet-items li').count() === 2, `${name}: rich support changed finite item count`)
  assert(await page.locator('.flip-card').count() === 0, `${name}: Learn acquired hidden-answer card styling`)
  const supportBeforeItems = await page.evaluate(() => {
    const support = document.querySelector('.learn-support')
    const items = document.querySelector('.sheet-items')
    return Boolean(support && items && (support.compareDocumentPosition(items) & Node.DOCUMENT_POSITION_FOLLOWING))
  })
  assert(supportBeforeItems, `${name}: briefing does not precede the finite recall reference`)
  await assertNoPageOverflow(page, name)

  if (options.reducedMotion === 'reduce') {
    const motion = await page.locator('.learn-support').evaluate((node) => {
      const style = getComputedStyle(node)
      return { animationName: style.animationName, transitionDuration: style.transitionDuration }
    })
    assert(motion.animationName === 'none', `${name}: Learn support animation remains under reduced motion: ${motion.animationName}`)
    // The global reduced-motion floor is 0.01ms. Chromium serializes that as
    // 1e-05s, so accept only durations at or below the intended near-zero floor.
    assert(seconds(motion.transitionDuration) <= 0.00001, `${name}: Learn support transition remains under reduced motion: ${motion.transitionDuration}`)
  }

  await capture(page, name)
  await context.close()
}

async function verifyFiniteTestBoundary(browser) {
  const { context, page } = await openLearn(browser, briefing, { width: 390, height: 844 })
  const persisted = await page.evaluate(() => JSON.parse(localStorage.getItem('argus.library.v4') ?? 'null'))
  assert(persisted?.topics?.[0]?.learn?.caseStudies?.length === 1, 'Learn exposure transition dropped structured support')

  await page.getByRole('button', { name: 'Test me' }).click()
  await page.locator('button.flip-card').waitFor()

  const seen = new Set()
  for (let i = 0; i < 2; i += 1) {
    const prompt = (await page.locator('.flip-front .flip-value').textContent())?.trim() ?? ''
    seen.add(prompt)
    assert(prompt === 'Finite prompt A' || prompt === 'Finite prompt B', `Test leaked Learn-only content into scoring: ${JSON.stringify(prompt)}`)
    await page.locator('button.flip-card').click()
    const gotIt = page.getByRole('button', { name: 'Got it' })
    await gotIt.waitFor()
    await gotIt.click()
    if (i === 0) await page.locator('button.flip-card').waitFor()
  }
  assert(seen.size === 2, `Test did not cover exactly the two finite items: ${JSON.stringify([...seen])}`)
  await context.close()
}

await mkdir(outDir, { recursive: true })
const browser = await chromium.launch({ headless: true })
try {
  await verifyLegacyStorageMigration(browser)
  await verifyReferenceOnly(browser)
  await verifyConcise(browser)
  await verifyBriefingViewport(browser, { width: 390, height: 844 }, 'briefing-390')
  await verifyBriefingViewport(browser, { width: 430, height: 932 }, 'briefing-430-200pct', { doubleText: true })
  await verifyBriefingViewport(browser, { width: 1440, height: 900 }, 'briefing-1440')
  await verifyBriefingViewport(browser, { width: 390, height: 844 }, 'briefing-390-reduced-motion', { reducedMotion: 'reduce' })
  await verifyFiniteTestBoundary(browser)
  console.log('Issue #9 rendered browser acceptance passed.')
} finally {
  await browser.close()
}
