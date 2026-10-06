import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('argus-splash-seen', 'true'))
  await page.goto('./')
  await page.locator('.nav-btn', { hasText: 'Library' }).click()
  await page.getByRole('button', { name: /CAF Rank Equivalencies/ }).click()
})

test('CAF rank equivalencies render the full two-direction boundary without horizontal overflow', async ({ page }) => {
  await expect(page.locator('.topic-title')).toHaveText('CAF Rank Equivalencies')
  await expect(page.locator('.topic-state-meta')).toContainText('38 items')
  await expect(page.locator('.topic-recall-cards li')).toHaveCount(38)
  await expect(page.locator('.topic-scope')).toContainText('statutory hierarchy has 17 ranks')

  await expect(page.getByText('Army / RCAF — General', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('RCN — Admiral', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('Army — Private (Basic) / RCAF — Aviator (Basic)', { exact: true }).first()).toBeVisible()
  await expect(page.getByText('RCN — Sailor 3rd Class', { exact: true }).first()).toBeVisible()

  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
    .toBeLessThanOrEqual(0)
})

test('CAF rank Learn material keeps appointment and nomenclature caveats visible', async ({ page }) => {
  await expect(page.getByText(/MCpl\/MS is an appointment/)).toBeVisible()
  await expect(page.getByText(/older Seaman designations/)).toBeVisible()

  const opener = page.getByRole('button', { name: 'Sources and limitations', exact: true })
  await opener.click()
  const dialog = page.getByRole('dialog', { name: 'Sources and limitations' })
  await expect(dialog).toContainText('QR&O Volume I, Chapter 3')
  await expect(dialog).toContainText('CAFMPI 01/26')
  await expect(dialog).toContainText('insignia recognition')
})
