import { expect, test } from '@playwright/test'
import { seedLibrary } from '../src/domain/library/catalogSeed'

const owner = '__argus_unclaimed_local__'
const seeded = { ...seedLibrary(), version: 5 as const }

async function stored(page: import('@playwright/test').Page) {
  return page.evaluate(async (key) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open('argus.local.v1')
      open.onsuccess = () => resolve(open.result)
      open.onerror = () => reject(open.error)
    })
    const record = await new Promise<{ owner: string; revision: number; library: { topics: { id: string; title: string }[] } } | undefined>((resolve, reject) => {
      const tx = db.transaction('libraries', 'readonly')
      const req = tx.objectStore('libraries').get(key)
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => reject(req.error)
    })
    db.close()
    return record
  }, owner)
}

test('production provider migrates legacy bytes, preserves them and prefers canonical IndexedDB after reload', async ({ page }) => {
  const raw = JSON.stringify(seeded)
  await page.addInitScript((value) => {
    localStorage.setItem('argus-splash-seen', 'true')
    if (!localStorage.getItem('argus.library.v5')) localStorage.setItem('argus.library.v5', value)
  }, raw)
  await page.goto('./')
  await expect(page.getByRole('button', { name: 'Library', exact: true })).toBeVisible()
  await expect.poll(async () => (await stored(page))?.library.topics.length).toBeGreaterThan(0)
  const original = await stored(page)
  expect(original?.revision).toBe(1)
  expect(await page.evaluate(() => localStorage.getItem('argus.library.v5'))).toBe(raw)
  // A stale legacy copy can no longer replace a verified IndexedDB record.
  await page.evaluate(() => localStorage.setItem('argus.library.v5', '{broken legacy'))
  await page.reload()
  await expect(page.getByRole('button', { name: 'Library', exact: true })).toBeVisible()
  expect((await stored(page))?.library).toEqual(original?.library)
  expect(await page.evaluate(() => localStorage.getItem('argus.library.v5'))).toBe('{broken legacy')
})

test('invalid first-run legacy data is retained and blocks unsafe reseeding', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('argus-splash-seen', 'true')
    localStorage.setItem('argus.library.v5', '{damaged')
  })
  await page.goto('./')
  await expect(page.getByRole('alert')).toContainText('Existing data has not been replaced')
  expect(await page.evaluate(() => localStorage.getItem('argus.library.v5'))).toBe('{damaged')
  expect(await stored(page)).toBeUndefined()
})
