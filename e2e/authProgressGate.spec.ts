import { expect, test } from '@playwright/test'

const SPLASH_KEY = 'argus-splash-seen'
const SIGNED_OUT_KEY = 'argus.test-auth.signed-out'
const UID = 'argus-e2e-user'
const UID_CACHE = `argus.library.sync.v1.${UID}`
const LEGACY = 'argus.library.v5'

const RESTORE_LIBRARY = {
  version: 5,
  topics: [
    {
      id: 'restore-proof',
      title: 'Restore proof',
      scope: 'One item used to verify cloud restore.',
      track: 'learning',
      items: [{ id: 'restore-proof-item', kind: 'forward', prompt: 'Prompt', answer: 'Answer' }],
      status: 'completed',
      createdAt: '2026-09-01T00:00:00.000Z',
      drilledAt: '2026-09-02T00:00:00.000Z',
      learningAt: '2026-09-01T00:00:00.000Z',
      completedAt: '2026-09-03T00:00:00.000Z',
      lastTestedAt: '2026-09-03T00:00:00.000Z',
      spotCheckedAt: null,
      history: [{ at: '2026-09-03T00:00:00.000Z', correct: 1, total: 1, resolvedTo: 'completed' }],
      itemEvidence: {},
      lessonProgress: {},
      origin: 'user',
    },
  ],
  catalogDelivered: [],
}

test('signed-out entry exposes no learner UI and authenticated relaunch restores automatically', async ({ page }) => {
  await page.addInitScript(([splashKey, signedOutKey]) => {
    localStorage.setItem(splashKey, 'true')
    localStorage.setItem(signedOutKey, 'true')
  }, [SPLASH_KEY, SIGNED_OUT_KEY] as const)

  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Argus' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Today' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Library' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Continue with Google' }).click()
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toHaveCount(0)
})

test('cloud copy restores after the per-UID device library is removed', async ({ page }) => {
  await page.addInitScript(([splashKey, legacyKey, raw]) => {
    localStorage.setItem(splashKey, 'true')
    localStorage.setItem(legacyKey, raw)
  }, [SPLASH_KEY, LEGACY, JSON.stringify(RESTORE_LIBRARY)] as const)

  await page.goto('./')
  await page.getByRole('button', { name: 'Library' }).click()
  await expect(page.getByText('Restore proof', { exact: true })).toBeVisible()

  // The test cloud is deliberately a separate key. Remove both learner-device
  // locations while retaining that cloud record, then relaunch as a new install.
  await page.evaluate(([cacheKey, legacyKey]) => {
    localStorage.removeItem(cacheKey)
    localStorage.removeItem(legacyKey)
  }, [UID_CACHE, LEGACY] as const)

  await page.reload()
  await page.getByRole('button', { name: 'Library' }).click()
  await expect(page.getByText('Restore proof', { exact: true })).toBeVisible()
})

test('sign-out returns to the entry boundary and survives relaunch', async ({ page }) => {
  await page.addInitScript((splashKey) => localStorage.setItem(splashKey, 'true'), SPLASH_KEY)
  await page.goto('./')
  await page.getByRole('button', { name: 'Library' }).click()
  await page.getByRole('button', { name: 'Data and backup' }).click()
  await page.getByRole('button', { name: 'Sign out' }).click()

  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Today' })).toHaveCount(0)

  await page.reload()
  await expect(page.getByRole('button', { name: 'Continue with Google' })).toBeVisible()
})
