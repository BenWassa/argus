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
