import { expect, test, type Page } from '@playwright/test'
import { seedLibrary } from '../src/domain/library/catalogSeed'
import { AVAILABLE_ROLES, COMMUNICATOR, MARINER, NAVIGATOR } from '../src/domain/roles/definitions'

const STORE = 'argus.library.v5'
const IDS = new Set<string>(AVAILABLE_ROLES.flatMap((role) => role.pathways.flatMap((path) => [...path.topicIds])))
const COMMUNICATOR_IDS = new Set<string>(COMMUNICATOR.pathways.flatMap((path) => [...path.topicIds]))
const baseline = seedLibrary().topics.map((topic) =>
  IDS.has(topic.id) ? {
    ...topic, origin: 'catalog' as const, status: 'unstarted' as const,
    drilledAt: null, completedAt: null, learningAt: null, history: [],
  } : topic,
)

async function seed(page: Page, topics = baseline) {
  const json = JSON.stringify({ version: 5, topics, catalogDelivered: [...IDS] })
  await page.addInitScript(([value, key]) => {
    if (!localStorage.getItem(key)) localStorage.setItem(key, value)
    localStorage.setItem('argus-splash-seen', 'true')
  }, [json, STORE] as const)
}

async function openWith(page: Page, earned = false, legacyDecay = false) {
  const topics = baseline.map((topic) => !COMMUNICATOR_IDS.has(topic.id) ? topic : earned ? {
    ...topic,
    status: legacyDecay && topic.id === 'nato-phonetic' ? 'decayed' as const : 'completed' as const,
    completedAt: '2026-10-07T12:00:00Z',
  } : topic)
  await seed(page, topics)
  await page.goto('./')
  await page.getByRole('button', { name: 'Roles', exact: true }).click()
}

function badge(page: Page, title: string) {
  return page.locator('.role-collection-button').filter({ has: page.locator('.role-collection-name', { hasText: title }) })
}

async function openRole(page: Page, title: string) {
  await badge(page, title).click()
  await expect(page.getByRole('dialog', { name: title })).toBeVisible()
}

async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
}

