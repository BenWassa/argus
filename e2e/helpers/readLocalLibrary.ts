import type { Page } from '@playwright/test'
import type { CurrentLibrary } from '../../src/domain/library/library'

/** The app's production storage authority, not its retained v5 migration input. */
export async function readLocalLibrary(page: Page): Promise<CurrentLibrary> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const opening = indexedDB.open('argus.local.v1')
      opening.onsuccess = () => resolve(opening.result)
      opening.onerror = () => reject(opening.error)
    })
    try {
      return await new Promise<CurrentLibrary>((resolve, reject) => {
        const tx = db.transaction('libraries', 'readonly')
        const request = tx.objectStore('libraries').get('__argus_unclaimed_local__')
        request.onsuccess = () => {
          if (!request.result) reject(new Error('Expected the production library to be provisioned.'))
          else resolve(request.result.library)
        }
        request.onerror = () => reject(request.error)
      })
    } finally { db.close() }
  })
}

/** Fixture-only mutation of the canonical IndexedDB record, with sync intent. */
export async function writeLocalLibrary(page: Page, library: CurrentLibrary): Promise<void> {
  await page.evaluate(async (next) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('argus.local.v1')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(['libraries', 'outbox'], 'readwrite')
        const request = tx.objectStore('libraries').get('__argus_unclaimed_local__')
        request.onsuccess = () => {
          if (!request.result) { tx.abort(); return }
          const row = { owner: '__argus_unclaimed_local__', revision: request.result.revision + 1, library: next }
          tx.objectStore('libraries').put(row)
          tx.objectStore('outbox').put({ ...row, deletedTopicIds: [] })
        }
        tx.oncomplete = () => resolve()
        tx.onabort = () => reject(tx.error ?? new Error('Fixture transaction aborted.'))
      })
    } finally { db.close() }
  }, library)
}