test('collection-first entry and Communicator requirements preserve topic return and focus', async ({ page }) => {
  await openWith(page)
  await expect(page.getByRole('heading', { name: 'Roles', level: 1 })).toBeVisible()
  await expect(page.getByRole('combobox', { name: 'Choose a role' })).toHaveCount(0)
  await expect(page.locator('.role-collection-button')).toHaveCount(3)
  await expect(badge(page, 'Communicator')).toContainText('Not started')
  await expect(badge(page, 'Navigator')).toContainText('Not started')
  await expect(badge(page, 'Mariner')).toContainText('Not started')
  await expect(page.locator('.roles-pathways')).toHaveCount(0)
  await openRole(page, 'Communicator')
  await expect(page).toHaveURL(/\?role=communicator/)
  await expect(page.getByText('Communicator not yet earned', { exact: true })).toBeVisible()
  await expect(page.getByText('0 of 7 topics complete', { exact: true })).toBeVisible()
  for (const heading of ['Codes & Signalling', 'Radio Fundamentals', 'Marine Communications']) {
    await expect(page.getByRole('heading', { name: heading, level: 3 })).toBeVisible()
  }
  await expect(page.locator('.role-topic button')).toHaveCount(7)
  await page.locator('.roles-medallion').evaluate((image: HTMLImageElement) => image.decode())
  await page.getByRole('button', { name: /Marine Priority Calls/i }).click()
  await expect(page.getByRole('heading', { name: 'Marine Priority Calls', level: 1 })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('dialog', { name: 'Communicator' })).toBeVisible()
  await page.getByRole('button', { name: 'Close Communicator details' }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(badge(page, 'Communicator')).toBeFocused()
  await noOverflow(page)
})

test('role history Back/Forward, reload, invalid link and direct entry', async ({ page }) => {
  await seed(page)
  await page.goto('./?role=navigator')
  await expect(page.getByRole('dialog', { name: 'Navigator' })).toBeVisible()
  await page.goBack()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.goForward()
  await expect(page.getByRole('dialog', { name: 'Navigator' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('dialog', { name: 'Navigator' })).toBeVisible()
  await page.getByRole('button', { name: 'Close Navigator details' }).click()
  await expect(page.getByRole('heading', { name: 'Roles', level: 1 })).toBeVisible()
  await expect(page).not.toHaveURL(/\?role=/)

  await openRole(page, 'Mariner')
  await page.goBack()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.goForward()
  await expect(page.getByRole('dialog', { name: 'Mariner' })).toBeVisible()

  await page.goto('./?role=diver')
  await expect(page.getByRole('heading', { name: 'Roles', level: 1 })).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page).not.toHaveURL(/\?role=/)
  await page.goto('./?role=does-not-exist')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page).not.toHaveURL(/\?role=/)
})

test('Navigator starts on topic reference and approved locked badge decodes', async ({ page }) => {
  await openWith(page)
  await openRole(page, 'Navigator')
  await expect(page.getByRole('heading', { name: 'Direction & Bearings' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'North & Maps' })).toBeVisible()
  await expect(page.locator('.role-topic button')).toHaveCount(5)
  const lockedBadge = page.locator('.roles-medallion.is-unearned.is-raster')
  await expect(lockedBadge).toHaveAttribute('src', /\/media\/roles\/navigator_locked\.png$/)
  await lockedBadge.evaluate((image: HTMLImageElement) => image.decode())
  expect(await lockedBadge.evaluate((image: HTMLImageElement) => [image.naturalWidth, image.naturalHeight])).toEqual([512, 512])
  const start = page.getByRole('button', { name: /^Start:/ })
  const title = (await start.innerText()).replace(/^Start: /, '')
  await start.click()
  await expect(page.locator('.topic-title')).toHaveText(title)
  await expect(page.locator('.session-shell')).toHaveCount(0)
  await page.goBack()
  await expect(page.getByRole('dialog', { name: 'Navigator' })).toBeVisible()
  await noOverflow(page)
})

test('Navigator award persists through topic deletion and reload; explicit reset clears it', async ({ page }) => {
  const ids = new Set<string>(NAVIGATOR.pathways.flatMap((path) => [...path.topicIds]))
  const topics = baseline.map((topic) => ids.has(topic.id) ? {
    ...topic, origin: 'catalog' as const, status: 'completed' as const,
    completedAt: '2026-10-13T12:00:00.000Z',
  } : topic)
  await seed(page, topics)
  await page.goto('./')
  await page.getByRole('button', { name: 'Roles', exact: true }).click()
  await openRole(page, 'Navigator')
  await expect(page.getByText('Navigator earned', { exact: true })).toBeVisible()
  await expect(badge(page, 'Navigator')).toContainText('Earned')
  const earnedBadge = page.locator('.roles-medallion.is-earned.is-raster')
  await expect(earnedBadge).toHaveAttribute('src', /\/media\/roles\/navigator_unlocked\.png$/)
  await earnedBadge.evaluate((image: HTMLImageElement) => image.decode())
  expect(await earnedBadge.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBe(512)

  await page.evaluate(([key, navigatorIds]) => {
    const library = JSON.parse(localStorage.getItem(key)!)
    library.topics = library.topics.filter((topic: { id: string }) => !navigatorIds.includes(topic.id))
    localStorage.setItem(key, JSON.stringify(library))
  }, [STORE, [...ids]] as const)
  await page.reload()
  await expect(page.getByRole('dialog', { name: 'Navigator' })).toBeVisible()
  await expect(page.getByText('Navigator earned', { exact: true })).toBeVisible()
  await expect(page.getByText('0 of 5 topics complete', { exact: true })).toBeVisible()
  await expect(page.locator('.roles-medallion.is-earned')).toHaveAttribute('src', /\/media\/roles\/navigator_unlocked\.png$/)
  await expect(page.locator('.role-topic-plate:disabled')).toHaveCount(5)
  await expect(page.locator('.roles-continue')).toHaveCount(0)

  await page.getByRole('button', { name: 'Close Navigator details' }).click()
  await page.getByRole('button', { name: 'Home', exact: true }).click()
  await page.getByRole('button', { name: 'Open profile', exact: true }).click()
  await page.getByRole('button', { name: 'Reset learning data' }).click()
  await page.getByRole('dialog', { name: 'Reset learning data' }).getByRole('button', { name: 'Reset data', exact: true }).click()
  await page.getByRole('button', { name: 'Roles', exact: true }).click()
  await openRole(page, 'Navigator')
  await expect(page.getByText('Navigator not yet earned', { exact: true })).toBeVisible()
  await expect(page.locator('.roles-medallion.is-unearned.is-raster')).toHaveAttribute('src', /\/media\/roles\/navigator_locked\.png$/)
})

test('Mariner retains three pathways, approved assets and permanent completion', async ({ page }) => {
  const ids = new Set<string>(MARINER.pathways.flatMap((path) => [...path.topicIds]))
  const topics = baseline.map((topic) => ids.has(topic.id) ? {
    ...topic, origin: 'catalog' as const, status: 'completed' as const,
    completedAt: '2026-10-15T12:00:00.000Z',
  } : topic)
  await seed(page, topics)
  await page.goto('./')
  await page.getByRole('button', { name: 'Roles', exact: true }).click()
  await openRole(page, 'Mariner')
  for (const heading of ['Vessels & Signals', 'Sea & Sky', 'Marine Radio']) {
    await expect(page.getByRole('heading', { name: heading, level: 3 })).toBeVisible()
  }
  await expect(page.locator('.role-topic button')).toHaveCount(7)
  await expect(page.getByText('Mariner earned', { exact: true })).toBeVisible()
  await expect(page.getByText('7 of 7 topics complete', { exact: true })).toBeVisible()
  await expect(page.locator('.roles-medallion.is-earned')).toHaveAttribute('src', /\/media\/roles\/mariner_unlocked\.png$/)
  await expect(page.locator('.roles-continue')).toHaveCount(0)
})

test('legacy decay and later optional Test do not create repair or revoke award', async ({ page }) => {
  await openWith(page, true, true)
  await openRole(page, 'Communicator')
  await expect(page.getByText('Communicator earned', { exact: true })).toBeVisible()
  await expect(page.getByText('7 of 7 topics complete', { exact: true })).toBeVisible()
  await expect(page.locator('.roles-award-refresh')).toHaveCount(0)
  await expect(page.locator('.role-topic-state.is-repair')).toHaveCount(0)
  await expect(page.locator('.roles-continue')).toHaveCount(0)
  await expect(page.locator('.roles-medallion.is-earned')).toBeVisible()
  await expect(page.locator('.roles-path-count', { hasText: 'Complete' })).toHaveCount(3)
})

test('responsive role overlay is accessible, bounded and dismissible', async ({ page }, testInfo) => {
  await openWith(page)
  await page.locator('.role-collection-badge').evaluateAll((images) => Promise.all(images.map((image) => (image as HTMLImageElement).decode())))
  await page.screenshot({ path: testInfo.outputPath('roles-overview.png'), fullPage: true })
  await badge(page, 'Navigator').focus()
  await page.keyboard.press('Enter')
  const dialog = page.getByRole('dialog', { name: 'Navigator' })
  await expect(dialog).toBeVisible()
  await expect(page.getByRole('button', { name: 'Close Navigator details' })).toBeFocused()
  await expect(page.locator('.roles-overview')).toHaveAttribute('inert', '')
  await expect(page.locator('.nav')).toHaveAttribute('inert', '')
  await page.screenshot({ path: testInfo.outputPath('role-detail.png'), fullPage: true })
  const size = await dialog.boundingBox()
  expect(size).not.toBeNull()
  if (testInfo.project.name.startsWith('phone')) {
    expect(size!.width).toBeGreaterThanOrEqual(testInfo.project.use.viewport!.width - 2)
    expect(size!.height).toBeGreaterThanOrEqual(testInfo.project.use.viewport!.height - 2)
  } else {
    expect(size!.width).toBeLessThanOrEqual(742)
    expect(size!.height).toBeLessThanOrEqual(testInfo.project.use.viewport!.height)
  }
  await noOverflow(page)
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(badge(page, 'Navigator')).toBeFocused()
  await expect(page.locator('.nav')).not.toHaveAttribute('inert', '')
})

test('24 synthetic gallery entries and 200% type do not overflow or change production roles', async ({ page }) => {
  await openWith(page)
  await page.evaluate(() => {
    const gallery = document.querySelector('.role-collection')!
    const original = gallery.querySelector('.role-collection-entry')!
    for (let i = 4; i <= 24; i++) {
      const clone = original.cloneNode(true) as HTMLElement
      clone.querySelector('.role-collection-name')!.textContent = `Fixture ${i}`
      clone.querySelector('.role-collection-status')!.textContent = i % 3 === 0 ? 'Earned' : '8 of 12 topics complete'
      gallery.appendChild(clone)
    }
  })
  await expect(page.locator('.role-collection-entry')).toHaveCount(24)
  await noOverflow(page)
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%' })
  await noOverflow(page)
  await page.reload()
  await expect(page.locator('.role-collection-entry')).toHaveCount(3)
})
